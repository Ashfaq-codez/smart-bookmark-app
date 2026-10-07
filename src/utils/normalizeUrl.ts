// src/utils/normalizeUrl.ts
// The one real implementation now lives in src/lib/urlTools.ts (shared with the save route),
// so the dashboard and the server always clean addresses the same way.
export { normalizeUrl } from '@/lib/urlTools';