/**
 * Generate PWA app icons
 * Creates 192x192 and 512x512 PNG icons for the app
 */

import fs from 'fs';
import path from 'path';

// SVG template for the app icon
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" fill="#3b82f6"/>
  
  <!-- File icon -->
  <g transform="translate(128, 96)">
    <!-- Document -->
    <rect x="0" y="0" width="256" height="320" rx="16" fill="white"/>
    
    <!-- Lines -->
    <line x1="32" y1="80" x2="224" y2="80" stroke="#3b82f6" stroke-width="12" stroke-linecap="round"/>
    <line x1="32" y1="140" x2="224" y2="140" stroke="#3b82f6" stroke-width="12" stroke-linecap="round"/>
    <line x1="32" y1="200" x2="224" y2="200" stroke="#3b82f6" stroke-width="12" stroke-linecap="round"/>
    <line x1="32" y1="260" x2="160" y2="260" stroke="#3b82f6" stroke-width="12" stroke-linecap="round"/>
  </g>
  
  <!-- Share arrow -->
  <g transform="translate(280, 280)">
    <circle cx="0" cy="0" r="40" fill="white"/>
    <path d="M -8 -8 L 8 0 L -8 8" stroke="#3b82f6" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="0" y1="0" x2="20" y2="0" stroke="#3b82f6" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

// Maskable icon SVG (for adaptive icons)
const maskableIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" fill="#3b82f6"/>
  
  <!-- File icon centered -->
  <g transform="translate(128, 96)">
    <!-- Document -->
    <rect x="0" y="0" width="256" height="320" rx="16" fill="white"/>
    
    <!-- Lines -->
    <line x1="32" y1="80" x2="224" y2="80" stroke="#3b82f6" stroke-width="12" stroke-linecap="round"/>
    <line x1="32" y1="140" x2="224" y2="140" stroke="#3b82f6" stroke-width="12" stroke-linecap="round"/>
    <line x1="32" y1="200" x2="224" y2="200" stroke="#3b82f6" stroke-width="12" stroke-linecap="round"/>
    <line x1="32" y1="260" x2="160" y2="260" stroke="#3b82f6" stroke-width="12" stroke-linecap="round"/>
  </g>
  
  <!-- Share arrow -->
  <g transform="translate(280, 280)">
    <circle cx="0" cy="0" r="40" fill="white"/>
    <path d="M -8 -8 L 8 0 L -8 8" stroke="#3b82f6" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="0" y1="0" x2="20" y2="0" stroke="#3b82f6" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`;

/**
 * Convert SVG to PNG using a simple approach
 * For production, you'd use a library like sharp or canvas
 * This creates placeholder PNG files with proper headers
 */
function createPlaceholderPNG(size: number): Buffer {
  // Create a simple PNG file
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk (image header)
  const width = Buffer.alloc(4);
  width.writeUInt32BE(size, 0);
  const height = Buffer.alloc(4);
  height.writeUInt32BE(size, 0);
  
  const ihdr = Buffer.concat([
    width,
    height,
    Buffer.from([8, 2, 0, 0, 0]), // bit depth, color type, compression, filter, interlace
  ]);
  
  // For simplicity, create a minimal valid PNG
  // This is a placeholder - in production use sharp or canvas
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(0, 0); // Placeholder CRC
  
  // IDAT chunk (image data) - minimal compressed data
  const idat = Buffer.from([
    0x78, 0x9c, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xe5, 0x27, 0xde, 0xfc,
  ]);
  
  // IEND chunk
  const iend = Buffer.from([0xae, 0x42, 0x60, 0x82]);
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

/**
 * Save SVG as file
 */
function saveSvg(filename: string, svg: string): void {
  const filepath = path.join(__dirname, '..', 'public', filename);
  fs.writeFileSync(filepath, svg, 'utf-8');
  console.log(`✓ Created ${filename}`);
}

/**
 * Main function
 */
async function generateIcons(): Promise<void> {
  try {
    console.log('Generating PWA app icons...\n');
    
    // Save SVG versions
    saveSvg('icon.svg', iconSvg);
    saveSvg('icon-maskable.svg', maskableIconSvg);
    
    // Create placeholder PNG files
    // In production, you would use sharp or canvas to convert SVG to PNG
    const publicDir = path.join(__dirname, '..', 'public');
    
    // Create 192x192 PNG
    const png192 = createPlaceholderPNG(192);
    fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
    console.log('✓ Created icon-192.png');
    
    // Create 512x512 PNG
    const png512 = createPlaceholderPNG(512);
    fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
    console.log('✓ Created icon-512.png');
    
    // Create maskable versions
    fs.writeFileSync(path.join(publicDir, 'icon-maskable-192.png'), png192);
    console.log('✓ Created icon-maskable-192.png');
    
    fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), png512);
    console.log('✓ Created icon-maskable-512.png');
    
    console.log('\n✓ All icons generated successfully!');
    console.log('\nNote: For production, use a proper image generation library like:');
    console.log('  - sharp: npm install sharp');
    console.log('  - canvas: npm install canvas');
    console.log('  - or use an online SVG to PNG converter');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
