// Utility function to generate time slots based on availability
interface TimeSlot {
  startTime: string;
  endTime: string;
}

export const generateTimeSlots = (
  startTime: string,
  endTime: string,
  duration: number = 30,
  breakStartTime?: string,
  breakEndTime?: string
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  
  // Helper function to convert time string to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to convert minutes back to time string
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const breakStartMinutes = breakStartTime ? timeToMinutes(breakStartTime) : null;
  const breakEndMinutes = breakEndTime ? timeToMinutes(breakEndTime) : null;

  console.log('generateTimeSlots debug:', {
    startTime, endTime, duration,
    breakStartTime, breakEndTime,
    startMinutes, endMinutes,
    breakStartMinutes, breakEndMinutes
  });

  let currentMinutes = startMinutes;

  while (currentMinutes + duration <= endMinutes) {
    const slotStart = currentMinutes;
    const slotEnd = currentMinutes + duration;

    // Check if this slot conflicts with break time
    const isInBreak = breakStartMinutes && breakEndMinutes && 
      (slotStart < breakEndMinutes && slotEnd > breakStartMinutes);

    console.log(`Slot ${minutesToTime(slotStart)}-${minutesToTime(slotEnd)}: isInBreak = ${isInBreak}`);

    if (!isInBreak) {
      slots.push({
        startTime: minutesToTime(slotStart),
        endTime: minutesToTime(slotEnd)
      });
    } else {
      console.log(`Skipping slot ${minutesToTime(slotStart)}-${minutesToTime(slotEnd)} due to break time`);
    }

    currentMinutes += duration;

    // Skip break time
    if (breakStartMinutes && breakEndMinutes && currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes) {
      currentMinutes = breakEndMinutes;
    }
  }

  return slots;
};

// Helper function to check if two time slots overlap
export const slotsOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);

  return start1 < end2 && start2 < end1;
};

// Helper function to format time for display
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Helper function to get next 7 days from a given date
export const getNextSevenDays = (startDate: Date = new Date()): Date[] => {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// Helper function to check if a date is today
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

// Helper function to check if a date is in the past
export const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};
