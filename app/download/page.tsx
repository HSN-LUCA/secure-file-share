'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import { Download, Search } from 'lucide-react';

interface FileInfo {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  expiresAt: string;
}

export default function DownloadPage() {
  const [shareCode, setShareCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!shareCode.trim()) {
      setError('Please enter a share code');
      return;
    }

    setSearching(true);
    setError('');
    setFileInfo(null);

    try {
      const response = await fetch(`/api/download/${shareCode}?info=true`);
      const data = await response.json();

      if (response.ok && data.fileName) {
        setFileInfo({
          fileName: data.fileName,
          fileSize: data.fileSize || 0,
          uploadedAt: data.uploadedAt || new Date().toISOString(),
          expiresAt: data.expiresAt || new Date(Date.now() + 20 * 60000).toISOString(),
        });
      } else {
        setError(data.error || 'File not found');
      }
    } catch (err) {
      setError('Failed to fetch file information');
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleDownload = async () => {
    if (!shareCode.trim()) return;

    try {
      const response = await fetch(`/api/download/${shareCode}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileInfo?.fileName || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {!fileInfo ? (
          <div>
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Download Files</h1>
              <p className="text-gray-600">Enter your share code to find files</p>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div>
                <input
                  type="text"
                  placeholder="Enter share code"
                  value={shareCode}
                  onChange={(e) => {
                    setShareCode(e.target.value);
                    setError('');
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-6 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-600 text-center text-lg placeholder-gray-400"
                  disabled={searching}
                />
              </div>

              {error && (
                <motion.div
                  className="bg-red-50 border border-red-200 rounded-lg p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-red-700 text-sm">{error}</p>
                </motion.div>
              )}

              <motion.button
                onClick={handleSearch}
                disabled={searching}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Search className="w-5 h-5" />
                {searching ? 'Searching...' : 'Find Files'}
              </motion.button>
            </motion.div>
          </div>
        ) : (
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
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Download className="w-10 h-10 text-purple-600" />
              </div>
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">File Found!</h2>

            <motion.div
              className="bg-gray-50 rounded-lg p-6 mb-6 text-left"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">File Name</p>
                  <p className="text-lg font-semibold text-gray-900 break-all">{fileInfo.fileName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">File Size</p>
                  <p className="text-gray-700">{(fileInfo.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Expires At</p>
                  <p className="text-gray-700">{new Date(fileInfo.expiresAt).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>

            <div className="space-y-3">
              <motion.button
                onClick={handleDownload}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-5 h-5" />
                Download File
              </motion.button>

              <motion.button
                onClick={() => {
                  setFileInfo(null);
                  setShareCode('');
                  setError('');
                }}
                className="w-full px-6 py-3 border-2 border-purple-300 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Search Another File
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
