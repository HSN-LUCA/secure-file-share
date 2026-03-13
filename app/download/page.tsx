'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import { Download, Search, CheckCircle } from 'lucide-react';

interface FileEntry {
  id: string;
  fileName: string;
  fileSize: number;
  expiresAt: string;
}

interface SearchResult {
  isGroup: boolean;
  // single file
  fileName?: string;
  fileSize?: number;
  expiresAt?: string;
  // group
  files?: FileEntry[];
}

export default function DownloadPage() {
  const [shareCode, setShareCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!shareCode.trim()) {
      setError('Please enter a share code');
      return;
    }
    setSearching(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`/api/download/${shareCode.trim()}?info=true`);
      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data);
      } else {
        setError(data.error || 'File not found');
      }
    } catch {
      setError('Failed to fetch file information');
    } finally {
      setSearching(false);
    }
  };

  const downloadFile = async (code: string, fileName: string) => {
    setDownloading(fileName);
    try {
      const response = await fetch(`/api/download/${code}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  const formatSize = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {!result ? (
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

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter share code"
                value={shareCode}
                onChange={(e) => { setShareCode(e.target.value); setError(''); }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-6 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-600 text-center text-lg placeholder-gray-400"
                disabled={searching}
              />

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
            </div>
          </div>
        ) : result.isGroup && result.files ? (
          // Group download view
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{result.files.length} Files Found</h2>
              <p className="text-gray-500 text-sm mt-1">Share code: <span className="font-mono font-bold text-purple-600">{shareCode}</span></p>
            </div>

            <div className="space-y-2 mb-6 max-h-72 overflow-y-auto">
              {result.files.map((f, i) => (
                <motion.div
                  key={f.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{f.fileName}</p>
                    <p className="text-xs text-gray-400">{formatSize(f.fileSize)}</p>
                  </div>
                  <button
                    onClick={() => downloadFile(shareCode.trim(), f.fileName)}
                    disabled={downloading === f.fileName}
                    className="ml-3 flex-shrink-0 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    aria-label={`Download ${f.fileName}`}
                  >
                    {downloading === f.fileName
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Download className="w-4 h-4" />
                    }
                  </button>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={() => { setResult(null); setShareCode(''); setError(''); }}
              className="w-full px-6 py-3 border-2 border-purple-300 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Search Another Code
            </motion.button>
          </motion.div>
        ) : (
          // Single file view
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Download className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">File Found!</h2>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">File Name</p>
                <p className="text-lg font-semibold text-gray-900 break-all">{result.fileName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">File Size</p>
                <p className="text-gray-700">{formatSize(result.fileSize || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Expires At</p>
                <p className="text-gray-700">{new Date(result.expiresAt || '').toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-3">
              <motion.button
                onClick={() => downloadFile(shareCode.trim(), result.fileName || 'download')}
                disabled={!!downloading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-5 h-5" />
                {downloading ? 'Downloading...' : 'Download File'}
              </motion.button>

              <motion.button
                onClick={() => { setResult(null); setShareCode(''); setError(''); }}
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
