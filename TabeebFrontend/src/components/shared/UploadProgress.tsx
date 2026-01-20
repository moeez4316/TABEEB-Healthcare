'use client';

import { useEffect, useState } from 'react';
import { Upload, Check, X, Loader2 } from 'lucide-react';

interface UploadProgressProps {
  progress: number; // 0-100
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  fileName?: string;
  errorMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  onCancel?: () => void;
  onRetry?: () => void;
}

/**
 * Circular Progress Component - Used for uploads throughout the app
 */
export function CircularProgress({ 
  progress, 
  status, 
  fileName,
  errorMessage,
  size = 'md',
  onCancel,
  onRetry 
}: UploadProgressProps) {
  const sizes = {
    sm: { container: 80, stroke: 6, icon: 20, text: 'text-xs' },
    md: { container: 120, stroke: 8, icon: 28, text: 'text-sm' },
    lg: { container: 160, stroke: 10, icon: 36, text: 'text-base' },
  };

  const { container, stroke, icon, text } = sizes[size];
  const radius = (container - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const offset = circumference - (safeProgress / 100) * circumference;

  const getStatusColor = () => {
    switch (status) {
      case 'uploading': return 'text-blue-500';
      case 'processing': return 'text-amber-500';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getStrokeColor = () => {
    switch (status) {
      case 'uploading': return 'stroke-blue-500';
      case 'processing': return 'stroke-amber-500';
      case 'success': return 'stroke-green-500';
      case 'error': return 'stroke-red-500';
      default: return 'stroke-gray-300';
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: container, height: container }}>
        {/* Background circle */}
        <svg className="absolute inset-0 -rotate-90" width={container} height={container}>
          <circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={`${getStrokeColor()} transition-all duration-300 ease-out`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: status === 'idle' ? circumference : offset,
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${getStatusColor()}`}>
          {status === 'idle' && <Upload size={icon} />}
          {status === 'uploading' && (
            <span className={`font-semibold ${text}`}>{Math.round(safeProgress)}%</span>
          )}
          {status === 'processing' && <Loader2 size={icon} className="animate-spin" />}
          {status === 'success' && <Check size={icon} />}
          {status === 'error' && <X size={icon} />}
        </div>
      </div>

      {/* Status text */}
      <div className="text-center">
        {fileName && (
          <p className={`${text} font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]`}>
            {fileName}
          </p>
        )}
        <p className={`${text} ${getStatusColor()}`}>
          {status === 'idle' && 'Ready to upload'}
          {status === 'uploading' && 'Uploading...'}
          {status === 'processing' && 'Processing...'}
          {status === 'success' && 'Upload complete!'}
          {status === 'error' && (errorMessage || 'Upload failed')}
        </p>
      </div>

      {/* Action buttons */}
      {(status === 'uploading' && onCancel) && (
        <button
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-red-500 transition-colors"
        >
          Cancel
        </button>
      )}
      {(status === 'error' && onRetry) && (
        <button
          onClick={onRetry}
          className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * Linear Progress Bar - Compact horizontal bar for profile images
 */
export function LinearProgress({ 
  progress, 
  status,
  fileName,
  errorMessage,
  size = 'md',
  onCancel 
}: UploadProgressProps) {
  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const getBarColor = () => {
    switch (status) {
      case 'uploading': return 'bg-blue-500';
      case 'processing': return 'bg-amber-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Header with filename and percentage */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {status === 'uploading' && <Loader2 size={14} className="animate-spin text-blue-500" />}
          {status === 'processing' && <Loader2 size={14} className="animate-spin text-amber-500" />}
          {status === 'success' && <Check size={14} className="text-green-500" />}
          {status === 'error' && <X size={14} className="text-red-500" />}
          <span className="text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
            {fileName || 'Uploading file...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'uploading' && (
            <>
              <span className="text-gray-500">{progress}%</span>
              {onCancel && (
                <button onClick={onCancel} className="text-gray-400 hover:text-red-500">
                  <X size={14} />
                </button>
              )}
            </>
          )}
          {status === 'error' && (
            <span className="text-red-500 text-xs">{errorMessage || 'Failed'}</span>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className={`w-full ${heights[size]} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <div
          className={`${heights[size]} ${getBarColor()} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Hook to manage upload progress state
 */
export function useUploadProgress() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setProgress(0);
    setStatus('idle');
    setError(null);
  };

  const startUpload = () => {
    setProgress(0);
    setStatus('uploading');
    setError(null);
  };

  const updateProgress = (value: number) => {
    setProgress(value);
  };

  const startProcessing = () => {
    setStatus('processing');
    setProgress(100);
  };

  const complete = () => {
    setStatus('success');
    setProgress(100);
  };

  const fail = (message?: string) => {
    setStatus('error');
    setError(message || 'Upload failed');
  };

  // Auto-reset success status after delay
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => reset(), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return {
    progress,
    status,
    error,
    reset,
    startUpload,
    updateProgress,
    startProcessing,
    complete,
    fail,
    onProgress: (p: { percentage: number }) => updateProgress(p.percentage),
  };
}

export default CircularProgress;
