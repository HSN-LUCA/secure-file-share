import { query as dbQuery } from '@/lib/db/pool';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import crypto from 'crypto';

interface BrandingConfig {
  id: string;
  user_id: string;
  logo_url: string | null;
  logo_s3_key: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  custom_domain: string | null;
  domain_verified: boolean;
  white_label_enabled: boolean;
  company_name: string | null;
  company_description: string | null;
  support_email: string | null;
  support_phone: string | null;
  created_at: string;
  updated_at: string;
}

interface ColorValidationResult {
  valid: boolean;
  error?: string;
  wcag_aa?: boolean;
  wcag_aaa?: boolean;
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Get branding configuration for a user
 */
export async function getBrandingConfig(userId: string): Promise<BrandingConfig | null> {
  try {
    const result = await dbQuery(
      'SELECT * FROM branding_configs WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching branding config:', error);
    throw error;
  }
}

/**
 * Create or update branding configuration
 */
export async function upsertBrandingConfig(
  userId: string,
  config: Partial<BrandingConfig>
): Promise<BrandingConfig> {
  try {
    const result = await dbQuery(
      `INSERT INTO branding_configs (user_id, primary_color, secondary_color, accent_color, company_name, company_description, support_email, support_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
         primary_color = COALESCE($2, branding_configs.primary_color),
         secondary_color = COALESCE($3, branding_configs.secondary_color),
         accent_color = COALESCE($4, branding_configs.accent_color),
         company_name = COALESCE($5, branding_configs.company_name),
         company_description = COALESCE($6, branding_configs.company_description),
         support_email = COALESCE($7, branding_configs.support_email),
         support_phone = COALESCE($8, branding_configs.support_phone),
         updated_at = NOW()
       RETURNING *`,
      [
        userId,
        config.primary_color || '#3b82f6',
        config.secondary_color || '#1e40af',
        config.accent_color || '#0ea5e9',
        config.company_name || null,
        config.company_description || null,
        config.support_email || null,
        config.support_phone || null,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error upserting branding config:', error);
    throw error;
  }
}

/**
 * Validate hex color code and check WCAG compliance
 */
export function validateColor(color: string): ColorValidationResult {
  // Check if valid hex color
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexRegex.test(color)) {
    return { valid: false, error: 'Invalid hex color format' };
  }

  // Expand 3-digit hex to 6-digit
  let expandedColor = color;
  if (color.length === 4) {
    expandedColor = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }

  // Calculate relative luminance for WCAG compliance
  const rgb = hexToRgb(expandedColor);
  if (!rgb) {
    return { valid: false, error: 'Could not parse color' };
  }

  const luminance = calculateLuminance(rgb);
  const whiteContrast = calculateContrast(luminance, 1); // White background
  const blackContrast = calculateContrast(luminance, 0); // Black background

  return {
    valid: true,
    wcag_aa: whiteContrast >= 4.5 || blackContrast >= 4.5,
    wcag_aaa: whiteContrast >= 7 || blackContrast >= 7,
  };
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance (WCAG formula)
 */
function calculateLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio (WCAG formula)
 */
function calculateContrast(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Upload and optimize logo image
 */
export async function uploadLogo(
  userId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ url: string; s3Key: string; width: number; height: number }> {
  try {
    // Validate image type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(mimeType)) {
      throw new Error('Invalid image type. Only JPEG, PNG, WebP, and SVG are allowed.');
    }

    // Optimize image with sharp
    let optimizedBuffer = fileBuffer;
    let metadata = { width: 0, height: 0 };

    if (mimeType !== 'image/svg+xml') {
      const image = sharp(fileBuffer);
      metadata = await image.metadata();

      // Resize if too large (max 500px width)
      if (metadata.width && metadata.width > 500) {
        optimizedBuffer = await image.resize(500, 500, { fit: 'inside', withoutEnlargement: true }).toBuffer();
      } else {
        optimizedBuffer = await image.toBuffer();
      }
    }

    // Generate S3 key
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString('hex');
    const s3Key = `branding/logos/${userId}/${timestamp}-${randomStr}-${fileName}`;

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || '',
        Key: s3Key,
        Body: optimizedBuffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000', // 1 year cache
      })
    );

    // Generate public URL
    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    // Store logo upload record
    await dbQuery(
      `INSERT INTO logo_uploads (branding_config_id, s3_key, file_name, file_size, mime_type, width, height, is_active)
       SELECT id, $2, $3, $4, $5, $6, $7, true FROM branding_configs WHERE user_id = $1`,
      [userId, s3Key, fileName, optimizedBuffer.length, mimeType, metadata.width || 0, metadata.height || 0]
    );

    // Update branding config with logo URL
    await dbQuery(
      'UPDATE branding_configs SET logo_url = $1, logo_s3_key = $2, updated_at = NOW() WHERE user_id = $3',
      [url, s3Key, userId]
    );

    return {
      url,
      s3Key,
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
}

/**
 * Delete logo from S3
 */
export async function deleteLogo(userId: string, s3Key: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || '',
        Key: s3Key,
      })
    );

    // Update branding config
    await dbQuery(
      'UPDATE branding_configs SET logo_url = NULL, logo_s3_key = NULL, updated_at = NOW() WHERE user_id = $1',
      [userId]
    );
  } catch (error) {
    console.error('Error deleting logo:', error);
    throw error;
  }
}

