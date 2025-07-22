// src/controllers/patientController.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createPatient = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const { name, email, phone, dob, gender, medicalHistory } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }


  try {
    // Create User and Patient record
    await prisma.user.create({
      data: { uid, role: 'patient' }
    });

    const patient = await prisma.patient.create({
      data: {
        uid,
        name,
        email,
        phone,
        gender,
        medicalHistory,
        dob
      },
    });

    res.status(201).json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create patient profile' });
  }
};

export const getPatient = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  try {
    const patient = await prisma.patient.findUnique({ where: { uid } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient profile' });
  }
};

export const updatePatient = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const updateData = { ...req.body };

  // If dob exists in update, ensure it's a Date object
  if (updateData.dob) {
    updateData.dob = new Date(updateData.dob);
  }

  try {
    const patient = await prisma.patient.update({
      where: { uid },
      data: updateData,
    });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update patient profile' });
  }
};

export const deletePatient = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  try {
    await prisma.patient.delete({ where: { uid } });
    await prisma.user.delete({ where: { uid } });
    res.json({ message: 'Patient account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient profile' });
  }
};
