const pickFirstNonEmpty = (...values: Array<string | undefined | null>): string => {
  for (const value of values) {
    if (value && value.trim()) return value;
  }
  return '';
};

export const ensureAbsoluteUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const normalizeBaseUrl = (value: string): string =>
  ensureAbsoluteUrl(value).replace(/\/+$/, '');

export const isLocalhostUrl = (value: string): boolean => {
  const lowered = value.toLowerCase();
  return (
    lowered.includes('localhost') ||
    lowered.includes('127.0.0.1') ||
    lowered.includes('0.0.0.0')
  );
};

const shouldAvoidLocalhost = (): boolean => process.env.NODE_ENV === 'production';

export const resolvePublicWebBaseUrl = (): string => {
  const explicitBase = pickFirstNonEmpty(
    process.env.FRONTEND_URL,
    process.env.PUBLIC_APP_URL,
    process.env.APP_BASE_URL,
    process.env.NEXT_PUBLIC_FRONTEND_URL
  );

  if (explicitBase) {
    const normalized = normalizeBaseUrl(explicitBase);
    if (!shouldAvoidLocalhost() || !isLocalhostUrl(normalized)) {
      return normalized;
    }
  }

  const apiUrl = pickFirstNonEmpty(
    process.env.NEXT_PUBLIC_API_URL,
    process.env.PUBLIC_API_URL,
    process.env.API_BASE_URL,
    process.env.BACKEND_URL
  );

  if (apiUrl) {
    const derived = normalizeBaseUrl(apiUrl).replace(/\/api$/, '');
    if (!shouldAvoidLocalhost() || !isLocalhostUrl(derived)) {
      return derived;
    }
  }

  const siteAddress = pickFirstNonEmpty(process.env.SITE_ADDRESS);
  if (siteAddress) {
    const normalized = normalizeBaseUrl(siteAddress);
    if (!shouldAvoidLocalhost() || !isLocalhostUrl(normalized)) {
      return normalized;
    }
  }

  return 'https://tabeeb.dpdns.org';
};

export const resolvePublicApiBaseUrl = (): string => {
  const explicitApi = pickFirstNonEmpty(
    process.env.PUBLIC_API_URL,
    process.env.API_BASE_URL,
    process.env.BACKEND_URL,
    process.env.NEXT_PUBLIC_API_URL
  );

  if (explicitApi) {
    const normalized = normalizeBaseUrl(explicitApi).replace(/\/api$/, '');
    if (!shouldAvoidLocalhost() || !isLocalhostUrl(normalized)) {
      return normalized;
    }
  }

  const webBase = resolvePublicWebBaseUrl();
  const normalizedWebBase = normalizeBaseUrl(webBase).replace(/\/api$/, '');
  return normalizedWebBase || 'https://tabeeb.dpdns.org';
};
