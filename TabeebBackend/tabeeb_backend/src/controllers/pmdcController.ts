// src/controllers/pmdcController.ts
// Controller for PMDC (Pakistan Medical & Dental Council) lookup endpoints.
// Used by admin to verify doctor registration before approving.

import { Request, Response } from 'express';
import { lookupPmdcNumber, refreshPmdcLookup, clearExpiredPmdcCache } from '../services/pmdcService';

/**
 * Look up a PMDC number and return the registration details from the PMDC website.
 * GET /api/pmdc/lookup/:pmdcNumber
 * Admin-only endpoint.
 */
export const pmdcLookup = async (req: Request, res: Response) => {
  try {
    const { pmdcNumber } = req.params;

    if (!pmdcNumber || pmdcNumber.trim().length === 0) {
      return res.status(400).json({ error: 'PMDC number is required' });
    }

    // Validate PMDC number format (digits-letters pattern like 100327-P)
    const pmdcClean = pmdcNumber.trim();
    if (pmdcClean.length < 2 || pmdcClean.length > 50) {
      return res.status(400).json({ error: 'Invalid PMDC number format' });
    }

    console.log(`[PMDC Controller] Looking up PMDC number: ${pmdcClean}`);
    const result = await lookupPmdcNumber(pmdcClean);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[PMDC Controller] Lookup error:', error);
    return res.status(500).json({
      error: 'Failed to look up PMDC number',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Force a fresh lookup, bypassing the cache.
 * POST /api/pmdc/refresh/:pmdcNumber
 * Admin-only endpoint.
 */
export const pmdcRefresh = async (req: Request, res: Response) => {
  try {
    const { pmdcNumber } = req.params;

    if (!pmdcNumber || pmdcNumber.trim().length === 0) {
      return res.status(400).json({ error: 'PMDC number is required' });
    }

    console.log(`[PMDC Controller] Force refreshing PMDC number: ${pmdcNumber.trim()}`);
    const result = await refreshPmdcLookup(pmdcNumber.trim());

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[PMDC Controller] Refresh error:', error);
    return res.status(500).json({
      error: 'Failed to refresh PMDC lookup',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Clear expired cache entries.
 * DELETE /api/pmdc/cache/expired
 * Admin-only endpoint.
 */
export const pmdcClearExpiredCache = async (_req: Request, res: Response) => {
  try {
    const count = await clearExpiredPmdcCache();
    return res.json({
      success: true,
      message: `Cleared ${count} expired cache entries`,
      deletedCount: count,
    });
  } catch (error) {
    console.error('[PMDC Controller] Cache clear error:', error);
    return res.status(500).json({
      error: 'Failed to clear expired cache',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
