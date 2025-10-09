import { Request, Response, NextFunction } from 'express';

// Maximum medicines per prescription
const MAX_MEDICINES = 10;

// Validate prescription creation request
export const validateCreatePrescription = (req: Request, res: Response, next: NextFunction) => {
  const { patientUid, medicines, diagnosis, notes, instructions } = req.body;

  // Check required fields
  if (!patientUid) {
    return res.status(400).json({ error: 'Patient UID is required' });
  }

  if (!medicines || !Array.isArray(medicines)) {
    return res.status(400).json({ error: 'Medicines array is required' });
  }

  if (medicines.length === 0) {
    return res.status(400).json({ error: 'At least one medicine is required' });
  }

  if (medicines.length > MAX_MEDICINES) {
    return res.status(400).json({ error: `Maximum ${MAX_MEDICINES} medicines allowed per prescription` });
  }

  // Validate each medicine
  for (let i = 0; i < medicines.length; i++) {
    const medicine = medicines[i];
    
    if (!medicine.medicineName || medicine.medicineName.trim() === '') {
      return res.status(400).json({ error: `Medicine ${i + 1}: Medicine name is required` });
    }

    if (!medicine.dosage || medicine.dosage.trim() === '') {
      return res.status(400).json({ error: `Medicine ${i + 1}: Dosage is required` });
    }

    if (!medicine.frequency || medicine.frequency.trim() === '') {
      return res.status(400).json({ error: `Medicine ${i + 1}: Frequency is required` });
    }

    if (!medicine.duration || medicine.duration.trim() === '') {
      return res.status(400).json({ error: `Medicine ${i + 1}: Duration is required` });
    }

    // Validate medicine name length
    if (medicine.medicineName.length > 100) {
      return res.status(400).json({ error: `Medicine ${i + 1}: Medicine name too long (max 100 characters)` });
    }

    // Validate dosage format (basic check)
    if (medicine.dosage.length > 50) {
      return res.status(400).json({ error: `Medicine ${i + 1}: Dosage too long (max 50 characters)` });
    }
  }

  // Check for duplicate medicines
  const medicineNames = medicines.map((med: any) => med.medicineName.toLowerCase().trim());
  const duplicates = medicineNames.filter((name: string, index: number) => 
    medicineNames.indexOf(name) !== index
  );

  if (duplicates.length > 0) {
    return res.status(400).json({ 
      error: 'Duplicate medicines found',
      details: `Duplicate medicine: ${duplicates[0]}`
    });
  }

  // Validate optional fields length
  if (diagnosis && diagnosis.length > 500) {
    return res.status(400).json({ error: 'Diagnosis too long (max 500 characters)' });
  }

  if (notes && notes.length > 1000) {
    return res.status(400).json({ error: 'Notes too long (max 1000 characters)' });
  }

  if (instructions && instructions.length > 1000) {
    return res.status(400).json({ error: 'Instructions too long (max 1000 characters)' });
  }

  next();
};

