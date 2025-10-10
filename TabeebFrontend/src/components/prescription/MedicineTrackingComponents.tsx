/**
 * Medicine Progress Components
 * Reusable UI components for prescription tracking
 */

import React from 'react';
import { 
  PrescriptionProgress, 
  PrescriptionStatus,
  getStatusColorClasses,
  getProgressBarColor,
  formatDaysRemaining
} from '@/utils/prescriptionUtils';

interface StatusBadgeProps {
  status: PrescriptionStatus;
  statusText: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  statusText, 
  className = '' 
}) => {
  const colors = getStatusColorClasses(status);
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      {statusText}
    </span>
  );
};

interface ProgressBarProps {
  progress: PrescriptionProgress;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  showPercentage = false,
  className = '' 
}) => {
  const progressColor = getProgressBarColor(progress.progressPercentage, progress.status);
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Progress
        </span>
        {showPercentage && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(progress.progressPercentage)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
          style={{ width: `${progress.progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

interface DaysCounterProps {
  daysRemaining: number;
  daysTotal: number;
  status: PrescriptionStatus;
  className?: string;
}

export const DaysCounter: React.FC<DaysCounterProps> = ({ 
  daysRemaining, 
  daysTotal,
  status, 
  className = '' 
}) => {
  const colors = getStatusColorClasses(status);
  
  return (
    <div className={`text-center ${className}`}>
      <div className={`text-2xl font-bold ${colors.text}`}>
        {daysRemaining < 0 ? 0 : daysRemaining}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        of {daysTotal} days
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {formatDaysRemaining(daysRemaining)}
      </div>
    </div>
  );
};

interface MedicineTrackingCardProps {
  medicineName: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  progress: PrescriptionProgress;
  onMarkCompleted?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const MedicineTrackingCard: React.FC<MedicineTrackingCardProps> = ({
  medicineName,
  dosage,
  frequency,
  instructions,
  progress,
  onMarkCompleted,
  isLoading = false,
  className = ''
}) => {
  const colors = getStatusColorClasses(progress.status);
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border ${colors.border} p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            {medicineName}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {dosage} • {frequency}
          </p>
          {instructions && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {instructions}
            </p>
          )}
        </div>
        <StatusBadge 
          status={progress.status} 
          statusText={progress.statusText}
        />
      </div>
      
      {/* Progress Section */}
      <div className="space-y-3">
        <ProgressBar progress={progress} showPercentage />
        
        <div className="flex items-center justify-between">
          <DaysCounter 
            daysRemaining={progress.daysRemaining}
            daysTotal={progress.daysTotal}
            status={progress.status}
          />
          
          {/* Mark Completed Button */}
          {progress.canMarkCompleted && onMarkCompleted && (
            <button
              onClick={onMarkCompleted}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed dark:text-green-300 dark:bg-green-900/30 dark:border-green-800 dark:hover:bg-green-900/50"
            >
              {isLoading ? 'Marking...' : 'Mark Completed'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface PrescriptionOverviewProps {
  prescriptionId: string;
  doctorName: string;
  appointmentDate: string;
  totalMedicines: number;
  activeMedicines: number;
  overallProgress: PrescriptionProgress;
  className?: string;
}

export const PrescriptionOverview: React.FC<PrescriptionOverviewProps> = ({
  prescriptionId,
  doctorName,
  appointmentDate,
  totalMedicines,
  activeMedicines,
  overallProgress,
  className = ''
}) => {
  const colors = getStatusColorClasses(overallProgress.status);
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border ${colors.border} p-4 shadow-sm ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Prescription #{prescriptionId.slice(-6).toUpperCase()}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Dr. {doctorName} • {new Date(appointmentDate).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge 
          status={overallProgress.status} 
          statusText={overallProgress.statusText}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {activeMedicines}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Active Medicines
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {totalMedicines}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total Medicines
          </div>
        </div>
      </div>
      
      <ProgressBar progress={overallProgress} showPercentage />
      
      <div className="mt-3 text-center">
        <DaysCounter 
          daysRemaining={overallProgress.daysRemaining}
          daysTotal={overallProgress.daysTotal}
          status={overallProgress.status}
        />
      </div>
    </div>
  );
};
