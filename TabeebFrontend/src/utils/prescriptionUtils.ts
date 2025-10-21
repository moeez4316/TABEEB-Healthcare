/**
 * Prescription Status and Progress Utilities
 * Handles calculation of medicine tracking features
 */

export enum PrescriptionStatus {
  ACTIVE = 'active',
  EXPIRING = 'expiring', 
  EXPIRED = 'expired',
  COMPLETED = 'completed'
}

export interface PrescriptionProgress {
  status: PrescriptionStatus;
  daysRemaining: number;
  daysTotal: number;
  progressPercentage: number;
  statusColor: string;
  statusText: string;
  canMarkCompleted: boolean;
}

/**
 * Calculate prescription progress and status
 */
export function calculatePrescriptionProgress(
  startDate: string | Date,
  endDate: string | Date,
  isActive: boolean = true
): PrescriptionProgress {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  // Reset time to start of day for accurate day calculations
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  now.setHours(0, 0, 0, 0);
  
  const daysTotal = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate current day of prescription (1-based: Day 1, Day 2, Day 3, etc.)
  const currentDay = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Days remaining: how many days left including today
  let daysRemaining;
  if (now > end) {
    daysRemaining = 0; // Prescription completed/expired
  } else {
    daysRemaining = daysTotal - currentDay + 1;
  }
  
  // Progress percentage: completed full days / total days
  const completedDays = Math.max(0, Math.min(currentDay - 1, daysTotal));
  const progressPercentage = (completedDays / daysTotal) * 100;
  
  let status: PrescriptionStatus;
  let statusColor: string;
  let statusText: string;
  
  if (!isActive) {
    status = PrescriptionStatus.COMPLETED;
    statusColor = 'gray';
    statusText = 'Completed';
  } else if (now > end) {
    status = PrescriptionStatus.COMPLETED;
    statusColor = 'gray';
    statusText = 'Completed';
  } else if (daysRemaining === 1) {
    status = PrescriptionStatus.EXPIRING;
    statusColor = 'yellow';
    statusText = 'Last Day';
  } else {
    status = PrescriptionStatus.ACTIVE;
    statusColor = 'green';
    statusText = 'Active';
  }
  
  return {
    status,
    daysRemaining,
    daysTotal,
    progressPercentage,
    statusColor,
    statusText,
    canMarkCompleted: isActive && status !== PrescriptionStatus.COMPLETED
  };
}

/**
 * Format days remaining text
 */
export function formatDaysRemaining(daysRemaining: number): string {
  if (daysRemaining === 0) {
    return 'Completed';
  } else if (daysRemaining === 1) {
    return 'Last day';
  } else {
    return `${daysRemaining} days left`;
  }
}

/**
 * Get status color classes for Tailwind
 */
export function getStatusColorClasses(status: PrescriptionStatus) {
  switch (status) {
    case PrescriptionStatus.ACTIVE:
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800'
      };
    case PrescriptionStatus.EXPIRING:
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800'
      };
    case PrescriptionStatus.EXPIRED:
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800'
      };
    case PrescriptionStatus.COMPLETED:
      return {
        bg: 'bg-gray-100 dark:bg-gray-900/30',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-800'
      };
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-900/30',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-800'
      };
  }
}

/**
 * Get progress bar color based on percentage
 */
export function getProgressBarColor(percentage: number, status: PrescriptionStatus): string {
  if (status === PrescriptionStatus.EXPIRED) {
    return 'bg-red-500';
  } else if (status === PrescriptionStatus.EXPIRING) {
    return 'bg-yellow-500';
  } else if (status === PrescriptionStatus.COMPLETED) {
    return 'bg-gray-500';
  } else {
    return 'bg-green-500';
  }
}

/**
 * Calculate medicine-specific progress (for individual medicines within a prescription)
 */
export function calculateMedicineProgress(
  prescriptionStartDate: string | Date,
  medicineDurationDays: number,
  isActive: boolean = true
): PrescriptionProgress {
  const startDate = new Date(prescriptionStartDate);
  const endDate = new Date(startDate);
  // For a 3-day medicine: Day 1, Day 2, Day 3 (so end on Day 3, not Day 4)
  endDate.setDate(startDate.getDate() + medicineDurationDays - 1);
  
  return calculatePrescriptionProgress(startDate, endDate, isActive);
}