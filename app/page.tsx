'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, Download, Search, Copy, Share2 } from 'lucide-react';
import MagneticButton from '@/components/ui/MagneticButton';

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

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download lookup state
  const [shareCode, setShareCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);

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
        setLookupError(data.error || 'File not found');
      } else {
        setLookupResult(data);
      }
    } catch {
      setLookupError('Something went wrong. Try again.');
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
  const [copied, setCopied] = useState(false);

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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          className="w-full max-w-sm sm:max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            {successResults.length} of {results.length} file{results.length > 1 ? 's' : ''} uploaded
          </h2>

          {groupCode && (
            <motion.div
              className="rounded-xl p-6 mb-4 text-center"
              style={{ backgroundColor: '#FEF9E7' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-sm text-gray-500 mb-2">Share code for all files</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-4xl font-mono font-bold tracking-widest" style={{ color: '#D4A017' }}>{groupCode}</p>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => copyCode(groupCode)}
                    title="Copy code"
                    className="p-1.5 rounded-lg transition-colors hover:bg-yellow-100"
                    style={{ color: copied ? '#22c55e' : '#D4A017' }}
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => shareCode2(groupCode)}
                    title="Share code"
                    className="p-1.5 rounded-lg transition-colors hover:bg-yellow-100"
                    style={{ color: '#D4A017' }}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Use this code to download all {successResults.length} file{successResults.length > 1 ? 's' : ''}</p>
            </motion.div>
          )}

          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
            {successResults.map((r, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
              >
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-sm text-gray-700 truncate">{r.fileName}</p>
              </motion.div>
            ))}
            {failedResults.map((r, i) => (
              <div key={i} className="bg-red-50 rounded-lg px-3 py-2">
                <p className="text-sm font-medium text-gray-700 truncate">{r.fileName}</p>
                <p className="text-xs text-red-600">{r.error}</p>
              </div>
            ))}
          </div>

          <MagneticButton
            className="w-full px-6 py-3 text-white font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: '#D4A017' }}
            onClick={reset}
          >
            Upload More Files
          </MagneticButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        className="flex flex-col items-center justify-center w-full max-w-sm sm:max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Hero — logo + tagline */}
        <motion.div
          className="flex flex-col items-center mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src="/logo.png" alt="HodHod" className="w-36 h-36 object-contain" />
          <p className="text-sm font-medium tracking-wide mt-1" style={{ color: '#D4A017' }}>
            Send files secure
          </p>
        </motion.div>

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
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F5C842" />
                <stop offset="50%" stopColor="#D4A017" />
                <stop offset="100%" stopColor="#F5C842" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="95" fill="none" stroke="url(#gradient)" strokeWidth="3" />
          </motion.svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #F5C842, #D4A017)' }}>
              <Upload className="w-12 h-12 text-white mb-2" />
              <div className="text-white text-center">
                <p className="text-xl font-bold mb-1">Upload Files</p>
                <p className="text-xs opacity-90">Click to browse</p>
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
              <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-48 overflow-y-auto space-y-2">
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
                      <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                      <p className="text-xs text-gray-400">{(f.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="ml-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      aria-label={`Remove ${f.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <p className="text-xs text-gray-400 text-center mb-3">
                {files.length} file{files.length > 1 ? 's' : ''} selected — all share one code
              </p>

              <MagneticButton
                onClick={handleUpload}
                disabled={uploading}
                className="w-full px-6 py-3 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50"
                style={{ background: 'linear-gradient(to right, #F5C842, #D4A017)' }}
              >
                {uploading ? `Uploading ${files.length} file${files.length > 1 ? 's' : ''}...` : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
              </MagneticButton>

              {uploadError && (
                <p className="mt-3 text-sm text-red-600 text-center">{uploadError}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p
          className="text-gray-400 text-xs mt-2"
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
          {/* Divider */}
          <div className="flex items-center gap-3 w-full mb-8">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #E8C547)' }} />
            <span className="text-xs text-gray-400 font-medium tracking-widest uppercase">or</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, #E8C547)' }} />
          </div>

          {/* Download card */}
          <div
            className="w-full rounded-2xl px-6 py-6 flex flex-col gap-4"
            style={{ background: 'linear-gradient(135deg, #FEF9E7 0%, #FFFDF5 100%)', border: '1px solid #E8C547' }}
          >
            <div className="text-center">
              <p className="text-base font-semibold text-gray-800">Have a code number?</p>
              <p className="text-sm text-gray-500">Enter your share code to find your files</p>
            </div>

            {/* Code input */}
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              value={shareCode}
              onChange={e => { setShareCode(e.target.value); setLookupResult(null); setLookupError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              maxLength={10}
              className="w-full text-center text-2xl font-mono font-bold tracking-widest rounded-xl px-4 py-3 outline-none border-2 transition-colors"
              style={{ borderColor: shareCode ? '#D4A017' : '#E8C547', color: '#D4A017', background: '#fff' }}
            />

            <MagneticButton
              onClick={handleLookup}
              disabled={lookupLoading || !shareCode.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(to right, #F5C842, #D4A017)', color: '#ffffff' }}
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
                      <div key={f.id || i} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm" style={{ border: '1px solid #E8C547' }}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{f.fileName}</p>
                          <p className="text-xs text-gray-400">{formatSize(f.fileSize)}</p>
                        </div>
                        <a
                          href={`/api/download/${shareCode.trim()}?fileId=${f.id}`}
                          className="ml-3 flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(to right, #F5C842, #D4A017)' }}
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm" style={{ border: '1px solid #E8C547' }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{lookupResult.fileName}</p>
                        <p className="text-xs text-gray-400">{formatSize(lookupResult.fileSize || 0)}</p>
                      </div>
                      <a
                        href={`/api/download/${shareCode.trim()}`}
                        className="ml-3 flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(to right, #F5C842, #D4A017)' }}
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
