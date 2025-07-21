// src/controllers/doctorController.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createDoctor = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const { name, email, phone, specialization, qualification, experience } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  try {
    const doctor = await prisma.doctor.create({
      data: {
        uid: uid as string,
        name,
        email,
        phone,
        specialization,
        qualification,
        experience,
      },
    });
    res.status(201).json(doctor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create doctor profile' });
  }
};

export const getDoctor = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  try {
    const doctor = await prisma.doctor.findUnique({ where: { uid } });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctor profile' });
  }
};

export const updateDoctor = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  try {
    const doctor = await prisma.doctor.update({
      where: { uid },
      data: req.body,
    });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update doctor profile' });
  }
};

export const deleteDoctor = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  try {
    await prisma.doctor.delete({ where: { uid } });
    await prisma.user.delete({ where: { uid } });
    res.json({ message: 'Doctor account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete doctor profile' });
  }
};
