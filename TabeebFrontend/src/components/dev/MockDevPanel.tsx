'use client';

import { useState } from 'react';
import { Settings, Play, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { mockDoctorService } from '@/lib/mock/mockDoctorService';
import APP_CONFIG from '@/lib/config/appConfig';

interface MockDevPanelProps {
  className?: string;
}

export default function MockDevPanel({ className = '' }: MockDevPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!APP_CONFIG.USE_MOCK_BACKEND) {
    return null; // Don't show in production/real backend mode
  }

  const handleMockAction = async (action: string, params?: any) => {
    setIsProcessing(true);
    try {
      switch (action) {
        case 'seed':
          mockDoctorService.seedSampleData();
          window.location.reload(); // Refresh to load new data
          break;
        case 'clear':
          mockDoctorService.clearMockData();
          window.location.reload();
          break;
        case 'approve':
          await mockDoctorService.mockAdminAction('approve', 'mock-token');
          window.location.reload();
          break;
        case 'reject':
          await mockDoctorService.mockAdminAction('reject', 'mock-token');
          window.location.reload();
          break;
        default:
          console.log('Unknown mock action:', action);
      }
    } catch (error) {
      console.error('Mock action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
          title="Mock Development Panel"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-4 w-80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Mock Dev Panel</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
            🎭 Mock Backend Active
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Quick Actions
            </h4>
            
            <button
              onClick={() => handleMockAction('seed')}
              disabled={isProcessing}
              className="w-full flex items-center space-x-2 text-left p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span className="text-sm">Load Sample Doctor Data</span>
            </button>

            <button
              onClick={() => handleMockAction('clear')}
              disabled={isProcessing}
              className="w-full flex items-center space-x-2 text-left p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">Clear All Mock Data</span>
            </button>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Mock Admin Actions
            </h4>
            
            <button
              onClick={() => handleMockAction('approve')}
              disabled={isProcessing}
              className="w-full flex items-center space-x-2 text-left p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Approve Verification</span>
            </button>

            <button
              onClick={() => handleMockAction('reject')}
              disabled={isProcessing}
              className="w-full flex items-center space-x-2 text-left p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span className="text-sm">Reject Verification</span>
            </button>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-slate-600">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div>• Profile data stored in localStorage</div>
              <div>• URL params: ?mock=false to disable</div>
              <div>• URL params: ?seed=true for sample data</div>
            </div>
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center space-x-2 p-2 bg-gray-50 dark:bg-slate-700 rounded">
              <Clock className="w-4 h-4 animate-spin text-gray-600 dark:text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Processing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}