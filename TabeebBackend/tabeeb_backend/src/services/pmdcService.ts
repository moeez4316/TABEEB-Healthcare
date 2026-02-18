// src/services/pmdcService.ts
// Service to look up doctor registration info from the PMDC (Pakistan Medical & Dental Council).
// Uses the official PMDC API at hospitals-inspections.pmdc.pk (same API used by pmdc.pk homepage search).
// Results are cached in the database to minimize repeated lookups.

import axios from 'axios';
import prisma from '../lib/prisma';

// ============================================================
// PMDC API Endpoints (discovered from pmdc.pk homepage JS)
// The search on pmdc.pk calls these endpoints via AJAX:
//   - Search:  POST https://hospitals-inspections.pmdc.pk/api/DRC/GetData
//   - Details: POST https://hospitals-inspections.pmdc.pk/api/DRC/GetQualifications
// ============================================================

const PMDC_SEARCH_URL = 'https://hospitals-inspections.pmdc.pk/api/DRC/GetData';
const PMDC_DETAILS_URL = 'https://hospitals-inspections.pmdc.pk/api/DRC/GetQualifications';

// Shape of a qualification entry returned by the PMDC API
interface PmdcQualification {
  Speciality: string;
  Degree: string;
  University: string;
  PassingYear: string;
  IsActive: boolean | null;
}

// Shape of a doctor record returned by the PMDC search API
interface PmdcSearchRecord {
  RegistrationNo: string;
  Name: string;
  FatherName: string;
  Gender: string | null;
  RegistrationType: string;
  RegistrationDate: string;
  ValidUpto: string;
  Status: string;
  IsFaculty: boolean;
  Qualifications: PmdcQualification[] | null;
}

// Our normalized output interface
export interface PmdcDoctorInfo {
  found: boolean;
  pmdcNumber: string;
  doctorName?: string;
  fatherName?: string;
  registrationType?: string;
  registrationDate?: string;
  validUpto?: string;
  registrationStatus?: string;
  qualification?: string;    // Combined "Degree Speciality" string
  institution?: string;      // University from first qualification
  qualifications?: PmdcQualification[];  // Full qualifications list
  rawData?: Record<string, unknown>;     // Full API response for reference
  source: string;
  fetchedAt: Date;
  errorMessage?: string;
  fromCache: boolean;
}

// Cache duration: 7 days (PMDC data rarely changes)
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// Common headers to mimic the pmdc.pk website's own AJAX requests
const API_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-US,en;q=0.9',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Origin': 'https://pmdc.pk',
  'Referer': 'https://pmdc.pk/',
};

/**
 * Look up a doctor's PMDC registration info.
 * First checks the cache, then queries the PMDC API.
 */
