// src/utils/normalizeUrl.ts
export function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    
    // Lowercase hostname, strip 'www.', strip trailing slash, and drop hash
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    const search = parsed.search;

    return `${parsed.protocol}//${hostname}${pathname}${search}`;
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, '');
  }
}