'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, Download, Search, Copy, Share2 } from 'lucide-react';
import MagneticButton from '@/components/ui/MagneticButton';

// VIP theme palette — matches app gold theme
const VIP = {
  primary: '#D4A017',
  primaryLight: '#F5C842',
  bg: '#fdf6ec',
  bgDeep: '#faf4f0',
  border: '#E8C547',
  text: '#1a1a2e',
  textMuted: '#8a9bb5',
};

interface FileInfo {
  id?: string;
  fileName: string;
  fileSize: number;
  expiresAt: string;
}

interface LookupResult {
  isGroup: boolean;
  files?: FileInfo[];
  fileName?: string;
  fileSize?: number;
  expiresAt?: string;
}

interface UploadResult {
  fileName: string;
  shareCode: string;
  error?: string;
}

function generateGroupCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getCaptchaToken(): Promise<string> {
  try {
    const grecaptcha = await new Promise<any>((resolve) => {
      const start = Date.now();
      const check = () => {
        const g = (window as any).grecaptcha;
        if (g?.ready) return resolve(g);
        if (Date.now() - start > 5000) return resolve(null);
        setTimeout(check, 100);
      };
      check();
    });
    if (grecaptcha) {
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!.trim();
      return await new Promise<string>((resolve, reject) => {
        grecaptcha.ready(async () => {
          try {
            resolve(await grecaptcha.execute(siteKey, { action: 'upload' }));
          } catch (e) { reject(e); }
        });
      });
    }
  } catch {}
  return 'dev-token-' + Math.random().toString(36).substring(2, 11);
}

