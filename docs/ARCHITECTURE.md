Authentication: Supabase SSR with Next.js Server Components. A dedicated src/middleware.ts intercepts all requests to inject fresh session cookies, preventing silent token expiration.

API Security (/api/save, /api/check-frame): Strict CORS allowlists (Set) reject unauthorized origin headers. Server-side fetch requests utilize AbortSignal.timeout(3000) and 512KB streaming caps to prevent OOM memory exhaustion, while explicitly blocking internal RFC 1918 IP scanning to prevent SSRF attacks.

Deduplication Engine:

Links: Fuzzy database matching using .ilike (ignores slashes, www, query fragments). YouTube links are sanitized to retain only the v= parameter.

Notes/Images: Exact string matching on the content body (not the URL) to permit saving multiple distinct fragments from the exact same parent webpage.

State & Realtime Sync: Powered by src/hooks/useBookmarks.ts. The Supabase client is strictly memoized (useMemo) to prevent React render cycles from tearing down and recreating WebSocket connections.