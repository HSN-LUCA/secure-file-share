'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Copy, Check, AlertCircle } from 'lucide-react';

interface BrandingConfig {
  id: string;
  logo_url: string | null;
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
}

interface ColorValidation {
  valid: boolean;
  wcag_aa?: boolean;
  wcag_aaa?: boolean;
  error?: string;
}

export default function BrandingManagement() {
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'logo' | 'colors' | 'domain' | 'white-label'>('logo');

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Color state
  const [colors, setColors] = useState({ primary: '#3b82f6', secondary: '#1e40af', accent: '#0ea5e9' });
  const [colorValidation, setColorValidation] = useState<Record<string, ColorValidation>>({});
  const [colorUpdating, setColorUpdating] = useState(false);

  // Domain state
  const [domain, setDomain] = useState('');
  const [domainVerifying, setDomainVerifying] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [dnsRecordName, setDnsRecordName] = useState<string | null>(null);
  const [dnsRecordValue, setDnsRecordValue] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // White-label state
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);
  const [whiteLabelUpdating, setWhiteLabelUpdating] = useState(false);

  // Company info state
  const [companyInfo, setCompanyInfo] = useState({
    company_name: '',
    company_description: '',
    support_email: '',
    support_phone: '',
  });
  const [companyUpdating, setCompanyUpdating] = useState(false);

  // Fetch branding config on mount
  useEffect(() => {
    fetchBrandingConfig();
  }, []);

  const fetchBrandingConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/branding');
      if (!response.ok) throw new Error('Failed to fetch branding config');
      const data = await response.json();
      setConfig(data);
      setColors({
        primary: data.primary_color,
        secondary: data.secondary_color,
        accent: data.accent_color,
      });
      setCompanyInfo({
        company_name: data.company_name || '',
        company_description: data.company_description || '',
        support_email: data.support_email || '',
        support_phone: data.support_phone || '',
      });
      setWhiteLabelEnabled(data.white_label_enabled);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    setLogoUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/branding/logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload logo');
      }

      const result = await response.json();
      setSuccess('Logo uploaded successfully');
      setConfig((prev) => prev ? { ...prev, logo_url: result.url } : null);
      setLogoFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  // Delete logo handler
  const handleDeleteLogo = async () => {
    if (!config?.logo_url) return;

    try {
      const response = await fetch(`/api/branding/logo?s3_key=${config.logo_url}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete logo');

      setSuccess('Logo deleted successfully');
      setConfig((prev) => prev ? { ...prev, logo_url: null } : null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Color validation handler
  const validateColor = async (color: string) => {
    try {
      const response = await fetch(`/api/branding/colors/validate?color=${encodeURIComponent(color)}`);
      if (!response.ok) throw new Error('Failed to validate color');
      return await response.json();
    } catch (err) {
      return { valid: false, error: 'Validation failed' };
    }
  };

  // Update colors handler
  const handleUpdateColors = async () => {
    setColorUpdating(true);
    setError(null);

    try {
      // Validate all colors first
      const validations = await Promise.all([
        validateColor(colors.primary),
        validateColor(colors.secondary),
        validateColor(colors.accent),
      ]);

      setColorValidation({
        primary: validations[0],
        secondary: validations[1],
        accent: validations[2],
      });

      if (!validations.every((v) => v.valid)) {
        throw new Error('One or more colors are invalid');
      }

      const response = await fetch('/api/branding/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_color: colors.primary,
          secondary_color: colors.secondary,
          accent_color: colors.accent,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update colors');
      }

      setSuccess('Colors updated successfully');
      await fetchBrandingConfig();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setColorUpdating(false);
    }
  };

  // Generate domain verification handler
  const handleGenerateDomainVerification = async () => {
    if (!domain) {
      setError('Please enter a domain');
      return;
    }

    setDomainVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/branding/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate verification');
      }

      const result = await response.json();
      setDnsRecordName(result.verification_instructions.record_name);
      setDnsRecordValue(result.verification_instructions.record_value);
      setSuccess('Verification token generated. Add the DNS record and click verify.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDomainVerifying(false);
    }
  };

  // Verify domain handler
  const handleVerifyDomain = async () => {
    if (!domain) {
      setError('Please enter a domain');
      return;
    }

    setDomainVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/branding/domain', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to verify domain');
      }

      setSuccess('Domain verified successfully');
      setConfig((prev) => prev ? { ...prev, custom_domain: domain, domain_verified: true } : null);
      setDomain('');
      setDnsRecordName(null);
      setDnsRecordValue(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDomainVerifying(false);
    }
  };

  // Toggle white-label handler
  const handleToggleWhiteLabel = async () => {
    setWhiteLabelUpdating(true);
    setError(null);

    try {
      const response = await fetch('/api/branding/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !whiteLabelEnabled }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to toggle white-label');
      }

      setSuccess(`White-label mode ${!whiteLabelEnabled ? 'enabled' : 'disabled'}`);
      setWhiteLabelEnabled(!whiteLabelEnabled);
      await fetchBrandingConfig();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWhiteLabelUpdating(false);
    }
  };

  // Update company info handler
  const handleUpdateCompanyInfo = async () => {
    setCompanyUpdating(true);
    setError(null);

    try {
      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyInfo),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update company info');
      }

      setSuccess('Company information updated successfully');
      await fetchBrandingConfig();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCompanyUpdating(false);
    }
  };

  // Copy to clipboard handler
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return <div className="text-center py-8">Loading branding configuration...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Branding Management</h1>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-200">
        {(['logo', 'colors', 'domain', 'white-label'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Logo Tab */}
      {activeTab === 'logo' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Upload Logo</h2>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              {config?.logo_url ? (
                <div className="space-y-4">
                  <img src={config.logo_url} alt="Logo" className="h-32 mx-auto" />
                  <button
                    onClick={handleDeleteLogo}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Logo
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">Drag and drop your logo here or click to browse</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={logoUploading}
                    className="hidden"
                    id="logo-input"
                  />
                  <label
                    htmlFor="logo-input"
                    className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
                  >
                    {logoUploading ? 'Uploading...' : 'Choose File'}
                  </label>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-2">Supported formats: JPEG, PNG, WebP, SVG (Max 5MB)</p>
          </div>
        </div>
      )}

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Color Scheme</h2>
            <div className="grid grid-cols-3 gap-6">
              {(['primary', 'secondary', 'accent'] as const).map((colorType) => (
                <div key={colorType}>
                  <label className="block text-sm font-medium text-slate-900 mb-2 capitalize">
                    {colorType} Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={colors[colorType]}
                      onChange={(e) => setColors({ ...colors, [colorType]: e.target.value })}
                      className="w-12 h-10 rounded border border-slate-300"
                    />
                    <input
                      type="text"
                      value={colors[colorType]}
                      onChange={(e) => setColors({ ...colors, [colorType]: e.target.value })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="#000000"
                    />
                  </div>
                  {colorValidation[colorType] && (
                    <div className="mt-2 text-sm">
                      {colorValidation[colorType].valid ? (
                        <div className="text-green-600">
                          <p>✓ Valid color</p>
                          {colorValidation[colorType].wcag_aaa && <p>✓ WCAG AAA compliant</p>}
                          {colorValidation[colorType].wcag_aa && !colorValidation[colorType].wcag_aaa && (
                            <p>✓ WCAG AA compliant</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-red-600">✗ {colorValidation[colorType].error}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={handleUpdateColors}
              disabled={colorUpdating}
              className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-400"
            >
              {colorUpdating ? 'Updating...' : 'Update Colors'}
            </button>
          </div>
        </div>
      )}

      {/* Domain Tab */}
      {activeTab === 'domain' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Custom Domain</h2>
            {config?.domain_verified ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">✓ Domain verified: {config.custom_domain}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="example.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
                <button
                  onClick={handleGenerateDomainVerification}
                  disabled={domainVerifying}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-400"
                >
                  {domainVerifying ? 'Generating...' : 'Generate Verification Token'}
                </button>

                {dnsRecordName && dnsRecordValue && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                    <p className="font-medium text-slate-900">Add this DNS record to your domain:</p>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">Record Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={dnsRecordName}
                          readOnly
                          className="flex-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg"
                        />
                        <button
                          onClick={() => handleCopy(dnsRecordName, 'name')}
                          className="px-3 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
                        >
                          {copiedField === 'name' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">Record Value</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={dnsRecordValue}
                          readOnly
                          className="flex-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg font-mono text-sm"
                        />
                        <button
                          onClick={() => handleCopy(dnsRecordValue, 'value')}
                          className="px-3 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
                        >
                          {copiedField === 'value' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleVerifyDomain}
                      disabled={domainVerifying}
                      className="w-full px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-slate-400"
                    >
                      {domainVerifying ? 'Verifying...' : 'Verify Domain'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* White-Label Tab */}
      {activeTab === 'white-label' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">White-Label Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">White-Label Mode</p>
                  <p className="text-sm text-slate-600">Hide default branding and use your custom branding</p>
                </div>
                <button
                  onClick={handleToggleWhiteLabel}
                  disabled={whiteLabelUpdating}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    whiteLabelEnabled
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  } disabled:bg-slate-400`}
                >
                  {whiteLabelUpdating ? 'Updating...' : whiteLabelEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> White-label mode requires a custom domain to be verified and a logo to be uploaded.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-slate-900">Company Information</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={companyInfo.company_name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, company_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Company Description</label>
                  <textarea
                    value={companyInfo.company_description}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, company_description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={companyInfo.support_email}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, support_email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Support Phone</label>
                  <input
                    type="tel"
                    value={companyInfo.support_phone}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, support_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <button
                  onClick={handleUpdateCompanyInfo}
                  disabled={companyUpdating}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-400"
                >
                  {companyUpdating ? 'Updating...' : 'Update Company Info'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