export default function VipPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shareCode, setShareCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLookup = async () => {
    const code = shareCode.trim();
    if (!code) return;
    setLookupLoading(true);
    setLookupError('');
    setLookupResult(null);
    try {
      const res = await fetch(`/api/download/${code}?info=true`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLookupError('No files found for this code. Please check and try again.');
      } else {
        setLookupResult(data);
      }
    } catch {
      setLookupError('Something went wrong. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) {
      setFiles(prev => {
        const names = new Set(prev.map(f => f.name));
        return [...prev, ...selected.filter(f => !names.has(f.name))];
      });
      setUploadError('');
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setUploadError('');
    setResults([]);

    const uploadResults: UploadResult[] = [];
    const groupCode = generateGroupCode();

    for (const file of files) {
      try {
        const captchaToken = await getCaptchaToken();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('captcha_token', captchaToken);
        formData.append('share_number', groupCode);

        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await response.json();

        if (data.shareCode) {
          uploadResults.push({ fileName: file.name, shareCode: data.shareCode });
        } else {
          uploadResults.push({ fileName: file.name, shareCode: '', error: data.error || 'Upload failed' });
        }
      } catch {
        uploadResults.push({ fileName: file.name, shareCode: '', error: 'Upload failed' });
      }
    }

    setResults(uploadResults);
    setFiles([]);
    setUploading(false);
  };

  const reset = () => {
    setResults([]);
    setFiles([]);
    setUploadError('');
  };

  const successResults = results.filter(r => r.shareCode);
  const failedResults = results.filter(r => !r.shareCode);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareCode2 = async (code: string) => {
    if (navigator.share) {
      await navigator.share({ title: 'HodHod — File Share Code', text: `Your HodHod share code: ${code}` });
    } else {
      copyCode(code);
    }
  };

  if (results.length > 0) {
    const groupCode = successResults[0]?.shareCode || '';

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #fdf6ec 0%, #faf4f0 50%, #f5f0f8 100%)' }}>
        <motion.div
          className="w-full max-w-sm sm:max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2" style={{ color: VIP.text }}>
            {successResults.length} of {results.length} file{results.length > 1 ? 's' : ''} uploaded
          </h2>

          {groupCode && (
            <motion.div
              className="rounded-xl p-6 mb-4 text-center"
              style={{ backgroundColor: VIP.bg, border: `1px solid ${VIP.border}` }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-sm mb-2" style={{ color: VIP.textMuted }}>Share code for all files</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-4xl font-mono font-bold tracking-widest" style={{ color: VIP.primary }}>{groupCode}</p>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => copyCode(groupCode)}
                    title="Copy code"
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: copied ? '#22c55e' : VIP.primary }}
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => shareCode2(groupCode)}
                    title="Share code"
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: VIP.primary }}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: VIP.textMuted }}>Use this code to download all {successResults.length} file{successResults.length > 1 ? 's' : ''}</p>
            </motion.div>
          )}

          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
            {successResults.map((r, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: VIP.bg }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
              >
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-sm truncate" style={{ color: VIP.text }}>{r.fileName}</p>
              </motion.div>
            ))}
            {failedResults.map((r, i) => (
              <div key={i} className="bg-red-50 rounded-lg px-3 py-2">
                <p className="text-sm font-medium truncate" style={{ color: VIP.text }}>{r.fileName}</p>
                <p className="text-xs text-red-600">{r.error}</p>
              </div>
            ))}
          </div>

          <MagneticButton
            className="w-full px-6 py-3 text-white font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: VIP.primary }}
            onClick={reset}
          >
            Upload More Files
          </MagneticButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #fdf6ec 0%, #faf4f0 50%, #f5f0f8 100%)' }}>
      <motion.div
        className="flex flex-col items-center justify-center w-full max-w-xs sm:max-w-sm md:max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Upload circle */}
        <motion.div
          className="relative w-48 h-48 mb-8 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
        >
          <motion.svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 200 200"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' as const }}
          >
            <defs>
              <linearGradient id="gradient-vip" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={VIP.primaryLight} />
                <stop offset="50%" stopColor={VIP.primary} />
                <stop offset="100%" stopColor={VIP.primaryLight} />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="95" fill="none" stroke="url(#gradient-vip)" strokeWidth="3" />
          </motion.svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${VIP.primaryLight}, ${VIP.primary})` }}>
              <Upload className="w-14 h-14 text-white mb-2" />
              <div className="text-white text-center">
                <p className="text-base font-bold">Choose a file...</p>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Select files to upload"
          />
        </motion.div>

        {/* File list */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              className="w-full mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="rounded-lg p-3 mb-4 max-h-48 overflow-y-auto space-y-2" style={{ background: VIP.bg }}>
                {files.map((f, i) => (
                  <motion.div
                    key={f.name}
                    className="flex items-center justify-between bg-white rounded-md px-3 py-2 shadow-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: VIP.text }}>{f.name}</p>
                      <p className="text-xs" style={{ color: VIP.textMuted }}>{(f.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="ml-2 transition-colors flex-shrink-0 text-gray-400 hover:text-red-500"
                      aria-label={`Remove ${f.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <p className="text-xs text-center mb-3" style={{ color: VIP.textMuted }}>
                {files.length} file{files.length > 1 ? 's' : ''} selected — all share one code
              </p>

              <div className="flex justify-center">
                <MagneticButton
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-8 py-4 text-white font-bold text-lg rounded-full hover:shadow-xl transition-shadow disabled:opacity-50 flex items-center justify-center gap-3"
                  style={{ background: `linear-gradient(to right, ${VIP.primaryLight}, ${VIP.primary})`, boxShadow: `0 4px 20px rgba(212,160,23,0.35)` }}
                >
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <Upload className="w-4 h-4" style={{ color: VIP.primary }} />
                  </div>
                  <span className="uppercase tracking-wider">
                    {uploading ? 'Uploading...' : 'Upload'}
                  </span>
                </MagneticButton>
              </div>

              {uploadError && (
                <p className="mt-3 text-sm text-red-600 text-center">{uploadError}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p
          className="text-xs mt-2"
          style={{ color: VIP.textMuted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Select multiple files — one shared code for all
        </motion.p>

        {/* Divider + Download section */}
        <motion.div
          className="w-full mt-10 flex flex-col items-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="flex items-center gap-3 w-full mb-8">
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${VIP.border})` }} />
            <span className="text-base font-bold text-gray-900">or</span>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${VIP.border})` }} />
          </div>

          <div
            className="w-full rounded-2xl px-6 py-6 flex flex-col gap-4"
            style={{ background: `linear-gradient(135deg, ${VIP.bg} 0%, #fdfbf2 100%)`, border: `1px solid ${VIP.border}` }}
          >
            <div className="text-center">
              <p className="text-base font-semibold" style={{ color: VIP.text }}>Have a code number?</p>
              <p className="text-sm" style={{ color: VIP.textMuted }}>Enter your share code to find your files</p>
            </div>

            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              value={shareCode}
              onChange={e => { setShareCode(e.target.value); setLookupResult(null); setLookupError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              maxLength={10}
              className="w-full text-center text-2xl font-mono font-bold tracking-widest rounded-xl px-4 py-3 outline-none border-2 transition-colors bg-white"
              style={{ borderColor: shareCode ? VIP.primary : VIP.border, color: VIP.primary }}
            />

            <MagneticButton
              onClick={handleLookup}
              disabled={lookupLoading || !shareCode.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 text-white"
              style={{ background: `linear-gradient(to right, ${VIP.primaryLight}, ${VIP.primary})` }}
            >
              <Search className="w-4 h-4" />
              {lookupLoading ? 'Searching...' : 'Find'}
            </MagneticButton>

            {lookupError && (
              <p className="text-sm text-red-500 text-center">{lookupError}</p>
            )}

            <AnimatePresence>
              {lookupResult && (
                <motion.div
                  className="flex flex-col gap-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {lookupResult.isGroup && lookupResult.files ? (
                    lookupResult.files.map((f, i) => (
                      <div key={f.id || i} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm" style={{ border: `1px solid ${VIP.border}` }}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: VIP.text }}>{f.fileName}</p>
                          <p className="text-xs" style={{ color: VIP.textMuted }}>{formatSize(f.fileSize)}</p>
                        </div>
                        <a
                          href={`/api/download/${shareCode.trim()}?fileId=${f.id}`}
                          className="ml-3 flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-white flex-shrink-0"
                          style={{ background: `linear-gradient(to right, ${VIP.primaryLight}, ${VIP.primary})` }}
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm" style={{ border: `1px solid ${VIP.border}` }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: VIP.text }}>{lookupResult.fileName}</p>
                        <p className="text-xs" style={{ color: VIP.textMuted }}>{formatSize(lookupResult.fileSize || 0)}</p>
                      </div>
                      <a
                        href={`/api/download/${shareCode.trim()}`}
                        className="ml-3 flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-white flex-shrink-0"
                        style={{ background: `linear-gradient(to right, ${VIP.primaryLight}, ${VIP.primary})` }}
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </a>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
