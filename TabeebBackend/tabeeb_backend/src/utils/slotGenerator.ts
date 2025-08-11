// Enhanced utility functions for on-demand time slot generation
// This replaces the database-stored TimeSlot approach for better scalability

interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
}

interface BreakTime {
  startTime: string;
  endTime: string;
}

interface DoctorAvailability {
  startTime: string;
  endTime: string;
  slotDuration: number;
  breakTimes?: BreakTime[];
}

interface BookedAppointment {
  startTime: string;
  endTime: string;
}

/**
 * Generate available time slots on-demand
 * This replaces the database-stored TimeSlot approach for better scalability
 */
export function generateAvailableSlots(
  availability: DoctorAvailability,
  bookedAppointments: BookedAppointment[] = []
): TimeSlot[] {
  if (!availability) {
    return [];
  }

  const { startTime, endTime, slotDuration } = availability;
  const slots: TimeSlot[] = [];

  // Convert time strings to minutes for easier calculation
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // Prepare break times
  const breakTimes: { start: number; end: number }[] = [];
  
  // Add multiple break times
  if (availability.breakTimes && availability.breakTimes.length > 0) {
    availability.breakTimes.forEach(breakTime => {
      breakTimes.push({
        start: timeToMinutes(breakTime.startTime),
        end: timeToMinutes(breakTime.endTime)
      });
    });
  }

  // Generate all possible slots
  for (let current = startMinutes; current + slotDuration <= endMinutes; current += slotDuration) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + slotDuration);

    // Skip slots that overlap with any break time
    let skipSlot = false;
    for (const breakTime of breakTimes) {
      if (current < breakTime.end && current + slotDuration > breakTime.start) {
        skipSlot = true;
        break;
      }
    }
    
    if (skipSlot) {
      continue;
    }

    // Check if this slot is already booked
    const isBooked = bookedAppointments.some(appointment => 
      appointment.startTime === slotStart
    );

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      duration: slotDuration,
      isAvailable: !isBooked
    });
  }

  // Return only available slots
  return slots.filter(slot => slot.isAvailable);
}

/**
 * Generate all possible slots (including booked ones) for admin view
 */
export function generateAllSlots(
  availability: DoctorAvailability,
  bookedAppointments: BookedAppointment[] = []
): TimeSlot[] {
  if (!availability) {
    return [];
  }

  const { startTime, endTime, slotDuration } = availability;
  const slots: TimeSlot[] = [];

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // Prepare break times
  const breakTimes: { start: number; end: number }[] = [];
  
  // Add multiple break times
  if (availability.breakTimes && availability.breakTimes.length > 0) {
    availability.breakTimes.forEach(breakTime => {
      breakTimes.push({
        start: timeToMinutes(breakTime.startTime),
        end: timeToMinutes(breakTime.endTime)
      });
    });
  }

  for (let current = startMinutes; current + slotDuration <= endMinutes; current += slotDuration) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + slotDuration);

    // Skip slots that overlap with any break time
    let skipSlot = false;
    for (const breakTime of breakTimes) {
      if (current < breakTime.end && current + slotDuration > breakTime.start) {
        skipSlot = true;
        break;
      }
    }
    
    if (skipSlot) {
      continue;
    }

    const isBooked = bookedAppointments.some(appointment => 
      appointment.startTime === slotStart
    );

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      duration: slotDuration,
      isAvailable: !isBooked
    });
  }

  return slots; // Return all slots, including booked ones
}

/**
 * Calculate total slots for a given availability (for statistics)
 */
export function calculateTotalSlots(availability: DoctorAvailability): number {
  if (!availability) return 0;

  const { startTime, endTime, slotDuration } = availability;
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  let totalMinutes = endMinutes - startMinutes;
  
  // Subtract multiple break times if they exist
  if (availability.breakTimes && availability.breakTimes.length > 0) {
    availability.breakTimes.forEach(breakTime => {
      const breakDuration = timeToMinutes(breakTime.endTime) - timeToMinutes(breakTime.startTime);
      totalMinutes -= breakDuration;
    });
  }
  
  return Math.floor(totalMinutes / slotDuration);
}