export async function lookupPmdcNumber(pmdcNumber: string): Promise<PmdcDoctorInfo> {
  const normalizedPmdc = pmdcNumber.trim();

  // 1. Check cache first
  const cached = await getCachedLookup(normalizedPmdc);
  if (cached) {
    return cached;
  }

  // 2. Query the PMDC API
  let result: PmdcDoctorInfo;
  try {
    result = await queryPmdcApi(normalizedPmdc);
  } catch (error) {
    console.error(`[PMDC Service] Error querying PMDC API for ${normalizedPmdc}:`, error);
    result = {
      found: false,
      pmdcNumber: normalizedPmdc,
      source: 'pmdc_api',
      fetchedAt: new Date(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error during PMDC lookup',
      fromCache: false,
    };
  }

  // 3. Cache the result (even failures, to avoid hammering the API)
  await cacheLookupResult(normalizedPmdc, result);

  return result;
}

/**
 * Force a fresh lookup, bypassing the cache.
 */
export async function refreshPmdcLookup(pmdcNumber: string): Promise<PmdcDoctorInfo> {
  const normalizedPmdc = pmdcNumber.trim();

  // Delete existing cache entry
  try {
    await prisma.pmdcLookupCache.delete({
      where: { pmdcNumber: normalizedPmdc },
    });
  } catch {
    // No cache entry exists, that's fine
  }

  return lookupPmdcNumber(normalizedPmdc);
}

/**
 * Query the PMDC API for doctor info.
 * Step 1: Search by registration number using /api/DRC/GetData
 * Step 2: Get full details + qualifications using /api/DRC/GetQualifications
 */
async function queryPmdcApi(pmdcNumber: string): Promise<PmdcDoctorInfo> {
  const baseResult: PmdcDoctorInfo = {
    found: false,
    pmdcNumber,
    source: 'pmdc_api',
    fetchedAt: new Date(),
    fromCache: false,
  };

  // Step 1: Search for the doctor
  console.log(`[PMDC Service] Searching PMDC API for: ${pmdcNumber}`);
  
  const searchBody = new URLSearchParams({
    RegistrationNo: pmdcNumber,
    Name: '',
    FatherName: '',
  }).toString();

  const searchResponse = await axios.post(PMDC_SEARCH_URL, searchBody, {
    headers: API_HEADERS,
    timeout: 15000,
  });

  const searchData = searchResponse.data;

  if (!searchData || searchData.status !== true || !searchData.data || searchData.data.length === 0) {
    baseResult.errorMessage = searchData?.message || 'No doctor found with this PMDC registration number.';
    return baseResult;
  }

  // Find exact match from results (API may return multiple results)
  const normalizedSearch = pmdcNumber.toUpperCase().replace(/\s/g, '');
  const matchingRecord: PmdcSearchRecord = searchData.data.find(
    (d: PmdcSearchRecord) => d.RegistrationNo.toUpperCase().replace(/\s/g, '') === normalizedSearch
  ) || searchData.data[0]; // fallback to first result

  console.log(`[PMDC Service] Found doctor: ${matchingRecord.Name} (${matchingRecord.RegistrationNo})`);

  // Step 2: Get full details with qualifications
  let qualifications: PmdcQualification[] = [];
  let detailRecord = matchingRecord;

  try {
    const detailBody = new URLSearchParams({
      RegistrationNo: matchingRecord.RegistrationNo,
    }).toString();

    const detailResponse = await axios.post(PMDC_DETAILS_URL, detailBody, {
      headers: API_HEADERS,
      timeout: 15000,
    });

    const detailData = detailResponse.data;

    if (detailData?.status === true && detailData.data) {
      detailRecord = detailData.data;
      qualifications = detailData.data.Qualifications || [];
      console.log(`[PMDC Service] Got ${qualifications.length} qualification(s) for ${matchingRecord.RegistrationNo}`);
    }
  } catch (error) {
    console.warn('[PMDC Service] Could not fetch qualifications, using search data:', 
      error instanceof Error ? error.message : 'Unknown error');
  }

  // Build the combined qualification string
  const qualStr = qualifications.length > 0
    ? qualifications.map(q => `${q.Degree}${q.Speciality ? ` (${q.Speciality})` : ''}`).join(', ')
    : undefined;

  // Build the institution string from first qualification
  const institution = qualifications.length > 0 ? qualifications[0].University : undefined;

  return {
    found: true,
    pmdcNumber: detailRecord.RegistrationNo,
    doctorName: detailRecord.Name,
    fatherName: detailRecord.FatherName,
    registrationType: detailRecord.RegistrationType,
    registrationDate: detailRecord.RegistrationDate,
    validUpto: detailRecord.ValidUpto,
    registrationStatus: detailRecord.Status,
    qualification: qualStr,
    institution,
    qualifications,
    rawData: detailRecord as unknown as Record<string, unknown>,
    source: 'pmdc_api',
    fetchedAt: new Date(),
    fromCache: false,
  };
}

// ============================================================
// Caching Layer
// ============================================================

async function getCachedLookup(pmdcNumber: string): Promise<PmdcDoctorInfo | null> {
  try {
    const cached = await prisma.pmdcLookupCache.findUnique({
      where: { pmdcNumber },
    });

    if (!cached) return null;

    // Check if cache is still valid
    if (new Date() > cached.expiresAt) {
      await prisma.pmdcLookupCache.delete({ where: { pmdcNumber } });
      return null;
    }

    // Reconstruct qualifications from rawData if possible
    const rawData = cached.rawData as Record<string, unknown> | null;
    const qualifications = rawData?.Qualifications as PmdcQualification[] | undefined;

    return {
      found: cached.found,
      pmdcNumber: cached.pmdcNumber,
      doctorName: cached.doctorName || undefined,
      fatherName: cached.fatherName || undefined,
      registrationType: (rawData?.RegistrationType as string) || undefined,
      registrationDate: cached.registrationDate || undefined,
      validUpto: (rawData?.ValidUpto as string) || undefined,
      qualification: cached.qualification || undefined,
      institution: cached.institution || undefined,
      qualifications: qualifications || undefined,
      registrationStatus: cached.registrationStatus || undefined,
      rawData: rawData || undefined,
      source: cached.source,
      fetchedAt: cached.fetchedAt,
      errorMessage: cached.errorMessage || undefined,
      fromCache: true,
    };
  } catch (error) {
    console.error('[PMDC Service] Cache lookup error:', error);
    return null;
  }
}

async function cacheLookupResult(pmdcNumber: string, result: PmdcDoctorInfo): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MS);

    await prisma.pmdcLookupCache.upsert({
      where: { pmdcNumber },
      create: {
        pmdcNumber,
        doctorName: result.doctorName || null,
        fatherName: result.fatherName || null,
        registrationDate: result.registrationDate || null,
        qualification: result.qualification || null,
        institution: result.institution || null,
        registrationStatus: result.registrationStatus || null,
        address: null,
        rawData: result.rawData ? JSON.parse(JSON.stringify(result.rawData)) : undefined,
        source: result.source,
        found: result.found,
        errorMessage: result.errorMessage || null,
        fetchedAt: result.fetchedAt,
        expiresAt,
      },
      update: {
        doctorName: result.doctorName || null,
        fatherName: result.fatherName || null,
        registrationDate: result.registrationDate || null,
        qualification: result.qualification || null,
        institution: result.institution || null,
        registrationStatus: result.registrationStatus || null,
        address: null,
        rawData: result.rawData ? JSON.parse(JSON.stringify(result.rawData)) : undefined,
        source: result.source,
        found: result.found,
        errorMessage: result.errorMessage || null,
        fetchedAt: result.fetchedAt,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('[PMDC Service] Cache write error:', error);
  }
}

/**
 * Clear all expired cache entries (maintenance task).
 */
export async function clearExpiredPmdcCache(): Promise<number> {
  const result = await prisma.pmdcLookupCache.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
