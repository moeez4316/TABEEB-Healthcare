import express from 'express';

const router = express.Router();

// Health check endpoint for Docker healthcheck
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
