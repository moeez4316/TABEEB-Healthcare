import { Request, Response, NextFunction } from 'express';

// Validate appointment booking request
export const validateBookAppointment = (req: Request, res: Response, next: NextFunction) => {
  const { doctorUid, timeSlotId, appointmentDate } = req.body;

  // Check required fields
  if (!doctorUid) {
    return res.status(400).json({ error: 'Doctor UID is required' });
  }

  if (!timeSlotId) {
    return res.status(400).json({ error: 'Time slot ID is required' });
  }

  if (!appointmentDate) {
    return res.status(400).json({ error: 'Appointment date is required' });
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

// Validate availability setting request
export const validateSetAvailability = (req: Request, res: Response, next: NextFunction) => {
  const { date, startTime, endTime, slotDuration, breakStartTime, breakEndTime } = req.body;

  // Check required fields
  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  if (!startTime) {
    return res.status(400).json({ error: 'Start time is required' });
  }

  if (!endTime) {
    return res.status(400).json({ error: 'End time is required' });
  }

  if (!slotDuration) {
    return res.status(400).json({ error: 'Slot duration is required' });
  }

  // Validate date format
  const availabilityDate = new Date(date);
  if (isNaN(availabilityDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  // Check if date is in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (availabilityDate < today) {
    return res.status(400).json({ error: 'Availability date cannot be in the past' });
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!timeRegex.test(startTime)) {
    return res.status(400).json({ error: 'Invalid start time format. Use HH:MM' });
  }

  if (!timeRegex.test(endTime)) {
    return res.status(400).json({ error: 'Invalid end time format. Use HH:MM' });
  }

  // Validate break times if provided
  if (breakStartTime && !timeRegex.test(breakStartTime)) {
    return res.status(400).json({ error: 'Invalid break start time format. Use HH:MM' });
  }

  if (breakEndTime && !timeRegex.test(breakEndTime)) {
    return res.status(400).json({ error: 'Invalid break end time format. Use HH:MM' });
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

  // Validate break times if both are provided
  if (breakStartTime && breakEndTime) {
    const breakStart = new Date(`2000-01-01T${breakStartTime}:00`);
    const breakEnd = new Date(`2000-01-01T${breakEndTime}:00`);
    
    if (breakStart >= breakEnd) {
      return res.status(400).json({ error: 'Break start time must be before break end time' });
    }

    // Check if break times are within working hours
    if (breakStart < start || breakEnd > end) {
      return res.status(400).json({ error: 'Break times must be within working hours' });
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