/**
 * Update color scheme
 */
export async function updateColorScheme(
  userId: string,
  primaryColor: string,
  secondaryColor: string,
  accentColor: string
): Promise<BrandingConfig> {
  try {
    // Validate colors
    const primaryValidation = validateColor(primaryColor);
    const secondaryValidation = validateColor(secondaryColor);
    const accentValidation = validateColor(accentColor);

    if (!primaryValidation.valid || !secondaryValidation.valid || !accentValidation.valid) {
      throw new Error('Invalid color format');
    }

    const result = await dbQuery(
      `UPDATE branding_configs 
       SET primary_color = $1, secondary_color = $2, accent_color = $3, updated_at = NOW()
       WHERE user_id = $4
       RETURNING *`,
      [primaryColor, secondaryColor, accentColor, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Branding config not found');
    }

    // Log the change
    await logBrandingChange(userId, 'color_change', { colors: { primaryColor, secondaryColor, accentColor } });

    return result.rows[0];
  } catch (error) {
    console.error('Error updating color scheme:', error);
    throw error;
  }
}

/**
 * Generate domain verification token
 */
export async function generateDomainVerification(
  userId: string,
  domain: string
): Promise<{ token: string; dnsRecordName: string; dnsRecordValue: string }> {
  try {
    // Validate domain format
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      throw new Error('Invalid domain format');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const dnsRecordName = `_fileshare.${domain}`;
    const dnsRecordValue = token;

    // Get branding config
    const brandingConfig = await getBrandingConfig(userId);
    if (!brandingConfig) {
      throw new Error('Branding config not found');
    }

    // Store verification record
    await dbQuery(
      `INSERT INTO domain_verifications (branding_config_id, domain, verification_token, dns_record_name, dns_record_value, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days')`,
      [brandingConfig.id, domain, token, dnsRecordName, dnsRecordValue]
    );

    return { token, dnsRecordName, dnsRecordValue };
  } catch (error) {
    console.error('Error generating domain verification:', error);
    throw error;
  }
}

/**
 * Verify custom domain
 */
export async function verifyCustomDomain(userId: string, domain: string): Promise<boolean> {
  try {
    // In production, you would perform actual DNS lookup here
    // For now, we'll mark as verified after checking the verification record exists
    const result = await dbQuery(
      `UPDATE domain_verifications 
       SET verified_at = NOW()
       WHERE domain = $1 AND branding_config_id = (SELECT id FROM branding_configs WHERE user_id = $2)
       RETURNING id`,
      [domain, userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    // Update branding config
    await dbQuery(
      'UPDATE branding_configs SET custom_domain = $1, domain_verified = true, updated_at = NOW() WHERE user_id = $2',
      [domain, userId]
    );

    // Log the change
    await logBrandingChange(userId, 'domain_update', { domain });

    return true;
  } catch (error) {
    console.error('Error verifying domain:', error);
    throw error;
  }
}

/**
 * Enable/disable white-label mode
 */
export async function toggleWhiteLabel(userId: string, enabled: boolean): Promise<BrandingConfig> {
  try {
    const result = await dbQuery(
      `UPDATE branding_configs 
       SET white_label_enabled = $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      [enabled, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Branding config not found');
    }

    // Log the change
    await logBrandingChange(userId, 'white_label_toggle', { enabled });

    return result.rows[0];
  } catch (error) {
    console.error('Error toggling white-label:', error);
    throw error;
  }
}

/**
 * Log branding configuration changes
 */
async function logBrandingChange(
  userId: string,
  action: string,
  newValue: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const brandingConfig = await getBrandingConfig(userId);
    if (!brandingConfig) return;

    await dbQuery(
      `INSERT INTO branding_audit_logs (branding_config_id, user_id, action, new_value, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [brandingConfig.id, userId, action, JSON.stringify(newValue), ipAddress || null, userAgent || null]
    );
  } catch (error) {
    console.error('Error logging branding change:', error);
  }
}

/**
 * Get branding audit logs
 */
export async function getBrandingAuditLogs(userId: string, limit: number = 50): Promise<any[]> {
  try {
    const result = await dbQuery(
      `SELECT * FROM branding_audit_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}