/**
 * Get next available slot for quick booking
 */
export function getNextAvailableSlot(
  availability: DoctorAvailability,
  bookedAppointments: BookedAppointment[]
): TimeSlot | null {
  const availableSlots = generateAvailableSlots(availability, bookedAppointments);
  return availableSlots.length > 0 ? availableSlots[0] : null;
}

/**
 * Calculate end time from start time and duration
 */
export function calculateEndTime(startTime: string, duration: number): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + duration;
  return minutesToTime(endMinutes);
}

/**
 * Validate time slot format and logic
 */
export function isValidTimeSlot(startTime: string, endTime: string, duration: number): boolean {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return false;
  }
  
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  
  return (
    end > start && // End must be after start
    duration > 0 && duration <= 180 && // Duration between 1 minute and 3 hours
    start >= 0 && end <= 1440 && // Times must be within 24 hours
    (end - start) >= duration // Total time must accommodate at least one slot
  );
}

/**
 * Validate multiple break times don't overlap and are within working hours
 */
export function validateMultipleBreakTimes(
  startTime: string,
  endTime: string,
  breakTimes: { startTime: string; endTime: string }[]
): { valid: boolean; error?: string } {
  if (!breakTimes || breakTimes.length === 0) {
    return { valid: true };
  }

  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  // Validate each break time individually
  for (let i = 0; i < breakTimes.length; i++) {
    const breakTime = breakTimes[i];
    
    if (!isValidTimeFormat(breakTime.startTime) || !isValidTimeFormat(breakTime.endTime)) {
      return { valid: false, error: `Break time ${i + 1} has invalid time format` };
    }

    const breakStart = timeToMinutes(breakTime.startTime);
    const breakEnd = timeToMinutes(breakTime.endTime);

    if (breakEnd <= breakStart) {
      return { valid: false, error: `Break time ${i + 1}: end time must be after start time` };
    }

    if (breakStart < start || breakEnd > end) {
      return { valid: false, error: `Break time ${i + 1} must be within working hours` };
    }
  }

  // Check for overlapping break times
  for (let i = 0; i < breakTimes.length; i++) {
    for (let j = i + 1; j < breakTimes.length; j++) {
      const break1Start = timeToMinutes(breakTimes[i].startTime);
      const break1End = timeToMinutes(breakTimes[i].endTime);
      const break2Start = timeToMinutes(breakTimes[j].startTime);
      const break2End = timeToMinutes(breakTimes[j].endTime);

      // Check if break times overlap
      if (break1Start < break2End && break2Start < break1End) {
        return { valid: false, error: `Break times ${i + 1} and ${j + 1} overlap` };
      }
    }
  }

  return { valid: true };
}

/**
 * Check if a time slot is available for booking
 */
export function isSlotAvailable(
  slotStartTime: string,
  availability: DoctorAvailability,
  bookedAppointments: BookedAppointment[]
): boolean {
  const availableSlots = generateAvailableSlots(availability, bookedAppointments);
  return availableSlots.some(slot => slot.startTime === slotStartTime);
}

// Helper functions
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Check if two time slots overlap
 */
export function slotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);
  
  return start1 < end2 && start2 < end1;
}

/**
 * Format time for display (12-hour format)
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Get next 7 days from a given date
 */
export function getNextSevenDays(startDate: Date = new Date()): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Get slots statistics for a given availability and appointments
 */
export function getSlotsStatistics(
  availability: DoctorAvailability,
  bookedAppointments: BookedAppointment[]
) {
  const totalSlots = calculateTotalSlots(availability);
  const bookedSlots = bookedAppointments.length;
  const availableSlots = totalSlots - bookedSlots;
  const utilization = totalSlots > 0 ? ((bookedSlots / totalSlots) * 100).toFixed(1) : '0';

  return {
    totalSlots,
    bookedSlots,
    availableSlots,
    utilization: `${utilization}%`
  };
}
