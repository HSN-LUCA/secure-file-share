'use client';

import React, { useState, useRef } from 'react';
import { Download, AlertCircle, Loader, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { addToDownloadHistory } from '@/lib/pwa/offline-queue';

interface DownloadFormState {
  shareCode: string;
  loading: boolean;
  error: string | null;
  success: boolean;
  fileInfo: {
    fileName: string;
    fileSize: number;
    expiresAt: string;
  } | null;
  downloading: boolean;
  downloadProgress: number;
}

export function DownloadForm() {
  const [state, setState] = useState<DownloadFormState>({
    shareCode: '',
    loading: false,
    error: null,
    success: false,
    fileInfo: null,
    downloading: false,
    downloadProgress: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate share code format (numeric, 6 digits)
  const isValidShareCode = (code: string): boolean => {
    return /^\d{6}$/.test(code);
  };

  // Handle share code input change
  const handleShareCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setState(prev => ({
      ...prev,
      shareCode: value,
      error: null,
    }));
  };

  // Fetch file info
  const handleFetchFileInfo = async () => {
    if (!state.shareCode) {
      setState(prev => ({ ...prev, error: 'Please enter a share code' }));
      return;
    }

    if (!isValidShareCode(state.shareCode)) {
      setState(prev => ({
        ...prev,
        error: 'Share code must be 6 digits',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const response = await fetch(`/api/download/${state.shareCode}?info=true`);

      if (!response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'Failed to fetch file info',
        }));
        return;
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        loading: false,
        fileInfo: {
          fileName: data.fileName,
          fileSize: data.fileSize,
          expiresAt: data.expiresAt,
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Network error. Please check your connection.',
      }));
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!state.fileInfo) {
      setState(prev => ({ ...prev, error: 'File info not loaded' }));
      return;
    }

    setState(prev => ({
      ...prev,
      downloading: true,
      error: null,
      downloadProgress: 0,
    }));

    try {
      const xhr = new XMLHttpRequest();

      // Track download progress
      xhr.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setState(prev => ({ ...prev, downloadProgress: progress }));
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          // Create blob and download
          const blob = new Blob([xhr.response]);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = state.fileInfo?.fileName || 'download';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          // Add to download history
          addToDownloadHistory(
            state.shareCode,
            state.fileInfo?.fileName || 'unknown',
            state.fileInfo?.fileSize || 0
          ).catch(error => console.error('Failed to add to download history:', error));

          setState(prev => ({
            ...prev,
            downloading: false,
            success: true,
            downloadProgress: 100,
          }));
        } else {
          setState(prev => ({
            ...prev,
            downloading: false,
            error: 'Download failed. Please try again.',
          }));
        }
      });

      // Handle error
      xhr.addEventListener('error', () => {
        setState(prev => ({
          ...prev,
          downloading: false,
          error: 'Network error. Please check your connection.',
        }));
      });

      // Send request
      xhr.open('GET', `/api/download/${state.shareCode}`);
      xhr.responseType = 'arraybuffer';
      xhr.send();
    } catch (error) {
      setState(prev => ({
        ...prev,
        downloading: false,
        error: error instanceof Error ? error.message : 'Download failed',
      }));
    }
  };

  // Reset form
  const handleReset = () => {
    setState({
      shareCode: '',
      loading: false,
      error: null,
      success: false,
      fileInfo: null,
      downloading: false,
      downloadProgress: 0,
    });
  };

  // Success screen
  if (state.success) {
    return (
      <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Download Complete!
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Your file has been downloaded successfully.
          </p>
        </div>

        <Button
          onClick={handleReset}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
        >
          Download Another File
        </Button>
      </div>
    );
  }

  // File info display
  if (state.fileInfo) {
    const fileSize = (state.fileInfo.fileSize / (1024 * 1024)).toFixed(2);
    const expiresAt = new Date(state.fileInfo.expiresAt).toLocaleString();

    return (
      <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">File Details</h2>

        {/* File Info */}
        <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 mb-6">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">File Name</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white break-all">
                {state.fileInfo.fileName}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">File Size</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                {fileSize} MB
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Expires At</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                {expiresAt}
              </p>
            </div>
          </div>
        </div>

        {/* Download Progress */}
        {state.downloading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Downloading...
              </span>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300" aria-live="polite">
                {state.downloadProgress}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${state.downloadProgress}%` }}
                role="progressbar"
                aria-valuenow={state.downloadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}

        {/* Download Button */}
        <Button
          onClick={handleDownload}
          disabled={state.downloading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-400 dark:bg-blue-700 dark:hover:bg-blue-600 dark:disabled:bg-neutral-600 text-white flex items-center justify-center gap-2 mb-3 py-3 sm:py-2"
          aria-label={state.downloading ? 'Downloading file' : 'Download file'}
        >
          {state.downloading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span className="hidden sm:inline">Downloading...</span>
              <span className="sm:hidden">Downloading...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Download File</span>
              <span className="sm:hidden">Download</span>
            </>
          )}
        </Button>

        {/* Back Button */}
        <Button
          onClick={handleReset}
          className="w-full bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white"
        >
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Download File</h2>

      {/* Error Alert */}
      {state.error && (
        <Alert className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
          <span className="text-red-800 dark:text-red-200">{state.error}</span>
        </Alert>
      )}

      {/* Share Code Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Share Code
        </label>
        <input
          ref={fileInputRef}
          type="text"
          inputMode="numeric"
          placeholder="000000"
          value={state.shareCode}
          onChange={handleShareCodeChange}
          disabled={state.loading}
          maxLength={6}
          className="w-full px-4 py-3 text-center text-2xl font-mono font-bold border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 disabled:bg-neutral-100 dark:disabled:bg-neutral-700 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
          aria-label="Enter 6-digit share code"
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-2">
          Enter the 6-digit code you received
        </p>
      </div>

      {/* Fetch Button */}
      <Button
        onClick={handleFetchFileInfo}
        disabled={!state.shareCode || state.loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-400 dark:bg-blue-700 dark:hover:bg-blue-600 dark:disabled:bg-neutral-600 text-white flex items-center justify-center gap-2 py-3 sm:py-2"
        aria-label={state.loading ? 'Loading file info' : 'Get file info'}
      >
        {state.loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span className="hidden sm:inline">Loading...</span>
            <span className="sm:hidden">Loading...</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Get File Info</span>
            <span className="sm:hidden">Get Info</span>
          </>
        )}
      </Button>

      {/* Info */}
      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-4">
        Your download will be secure and encrypted
      </p>
    </div>
  );
}
