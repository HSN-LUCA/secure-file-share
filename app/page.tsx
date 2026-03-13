'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef } from 'react';
import { Upload, X, CheckCircle } from 'lucide-react';

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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) {
      setFiles(prev => {
        const names = new Set(prev.map(f => f.name));
        return [...prev, ...selected.filter(f => !names.has(f.name))];
      });
      setUploadError('');
      // reset input so same files can be re-added after removal
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
    // All files in this batch share one group code
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

  if (results.length > 0) {
    // All successful files share the same group code
    const groupCode = successResults[0]?.shareCode || '';

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <motion.div
          className="w-full max-w-md"
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
              className="bg-purple-50 rounded-xl p-6 mb-4 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-sm text-gray-500 mb-2">Share code for all files</p>
              <p className="text-4xl font-mono font-bold text-purple-600 tracking-widest">{groupCode}</p>
              <p className="text-xs text-gray-400 mt-2">Use this code to download all {successResults.length} file{successResults.length > 1 ? 's' : ''}</p>
            </motion.div>
          )}

          {/* File list */}
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

          <motion.button
            onClick={reset}
            className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Upload More Files
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <motion.div
        className="flex flex-col items-center justify-center w-full max-w-md"
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
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="95" fill="none" stroke="url(#gradient)" strokeWidth="3" />
          </motion.svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex flex-col items-center justify-center shadow-lg">
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
                {files.length} file{files.length > 1 ? 's' : ''} selected — each gets its own share code
              </p>

              <motion.button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {uploading ? `Uploading ${files.length} file${files.length > 1 ? 's' : ''}...` : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
              </motion.button>

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
          Select multiple files — each gets a unique share code
        </motion.p>
      </motion.div>
    </div>
  );
}
