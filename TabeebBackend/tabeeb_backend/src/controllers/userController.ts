import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getUser = async (req: Request, res: Response) => {
    const uid = req.user?.uid;
    try {
        if (!uid) {
            return res.status(400).json({ error: 'User UID is required' });
        }

        const user = await prisma.user.findUnique({where: { uid }});
        const normalizedRole = user?.role === 'doctor' || user?.role === 'patient' ? user.role : null;

        if (normalizedRole) {
            return res.json({ role: normalizedRole });
        }

        // Fallback: derive role from existing profiles (repairs missing/invalid user records)
        const [doctor, patient] = await Promise.all([
            prisma.doctor.findUnique({ where: { uid }, select: { uid: true } }),
            prisma.patient.findUnique({ where: { uid }, select: { uid: true } }),
        ]);

        const derivedRole = doctor ? 'doctor' : patient ? 'patient' : null;

        if (!derivedRole) {
            return res.status(404).json({ error: 'User does not exist' });
        }

        await prisma.user.upsert({
            where: { uid },
            create: { uid, role: derivedRole },
            update: { role: derivedRole }
        });

        res.json({ role: derivedRole });
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch user'})
    }
};
