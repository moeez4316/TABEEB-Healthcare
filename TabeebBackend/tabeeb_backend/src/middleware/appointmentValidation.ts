import { Request, Response, NextFunction } from 'express';

// Maximum number of break times allowed per availability
const MAX_BREAK_TIMES = 4; // Reasonable limit: lunch + 3 other breaks (coffee, prayer, etc.)

// Validate appointment booking request (OPTIMIZED)
export const validateBookAppointment = (req: Request, res: Response, next: NextFunction) => {
  const { doctorUid, startTime, appointmentDate } = req.body;

  // Check required fields
  if (!doctorUid) {
    return res.status(400).json({ error: 'Doctor UID is required' });
  }

  if (!startTime) {
    return res.status(400).json({ error: 'Start time is required' });
  }

  if (!appointmentDate) {
    return res.status(400).json({ error: 'Appointment date is required' });
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(startTime)) {
    return res.status(400).json({ error: 'Invalid start time format. Use HH:MM (e.g., 09:00)' });
  }

  // Validate date format
  const date = new Date(appointmentDate);
  if (isNaN(date.getTime())) {
    return res.status(400).json({ error: 'Invalid appointment date format' });
  }

  // Check if appointment date is in the future
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  if (date < now) {
    return res.status(400).json({ error: 'Appointment date cannot be in the past' });
  }

  // Check if appointment date is not too far in the future (e.g., 3 months)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  
  if (date > maxDate) {
    return res.status(400).json({ error: 'Appointment date cannot be more than 3 months in advance' });
  }

  next();
};

// Validate availability data
export const validateAvailability = (req: Request, res: Response, next: NextFunction) => {
  const { date, startTime, endTime, slotDuration, breakTimes } = req.body;

  // Basic required fields validation
  if (!date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Date, start time, and end time are required' });
  }

  // Time format validation
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!timeRegex.test(startTime)) {
    return res.status(400).json({ error: 'Invalid start time format. Use HH:MM' });
  }

  if (!timeRegex.test(endTime)) {
    return res.status(400).json({ error: 'Invalid end time format. Use HH:MM' });
  }

  // Check if start time is before end time
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  if (start >= end) {
    return res.status(400).json({ error: 'Start time must be before end time' });
  }

  // Validate slot duration (should be between 15 and 180 minutes)
  const duration = parseInt(slotDuration);
  if (isNaN(duration) || duration < 15 || duration > 180) {
    return res.status(400).json({ error: 'Slot duration must be between 15 and 180 minutes' });
  }

  // Validate multiple break times if provided
  if (breakTimes) {
    if (!Array.isArray(breakTimes)) {
      return res.status(400).json({ error: 'Break times must be an array' });
    }

    if (breakTimes.length > MAX_BREAK_TIMES) {
      return res.status(400).json({ 
        error: `Maximum ${MAX_BREAK_TIMES} break times allowed per day` 
      });
    }

    // Validate each break time
    for (let i = 0; i < breakTimes.length; i++) {
      const breakTime = breakTimes[i];
      
      if (!breakTime.startTime || !breakTime.endTime) {
        return res.status(400).json({ 
          error: `Break time ${i + 1} must have both start and end time` 
        });
      }

      if (!timeRegex.test(breakTime.startTime) || !timeRegex.test(breakTime.endTime)) {
        return res.status(400).json({ 
          error: `Break time ${i + 1} has invalid time format. Use HH:MM` 
        });
      }

      const bStart = new Date(`2000-01-01T${breakTime.startTime}:00`);
      const bEnd = new Date(`2000-01-01T${breakTime.endTime}:00`);
      
      if (bStart >= bEnd) {
        return res.status(400).json({ 
          error: `Break time ${i + 1}: start time must be before end time` 
        });
      }

      if (bStart < start || bEnd > end) {
        return res.status(400).json({ 
          error: `Break time ${i + 1} must be within working hours` 
        });
      }
    }

    // Check for overlapping break times
    for (let i = 0; i < breakTimes.length; i++) {
      for (let j = i + 1; j < breakTimes.length; j++) {
        const break1Start = new Date(`2000-01-01T${breakTimes[i].startTime}:00`);
        const break1End = new Date(`2000-01-01T${breakTimes[i].endTime}:00`);
        const break2Start = new Date(`2000-01-01T${breakTimes[j].startTime}:00`);
        const break2End = new Date(`2000-01-01T${breakTimes[j].endTime}:00`);

        if (break1Start < break2End && break2Start < break1End) {
          return res.status(400).json({ 
            error: `Break times ${i + 1} and ${j + 1} overlap` 
          });
        }
      }
    }

    // Validate minimum gap between break times (15 minutes)
    const sortedBreaks = breakTimes
      .map(bt => ({
        start: new Date(`2000-01-01T${bt.startTime}:00`),
        end: new Date(`2000-01-01T${bt.endTime}:00`)
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    for (let i = 0; i < sortedBreaks.length - 1; i++) {
      const currentEnd = sortedBreaks[i].end;
      const nextStart = sortedBreaks[i + 1].start;
      const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
      
      if (gapMinutes < 15) {
        return res.status(400).json({ 
          error: 'Minimum 15 minutes gap required between break times' 
        });
      }
    }
  }

  next();
};

// Validate appointment status update
export const validateStatusUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
    });
  }

  next();
};

// Validate pagination parameters
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { page, limit } = req.query;

  if (page) {
    const pageNum = parseInt(page as string);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Page must be a positive integer' });
    }
  }

  if (limit) {
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }
  }

  next();
};

// Validate UUID format
export const validateUUID = (field: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[field] || req.body[field];
    
    if (!value) {
      return next();
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(value)) {
      return res.status(400).json({ error: `Invalid ${field} format` });
    }

    next();
  };
};

// Validate CUID format (used by Prisma)
export const validateCUID = (field: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[field] || req.body[field];
    
    if (!value) {
      return next();
    }

    // CUID pattern: starts with 'c', followed by base36 characters, length 25
    const cuidRegex = /^c[a-z0-9]{24}$/;
    
    if (!cuidRegex.test(value)) {
      return res.status(400).json({ error: `Invalid ${field} format` });
    }

    next();
  };
};