// Validate prescription update request
export const validateUpdatePrescription = (req: Request, res: Response, next: NextFunction) => {
  const { medicines, diagnosis, notes, instructions, isActive } = req.body;

  // At least one field should be provided for update
  if (!medicines && !diagnosis && !notes && !instructions && isActive === undefined) {
    return res.status(400).json({ error: 'At least one field is required for update' });
  }

  // Validate medicines if provided
  if (medicines !== undefined) {
    if (!Array.isArray(medicines)) {
      return res.status(400).json({ error: 'Medicines must be an array' });
    }

    if (medicines.length === 0) {
      return res.status(400).json({ error: 'At least one medicine is required' });
    }

    if (medicines.length > MAX_MEDICINES) {
      return res.status(400).json({ error: `Maximum ${MAX_MEDICINES} medicines allowed per prescription` });
    }

    // Validate each medicine
    for (let i = 0; i < medicines.length; i++) {
      const medicine = medicines[i];
      
      if (!medicine.medicineName || medicine.medicineName.trim() === '') {
        return res.status(400).json({ error: `Medicine ${i + 1}: Medicine name is required` });
      }

      if (!medicine.dosage || medicine.dosage.trim() === '') {
        return res.status(400).json({ error: `Medicine ${i + 1}: Dosage is required` });
      }

      if (!medicine.frequency || medicine.frequency.trim() === '') {
        return res.status(400).json({ error: `Medicine ${i + 1}: Frequency is required` });
      }

      if (!medicine.duration || medicine.duration.trim() === '') {
        return res.status(400).json({ error: `Medicine ${i + 1}: Duration is required` });
      }
    }

    // Check for duplicate medicines
    const medicineNames = medicines.map((med: any) => med.medicineName.toLowerCase().trim());
    const duplicates = medicineNames.filter((name: string, index: number) => 
      medicineNames.indexOf(name) !== index
    );

    if (duplicates.length > 0) {
      return res.status(400).json({ 
        error: 'Duplicate medicines found',
        details: `Duplicate medicine: ${duplicates[0]}`
      });
    }
  }

  // Validate optional fields length
  if (diagnosis !== undefined && diagnosis.length > 500) {
    return res.status(400).json({ error: 'Diagnosis too long (max 500 characters)' });
  }

  if (notes !== undefined && notes.length > 1000) {
    return res.status(400).json({ error: 'Notes too long (max 1000 characters)' });
  }

  if (instructions !== undefined && instructions.length > 1000) {
    return res.status(400).json({ error: 'Instructions too long (max 1000 characters)' });
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive must be a boolean value' });
  }

  next();
};

// Validate prescription ID parameter
export const validatePrescriptionId = (req: Request, res: Response, next: NextFunction) => {
  const { prescriptionId } = req.params;
  
  if (!prescriptionId) {
    return res.status(400).json({ error: 'Prescription ID is required' });
  }
  
  if (prescriptionId.trim() === '') {
    return res.status(400).json({ error: 'Prescription ID cannot be empty' });
  }

  // Basic length validation (UUIDs are typically 36 characters)
  if (prescriptionId.length < 10 || prescriptionId.length > 50) {
    return res.status(400).json({ error: 'Invalid prescription ID format' });
  }
  
  next();
};

// Validate appointment ID parameter
export const validateAppointmentId = (req: Request, res: Response, next: NextFunction) => {
  const { appointmentId } = req.params;
  
  if (!appointmentId) {
    return res.status(400).json({ error: 'Appointment ID is required' });
  }
  
  if (appointmentId.trim() === '') {
    return res.status(400).json({ error: 'Appointment ID cannot be empty' });
  }

  // Basic length validation
  if (appointmentId.length < 5 || appointmentId.length > 50) {
    return res.status(400).json({ error: 'Invalid appointment ID format' });
  }
  
  next();
};

// Validate pagination parameters
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, isActive } = req.query;
  
  if (page) {
    const pageNum = parseInt(page as string);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Page must be a positive integer' });
    }
    if (pageNum > 1000) {
      return res.status(400).json({ error: 'Page number too large (max 1000)' });
    }
  }
  
  if (limit) {
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }
  }

  if (isActive) {
    if (isActive !== 'true' && isActive !== 'false') {
      return res.status(400).json({ error: 'isActive must be true or false' });
    }
  }
  
  next();
};

// Basic medicine interaction validation
export const validateMedicineInteractions = (req: Request, res: Response, next: NextFunction) => {
  const { medicines } = req.body;
  
  if (!medicines || !Array.isArray(medicines)) {
    return next(); // Skip if no medicines (will be caught by other validation)
  }
  
  // Check for potentially dangerous combinations (basic implementation)
  const medicineNames = medicines.map((med: any) => med.medicineName.toLowerCase());
  
  // Basic interaction warnings (in real app, this would use a proper drug database)
  const interactions = [
    {
      medicines: ['warfarin', 'aspirin'],
      warning: 'Increased bleeding risk - monitor patient closely'
    },
    {
      medicines: ['alcohol', 'paracetamol'], 
      warning: 'Potential liver damage risk'
    }
  ];

  for (const interaction of interactions) {
    const hasInteraction = interaction.medicines.every(med => 
      medicineNames.some(name => name.includes(med))
    );
    
    if (hasInteraction) {
      // In a real app, you might want to log this but not block the prescription
      console.warn(`Drug interaction warning: ${interaction.warning}`);
      // Could add to request for doctor to review
      req.body.interactionWarning = interaction.warning;
    }
  }
  
  next();
};