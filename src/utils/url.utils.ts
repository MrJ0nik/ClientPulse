/**
 * Validates if a string is a valid URL
 * @param urlStr - URL string to validate
 * @returns boolean indicating if URL is valid
 */
export const isValidUrl = (urlStr: string): boolean => {
  if (!urlStr || typeof urlStr !== 'string') return false;

  try {
    const urlToTest = normalizeUrl(urlStr);
    const url = new URL(urlToTest);
    return !!url.hostname && url.hostname.includes('.');
  } catch {
    return false;
  }
};

/**
 * Normalizes URL by adding https:// if protocol is missing
 * @param url - URL to normalize
 * @returns normalized URL string
 */
export const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
};

/**
 * Extracts domain name from URL
 * @param url - Full URL
 * @returns domain name without protocol
 */
export const extractDomain = (url: string): string => {
  try {
    const normalized = normalizeUrl(url);
    const urlObj = new URL(normalized);
    return urlObj.hostname;
  } catch {
    return url;
  }
};
