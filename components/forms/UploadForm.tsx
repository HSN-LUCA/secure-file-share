'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Copy, Check, AlertCircle, Loader, Smartphone } from 'lucide-react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { addToUploadQueue, isOffline } from '@/lib/pwa/offline-queue';

interface UploadFormProps {
  onUploadComplete?: (shareCode: string, fileName: string) => void;
}

interface UploadState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
  shareCode: string | null;
  fileName: string | null;
  expiresAt: string | null;
  expirationMinutes: number;
}

export function UploadForm({ onUploadComplete }: UploadFormProps) {
  const [state, setState] = useState<UploadState>({
    file: null,
    preview: null,
    uploading: false,
    progress: 0,
    error: null,
    success: false,
    shareCode: null,
    fileName: null,
    expiresAt: null,
    expirationMinutes: 20,
  });

  const [copied, setCopied] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);

  // Check offline status on mount
  useEffect(() => {
    setIsOfflineMode(isOffline());

    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    // Validate file
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      setState(prev => ({
        ...prev,
        error: `File size exceeds 100MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      }));
      return;
    }

    // Create preview for images
    let preview: string | null = null;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview = e.target?.result as string;
        setState(prev => ({
          ...prev,
          file,
          preview,
          error: null,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setState(prev => ({
        ...prev,
        file,
        preview: null,
        error: null,
      }));
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = true;
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = false;
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = false;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!state.file) {
      setState(prev => ({ ...prev, error: 'Please select a file' }));
      return;
    }

    setState(prev => ({
      ...prev,
      uploading: true,
      error: null,
      progress: 0,
    }));

    try {
      // If offline, queue the upload
      if (isOfflineMode) {
        if (state.file) {
          await addToUploadQueue(state.file);
          setState(prev => ({
            ...prev,
            uploading: false,
            success: true,
            shareCode: 'QUEUED',
            fileName: state.file?.name || 'unknown',
            expiresAt: new Date(Date.now() + 20 * 60000).toISOString(),
          }));
        }
        return;
      }

      // Get reCAPTCHA token (skip in development for local testing)
      let token = 'dev-token-' + Math.random().toString(36).substring(2, 11);
      
      if (process.env.NODE_ENV === 'production') {
        try {
          token = await (window as any).grecaptcha?.execute(
            process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
            { action: 'submit' }
          );
        } catch (error) {
          console.error('reCAPTCHA error:', error);
        }
        
        if (!token) {
          throw new Error('CAPTCHA verification failed. Please try again.');
        }
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', state.file);
      formData.append('captcha_token', token);
      formData.append('expirationMinutes', state.expirationMinutes.toString());

      // Upload file
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setState(prev => ({ ...prev, progress }));
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        console.log('Upload response:', { status: xhr.status, response: xhr.responseText });
        
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('Upload success:', response);
            setState(prev => ({
              ...prev,
              uploading: false,
              success: true,
              shareCode: response.shareCode,
              fileName: response.fileName,
              expiresAt: response.expiresAt,
              progress: 100,
            }));

            if (onUploadComplete) {
              onUploadComplete(response.shareCode, response.fileName);
            }
          } catch (parseError) {
            console.error('Failed to parse upload response:', parseError);
            setState(prev => ({
              ...prev,
              uploading: false,
              error: 'Invalid response from server. Please try again.',
            }));
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            console.error('Upload error:', response);
            setState(prev => ({
              ...prev,
              uploading: false,
              error: response.error || `Upload failed with status ${xhr.status}. Please try again.`,
            }));
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            setState(prev => ({
              ...prev,
              uploading: false,
              error: `Upload failed with status ${xhr.status}. Please try again.`,
            }));
          }
        }
      });

      // Handle error
      xhr.addEventListener('error', () => {
        console.error('Upload network error');
        setState(prev => ({
          ...prev,
          uploading: false,
          error: 'Network error. Please check your connection.',
        }));
      });

      // Send request
      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    } catch (error) {
      setState(prev => ({
        ...prev,
        uploading: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }));
    }
  };

  // Copy share code
  const handleCopyShareCode = () => {
    if (state.shareCode) {
      navigator.clipboard.writeText(state.shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Reset form
  const handleReset = () => {
    setState({
      file: null,
      preview: null,
      uploading: false,
      progress: 0,
      error: null,
      success: false,
      shareCode: null,
      fileName: null,
      expiresAt: null,
      expirationMinutes: 20,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Success screen
  if (state.success && state.shareCode) {
    const isQueued = state.shareCode === 'QUEUED';
    return (
      <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isQueued 
              ? 'bg-blue-100 dark:bg-blue-900/30' 
              : 'bg-green-100 dark:bg-green-900/30'
          }`}>
            {isQueued ? (
              <Smartphone className={`w-8 h-8 ${
                isQueued 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-green-600 dark:text-green-400'
              }`} />
            ) : (
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            {isQueued ? 'Upload Queued!' : 'Upload Successful!'}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            {isQueued 
              ? 'Your file will be uploaded when you\'re back online.' 
              : 'Your file has been uploaded and is ready to share.'}
          </p>
        </div>

        {!isQueued && (
          <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Share Code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-2xl font-mono font-bold text-neutral-900 dark:text-white text-center">
                {state.shareCode}
              </code>
              <button
                onClick={handleCopyShareCode}
                className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded transition-colors"
                title="Copy share code"
                aria-label="Copy share code to clipboard"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                )}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2 mb-6 text-sm text-neutral-600 dark:text-neutral-400">
          <p>
            <strong>File:</strong> {state.fileName}
          </p>
          <p>
            <strong>Expires:</strong> {new Date(state.expiresAt || '').toLocaleString()}
          </p>
        </div>

        <Button
          onClick={handleReset}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
        >
          Upload Another File
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Upload File</h2>

      {/* Offline Alert */}
      {isOfflineMode && (
        <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" />
          <span className="text-blue-800 dark:text-blue-200">
            You're offline. Your file will be queued and uploaded when you're back online.
          </span>
        </Alert>
      )}

      {/* Error Alert */}
      {state.error && (
        <Alert className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
          <span className="text-red-800 dark:text-red-200">{state.error}</span>
        </Alert>
      )}

      {/* File Preview */}
      {state.preview && (
        <div className="mb-6">
          <img
            src={state.preview}
            alt="File preview"
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Drag and Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors mb-6 cursor-pointer ${
          dragOverRef.current
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500'
        }`}
        role="region"
        aria-label="File upload area"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          className="sr-only"
          disabled={state.uploading}
          aria-label="Select file to upload"
        />

        {state.file ? (
          <div>
            <p className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              {state.file.name}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              {(state.file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              disabled={state.uploading}
              aria-label="Change selected file"
            >
              Change File
            </button>
          </div>
        ) : (
          <div>
            <Upload className="w-12 h-12 text-neutral-400 dark:text-neutral-500 mx-auto mb-3" />
            <p className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Drag and drop your file here
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">or</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              disabled={state.uploading}
              aria-label="Browse files to upload"
            >
              Browse Files
            </button>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4">
              Maximum file size: 100 MB
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {state.uploading && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Uploading...</span>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300" aria-live="polite">
              {state.progress}%
            </span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${state.progress}%` }}
              role="progressbar"
              aria-valuenow={state.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* Expiration Time Input */}
      {state.file && !state.uploading && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
            Expiration Time (minutes)
          </label>
          <input
            type="text"
            placeholder="e.g., 20"
            value={state.expirationMinutes}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setState(prev => ({ ...prev, expirationMinutes: Math.max(1, val) }));
            }}
            className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 dark:bg-neutral-700 dark:text-white bg-white text-neutral-900 transition-all"
            aria-label="Set file expiration time in minutes"
          />
        </div>
      )}

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={!state.file || state.uploading}
        className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 disabled:from-neutral-400 disabled:via-neutral-400 disabled:to-neutral-400 dark:from-blue-700 dark:via-blue-800 dark:to-blue-900 dark:hover:from-blue-800 dark:hover:via-blue-900 dark:hover:to-blue-950 dark:disabled:from-neutral-600 dark:disabled:via-neutral-600 dark:disabled:to-neutral-600 text-white font-bold flex items-center justify-center gap-2 py-3 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
        aria-label={state.uploading ? 'Uploading file' : 'Upload file'}
      >
        {state.uploading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span className="hidden sm:inline">Uploading...</span>
            <span className="sm:hidden">Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            <span className="hidden sm:inline">Upload File</span>
            <span className="sm:hidden">Upload</span>
          </>
        )}
      </Button>

      {/* File Info */}
      {state.file && !state.uploading && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-4">
          Files expire after {state.expirationMinutes} minutes
        </p>
      )}
    </div>
  );
}
