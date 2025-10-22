// Time and Date utilities for the appointment system

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour12 = parseInt(hours) % 12 || 12;
  const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${ampm}`;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatDateTime = (date: Date, time: string): string => {
  return `${formatDate(date)} at ${formatTime(time)}`;
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
};

export const getRelativeDate = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return formatDateShort(date);
};

// Timezone-safe date formatting for API calls
// This prevents the date from shifting due to timezone conversion
export const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get today's date in YYYY-MM-DD format (timezone-safe)
export const getTodayForAPI = (): string => {
  return formatDateForAPI(new Date());
};

// Calculate age from date of birth
export const calculateAge = (dateOfBirth: string | Date): number => {
  let birthDate: Date;
  
  if (typeof dateOfBirth === 'string') {
    // Handle different date formats and ensure proper parsing
    if (dateOfBirth.includes('T')) {
      // ISO format with time
      birthDate = new Date(dateOfBirth);
    } else if (dateOfBirth.includes('-')) {
      // YYYY-MM-DD format - create date in local timezone
      const [year, month, day] = dateOfBirth.split('-').map(Number);
      birthDate = new Date(year, month - 1, day); // month is 0-indexed
    } else {
      birthDate = new Date(dateOfBirth);
    }
  } else {
    birthDate = dateOfBirth;
  }
  
  // Check if date is valid
  if (isNaN(birthDate.getTime())) {
    return 0;
  }
  
  const today = new Date();
  
  // Check if birth date is in the future
  if (birthDate > today) {
    return 0;
  }
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return Math.max(0, age); // Ensure age is not negative
};

// Format age with proper suffix (years/year)
export const formatAge = (dateOfBirth: string | Date): string => {
  const age = calculateAge(dateOfBirth);
  
  // Handle edge cases
  if (age === 0) {
    const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    const today = new Date();
    
    if (birthDate > today) {
      return 'Invalid DOB (future date)';
    } else {
      // Calculate days/months for babies under 1 year
      const diffTime = today.getTime() - birthDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30);
      
      if (diffDays < 30) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} old`;
      } else if (diffMonths < 12) {
        return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} old`;
      } else {
        return 'Less than 1 year old';
      }
    }
  }
  
  return `${age} ${age === 1 ? 'year' : 'years'} old`;
};
