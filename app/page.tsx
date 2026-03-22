'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, Download, Search, Copy, Share2 } from 'lucide-react';
import MagneticButton from '@/components/ui/MagneticButton';
import Header from '@/components/layout/Header';

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

  const reset = () => { setResults([]); setFiles([]); setUploadError(''); };

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

  // ── Success screen ──────────────────────────────────────────────────────────
  if (results.length > 0) {
    const groupCode = successResults[0]?.shareCode || '';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-3 sm:px-4 py-6 sm:py-8"
        style={{ background: 'linear-gradient(135deg, #fdf6ec 0%, #faf4f0 50%, #f5f0f8 100%)' }}>
        <motion.div className="w-full max-w-xs sm:max-w-sm md:max-w-md"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-2" style={{ color: '#1a1a2e' }}>
            {successResults.length} of {results.length} file{results.length > 1 ? 's' : ''} uploaded
          </h2>
          {groupCode && (
            <motion.div className="rounded-xl p-4 sm:p-6 mb-4 text-center bg-white shadow-sm"
              style={{ border: '1px solid #E8C547' }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <p className="text-xs sm:text-sm text-gray-500 mb-2">Share code for all files</p>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <p className="text-3xl sm:text-4xl font-mono font-bold tracking-widest" style={{ color: '#D4A017' }}>{groupCode}</p>
                <div className="flex flex-col gap-1">
                  <button onClick={() => copyCode(groupCode)} title="Copy code"
                    className="p-1.5 rounded-lg transition-colors hover:bg-yellow-50"
                    style={{ color: copied ? '#22c55e' : '#D4A017' }}>
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={() => shareCode2(groupCode)} title="Share code"
                    className="p-1.5 rounded-lg transition-colors hover:bg-yellow-50"
                    style={{ color: '#D4A017' }}>
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Use this code to download all {successResults.length} file{successResults.length > 1 ? 's' : ''}</p>
            </motion.div>
          )}
          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
            {successResults.map((r, i) => (
              <motion.div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-gray-700 truncate">{r.fileName}</p>
              </motion.div>
            ))}
            {failedResults.map((r, i) => (
              <div key={i} className="bg-red-50 rounded-lg px-3 py-2">
                <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">{r.fileName}</p>
                <p className="text-xs text-red-600">{r.error}</p>
              </div>
            ))}
          </div>
          <MagneticButton className="w-full px-4 sm:px-6 py-3 text-white font-semibold rounded-xl transition-colors min-h-12"
            style={{ backgroundColor: '#D4A017' }} onClick={reset}>
            Upload More Files
          </MagneticButton>
        </motion.div>
      </div>
    );
  }

  // ── Main page ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ background: 'linear-gradient(135deg, #fdf6ec 0%, #faf4f0 50%, #f5f0f8 100%)' }}>

      {/* Ambient color blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #f5c842 0%, transparent 70%)' }} />
        <div className="absolute top-20 -right-20 w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #e8a0bf 0%, transparent 70%)' }} />
        <div className="absolute bottom-40 left-1/4 w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #a0c4e8 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <Header />

      {/* Spacer for fixed header */}
      <div className="h-14" />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-3 sm:px-6 pt-6 sm:pt-10 md:pt-16 pb-8 sm:pb-12 md:pb-16">
        <motion.h1
          className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-2 sm:mb-3 max-w-2xl"
          style={{ color: '#1a1a2e', fontFamily: 'Georgia, "Times New Roman", serif' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          Send Files with Code
        </motion.h1>

        <motion.p
          className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold italic mb-3 sm:mb-4 md:mb-6 max-w-2xl"
          style={{ color: '#8a9bb5', fontFamily: 'Georgia, "Times New Roman", serif' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          Fast, Easy, Secure.
        </motion.p>

      </section>

      {/* Upload + Find section */}
      <section id="upload" className="relative z-10 flex flex-col items-center px-3 sm:px-4 pb-8 sm:pb-12 md:pb-20">
        <motion.div
          className="w-full max-w-xs sm:max-w-sm md:max-w-md"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>

          {/* Upload circle */}
          <div className="flex flex-col items-center mb-4 sm:mb-6">
            <motion.div
              className="relative w-40 h-40 sm:w-44 sm:h-44 cursor-pointer mb-3 sm:mb-4"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}>
              <motion.svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200"
                animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' as const }}>
                <defs>
                  <linearGradient id="grad-home" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F5C842" />
                    <stop offset="50%" stopColor="#D4A017" />
                    <stop offset="100%" stopColor="#F5C842" />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="95" fill="none" stroke="url(#grad-home)" strokeWidth="3" />
              </motion.svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #F5C842, #D4A017)' }}>
                  <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-white mb-1" />
                  <p className="text-white text-xs sm:text-sm font-bold">Browse Files</p>
                </div>
              </div>
              <input ref={fileInputRef} type="file" multiple onChange={handleFileInputChange}
                className="hidden" aria-label="Select files to upload" />
            </motion.div>
            <p className="text-xs text-gray-400 text-center px-2">Select multiple files — one shared code for all</p>
          </div>

          {/* File list + upload button */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div className="w-full mb-4 sm:mb-6"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="bg-white rounded-xl p-2 sm:p-3 mb-3 max-h-40 sm:max-h-48 overflow-y-auto space-y-2 shadow-sm"
                  style={{ border: '1px solid #e8e0d0' }}>
                  {files.map((f, i) => (
                    <motion.div key={f.name}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-2 sm:px-3 py-2"
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }} transition={{ delay: i * 0.04 }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{f.name}</p>
                        <p className="text-xs text-gray-400">{(f.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button onClick={() => removeFile(i)}
                        className="ml-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                        aria-label={`Remove ${f.name}`}>
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 text-center mb-3">
                  {files.length} file{files.length > 1 ? 's' : ''} selected — all share one code
                </p>
                <MagneticButton onClick={handleUpload} disabled={uploading}
                  className="w-full px-3 sm:px-6 py-3 sm:py-4 text-white font-bold text-sm sm:text-base rounded-xl hover:shadow-xl transition-shadow disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-3 min-h-12 sm:min-h-14"
                  style={{ background: 'linear-gradient(to right, #F5C842, #D4A017)', boxShadow: '0 4px 20px rgba(212,160,23,0.35)' }}>
                  <Upload className="w-5 h-5" />
                  <span className="hidden sm:inline">{uploading ? `Uploading ${files.length} file${files.length > 1 ? 's' : ''}...` : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}</span>
                  <span className="sm:hidden">{uploading ? 'Uploading...' : 'Upload'}</span>
                </MagneticButton>
                {uploadError && <p className="mt-3 text-xs sm:text-sm text-red-600 text-center">{uploadError}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="flex items-center gap-2 sm:gap-3 w-full my-4 sm:my-6">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #E8C547)' }} />
            <span className="text-sm sm:text-base font-bold text-gray-900">or</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, #E8C547)' }} />
          </div>

          {/* Find file card */}
          <div id="find" className="w-full rounded-2xl px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-3 sm:gap-4 bg-white shadow-sm"
            style={{ border: '1px solid #E8C547' }}>
            <div className="text-center">
              <p className="text-sm sm:text-base font-semibold" style={{ color: '#1a1a2e' }}>Have a code number?</p>
              <p className="text-xs sm:text-sm text-gray-500">Enter your share code to find your files</p>
            </div>
            <input type="text" inputMode="numeric" placeholder="Enter 6-digit code"
              value={shareCode}
              onChange={e => { setShareCode(e.target.value); setLookupResult(null); setLookupError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              maxLength={10}
              className="w-full text-center text-lg sm:text-2xl font-mono font-bold tracking-widest rounded-xl px-3 sm:px-4 py-2 sm:py-3 outline-none border-2 transition-colors bg-gray-50 min-h-12"
              style={{ borderColor: shareCode ? '#D4A017' : '#E8C547', color: '#D4A017' }} />
            <MagneticButton onClick={handleLookup} disabled={lookupLoading || !shareCode.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 text-white min-h-12 sm:min-h-14"
              style={{ background: 'linear-gradient(to right, #F5C842, #D4A017)' }}>
              <Search className="w-4 h-4" />
              {lookupLoading ? 'Searching...' : 'Find'}
            </MagneticButton>
            {lookupError && <p className="text-xs sm:text-sm text-red-500 text-center">{lookupError}</p>}
            <AnimatePresence>
              {lookupResult && (
                <motion.div className="flex flex-col gap-2"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {lookupResult.isGroup && lookupResult.files ? (
                    lookupResult.files.map((f, i) => (
                      <div key={f.id || i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 sm:px-4 py-2 sm:py-3 gap-2"
                        style={{ border: '1px solid #E8C547' }}>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{f.fileName}</p>
                          <p className="text-xs text-gray-400">{formatSize(f.fileSize)}</p>
                        </div>
                        <a href={`/api/download/${shareCode.trim()}?fileId=${f.id}`}
                          className="ml-2 flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs font-semibold text-white flex-shrink-0 min-h-10 sm:min-h-auto"
                          style={{ background: 'linear-gradient(to right, #F5C842, #D4A017)' }}>
                          <Download className="w-3 h-3" /><span className="hidden sm:inline">Download</span>
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 sm:px-4 py-2 sm:py-3 gap-2"
                      style={{ border: '1px solid #E8C547' }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{lookupResult.fileName}</p>
                        <p className="text-xs text-gray-400">{formatSize(lookupResult.fileSize || 0)}</p>
                      </div>
                      <a href={`/api/download/${shareCode.trim()}`}
                        className="ml-2 flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs font-semibold text-white flex-shrink-0 min-h-10 sm:min-h-auto"
                        style={{ background: 'linear-gradient(to right, #F5C842, #D4A017)' }}>
                        <Download className="w-3 h-3" /><span className="hidden sm:inline">Download</span>
                      </a>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
