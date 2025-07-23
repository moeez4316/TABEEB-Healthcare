import express from 'express';
import { getUser } from '../controllers/userController';
import { verifyToken } from '../middleware/verifyToken';

const router = express.Router();

router.get('/', verifyToken, getUser);

export default router;