import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getUser = async (req: Request, res: Response) => {
    const uid = req.user?.uid;
    try {
        const user = await prisma.user.findUnique({where: { uid }});
        if (!user) return res.status(404).json({error: 'User does not exist'});
        res.json({ role: user.role });
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch user'})
    }
};