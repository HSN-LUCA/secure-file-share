'use client';

import { motion } from 'motion/react';
import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setUploadSuccess(false);
    setUploadError('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      // Get reCAPTCHA token
      let captchaToken = '';
      try {
        // Wait up to 5 seconds for grecaptcha to be available
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
          captchaToken = await new Promise<string>((resolve, reject) => {
            grecaptcha.ready(async () => {
              try {
                const token = await grecaptcha.execute(
                  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
                  { action: 'upload' }
                );
                resolve(token);
              } catch (e) {
                reject(e);
              }
            });
          });
        } else {
          console.warn('reCAPTCHA unavailable, using fallback token');
          captchaToken = 'dev-token-' + Math.random().toString(36).substring(2, 11);
        }
      } catch (e) {
        console.warn('reCAPTCHA unavailable, using fallback token');
        captchaToken = 'dev-token-' + Math.random().toString(36).substring(2, 11);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('captcha_token', captchaToken);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.shareCode) {
        setShareCode(data.shareCode);
        setUploadSuccess(true);
        setFile(null);
      } else {
        setUploadError(data.error || 'Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {uploadSuccess ? (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Successful!</h2>
          <p className="text-gray-600 mb-6">Your share code is:</p>
          <motion.div
            className="bg-purple-50 rounded-lg p-6 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-4xl font-mono font-bold text-purple-600">{shareCode}</p>
          </motion.div>
          <motion.button
            onClick={() => {
              setUploadSuccess(false);
              setShareCode('');
            }}
            className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Upload Another File
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          className="flex flex-col items-center justify-center w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="relative w-48 h-48 mb-8 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
          >
            {/* Animated circle border */}
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
              <circle
                cx="100"
                cy="100"
                r="95"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="3"
              />
            </motion.svg>

            {/* Inner circle */}
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
              onChange={handleFileInputChange}
              className="hidden"
              aria-label="Select file to upload"
            />
          </motion.div>

          {file && (
            <motion.div
              className="w-full mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Selected file:</p>
                <p className="font-semibold text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>

              <motion.button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </motion.button>
              {uploadError && (
                <p className="mt-3 text-sm text-red-600 text-center">{uploadError}</p>
              )}
            </motion.div>
          )}

          <motion.p
            className="text-gray-600 text-sm mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Upload Folder →
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}
