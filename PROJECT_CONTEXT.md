# PROJECT CONTEXT: inntoit (Smart Bookmark App)

This document provides a factual, complete technical reference for the codebase at `/home/ashfaq/repos/smart-bookmark-app`. It is intended to allow an AI assistant or developer to work on the codebase with full understanding without needing direct repository access.

---

## 1. OVERVIEW

`inntoit` (internally titled `smart-bookmark-app`) is a full-stack, visual bookmark manager, archive, and note-taking vault. Rather than saving only plain URLs or titles, it captures and renders rich visual representations of saved media—including web links, formatted rich-text notes, images, videos, PDFs, and platform-specific embeds for X (Twitter), Instagram, YouTube, Pinterest, TikTok, GitHub, LinkedIn, and Google Search results. The application provides instant multi-device synchronization via Supabase Realtime, drag-and-drop categorization into hierarchical folders, full-text client-side search, a command palette, an integrated TipTap rich-text editor with slash commands, and a companion Chrome extension and PWA share target for 1-click clipping.

- **Production URL**: `https://smart-bookmark-app-lime.vercel.app` (referenced in `/src/app/api/save/route.ts`, `smart-bookmarks-ext/background.js`, `smart-bookmarks-ext/popup.js`, and `smart-bookmarks-ext/manifest.json`). The onboarding note also references `https://inntoit.app/welcome`.
- **Hosting**: Deployed on **Vercel** (`next.config.ts` configures `outputFileTracingRoot`, and `src/app/auth/callback/route.ts` detects Vercel's `x-forwarded-host` header for production OAuth redirection).
- **Database & Backend**: **Supabase** (PostgreSQL) handles relational data storage, Row Level Security (RLS) data isolation, Google OAuth session cookies via `@supabase/ssr`, real-time replication channels via PostgreSQL Changes, and file storage for uploaded media via Supabase Storage bucket `attachments`.

---

## 2. TECH STACK

- **Core Framework**: Next.js `15.5.20` using the **App Router** (`src/app/`) with Server Components, Client Components (`"use client"`), and Route Handlers (`src/app/api/` and `src/app/auth/`).
- **UI Library**: React `19.0.0` and React-DOM `19.0.0`.
- **Language**: TypeScript `5` (`tsconfig.json` target `ES2017`, `bundler` module resolution, strict mode enabled, `@/*` alias mapped to `./src/*`).
- **Styling**: Tailwind CSS v4 (`tailwindcss: ^4`, `@tailwindcss/postcss: ^4`, `@tailwindcss/typography: ^0.5.20`).
  - *Tailwind Configuration Highlights*: There is **no** `tailwind.config.js` or `tailwind.config.ts` file in the project. Tailwind CSS v4 CSS-first configuration is used via `postcss.config.mjs` (`@tailwindcss/postcss`) and configured directly in `src/app/globals.css` with `@import "tailwindcss";`, `@plugin "@tailwindcss/typography";`, `@custom-variant dark (&:is(.dark *));`, and inline `@theme` variables (`--color-background`, `--color-foreground`, `--font-sans`, `--font-mono`).
- **Rich-Text Editor**: TipTap v3 (`^3.31.3`):
  - `@tiptap/react`: `^3.31.3`
  - `@tiptap/starter-kit`: `^3.31.3`
  - `@tiptap/extension-placeholder`: `^3.31.3`
  - `@tiptap/extension-table`: `^3.31.3`
  - `@tiptap/extension-table-row`: `^3.31.3`
  - `@tiptap/extension-table-header`: `^3.31.3`
  - `@tiptap/extension-table-cell`: `^3.31.3`
  - `@tiptap/extension-task-list`: `^3.31.3`
  - `@tiptap/extension-task-item`: `^3.31.3`
- **Database & Auth (Supabase)**:
  - `@supabase/ssr`: `^0.8.0` (server and client cookie-based authentication)
  - `@supabase/supabase-js`: `^2.95.3` (client library and service role admin client)
- **HTML Scraping**: `cheerio`: `^1.2.0` (used in `/api/save` to extract OpenGraph titles, descriptions, and images).
- **Notifications**: `react-hot-toast`: `^2.4.1` (toast feedback with custom neo-brutalist styling).
- **Package Dependency Overrides** (in `package.json`):
  - `postcss`: `^8.5.10`
  - `serialize-javascript`: `^6.0.2`
  - `terser`: `^5.14.2`
  - `prosemirror-view`: `1.37.2` (locked to resolve React 19 / TipTap ProseMirror compatibility)
- **Dev Dependencies**:
  - `@types/cheerio`: `^0.22.35`
  - `@types/node`: `^20`
  - `@types/react`: `^19`
  - `@types/react-dom`: `^19`
  - `eslint`: `^9`
  - `eslint-config-next`: `^15.5.20`
- **NPM Scripts**:
  - `dev`: `next dev`
  - `build`: `next build`
  - `start`: `next start`
  - `lint`: `eslint`

---

## 3. FOLDER STRUCTURE

```
smart-bookmark-app/
├── docs/
│   └── ARCHITECTURE.md                  # High-level architecture notes (SSRF, CORS, Realtime, Deduplication)
├── public/
│   ├── backgrounds/
│   │   ├── 3.gif                        # Background graphic asset
│   │   └── background.jpg               # Background graphic asset
│   ├── dashboard-preview.png            # Static marketing preview
│   ├── editorial-preview.png            # Static marketing preview
│   ├── file.svg                         # File icon SVG
│   ├── globe.svg                        # Globe icon SVG
│   ├── inntoit.png                      # App logo image
│   ├── intoit.png                       # PWA maskable icon asset
│   ├── manifest.json                    # Web app manifest for PWA & Web Share Target
│   ├── next.svg                         # Next.js logo
│   ├── sw.js                            # PWA Service Worker (install, claim, pass-through fetch)
│   ├── vercel.svg                       # Vercel logo
│   └── window.svg                       # Window icon SVG
├── smart-bookmarks-ext/                 # Chrome Browser Extension (Manifest V3)
│   ├── background.js                    # Service worker: context menu registration, tab messaging, POST to /api/save
│   ├── content.js                       # Content script: DOM inspection, selection to semantic HTML converter, URL cleaner
│   ├── icon.png                         # Extension icon (128x128)
│   ├── manifest.json                    # Manifest V3 configuration, permissions, host permissions
│   ├── popup.html                       # Extension action popup markup
│   ├── popup.js                         # Extension action popup script: captures active tab & saves note
│   └── styles.css                       # Extension ::target-text styling
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── check-frame/
│   │   │   │   └── route.ts             # GET: Checks if a target URL allows iframe embedding (SSRF-safe)
│   │   │   └── save/
│   │   │       └── route.ts             # POST & OPTIONS: Saves bookmark/note, auth via cookies or API key, scraping, deduplication
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   │   └── route.ts             # GET: Exchanges OAuth code for session cookie, creates welcome note
│   │   │   └── signout/
│   │   │       └── route.ts             # POST: Destroys Supabase session on server and redirects to /
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # Authenticated SSR dashboard page, fetches user bookmarks
│   │   ├── login/
│   │   │   └── page.tsx                 # Client page for Google OAuth sign-in
│   │   ├── share/
│   │   │   └── page.tsx                 # PWA Web Share Target handler, POSTs shared data to /api/save
│   │   ├── favicon.ico                  # Site favicon
│   │   ├── favicon.png                  # Site favicon PNG
│   │   ├── globals.css                  # Global styles, Tailwind v4 theme, TipTap overrides
│   │   ├── layout.tsx                   # Root HTML layout, Geist fonts, Toaster, ThemeProvider, SW registration
│   │   └── page.tsx                     # Public landing page with 3D scroll canvas and product showcase
│   ├── components/
│   │   ├── BookmarkCard.tsx             # Interactive masonry card for individual bookmarks with specialized media renders
│   │   ├── BookmarkForms.tsx            # (Unused/Legacy) Form component for single/bulk bookmark creation
│   │   ├── BookmarkIcons.tsx            # SVG icon primitives (social platforms, media, actions)
│   │   ├── BookmarkList.tsx             # Main dashboard UI: masonry grid, composer, command palette, filters, search
│   │   ├── BookmarkSkeleton.tsx         # Skeleton loader for masonry grid cards
│   │   ├── EditorialModal.tsx           # Full-screen editorial inspector: preview, TipTap editor, metadata editing, autosave
│   │   ├── ProfileDropdown.tsx          # User profile avatar, sign out, iOS shortcut API key generator
│   │   ├── Sidebar.tsx                  # Collapsible sidebar: views, folder hierarchy, subfolders, drag-and-drop targets
│   │   └── TipTapEditor.tsx             # Custom TipTap rich-text editor with slash command menu and table controls
│   ├── context/
│   │   └── ThemeContext.tsx             # React Context for dark mode and background theme state
│   ├── hooks/
│   │   └── useBookmarks.ts              # Custom hook: Supabase Realtime channel, focus revalidation, delete, update
│   ├── types/
│   │   └── index.ts                     # TypeScript interface definitions (Bookmark)
│   ├── utils/
│   │   ├── supabase/
│   │   │   ├── client.ts                # Browser Supabase client factory via @supabase/ssr createBrowserClient
│   │   │   └── server.ts                # Server Supabase client factory via @supabase/ssr createServerClient
│   │   ├── bookmarkHelpers.tsx          # Media detection, URL extraction, tweet/insta formatters, platform metadata
│   │   ├── normalizeUrl.ts              # Canonical URL normalization (strips www, trailing slashes, fragments)
│   │   └── safeFetch.ts                 # SSRF-protected fetcher blocking private/internal IPs with DNS pre-resolution
│   └── middleware.ts                    # Next.js middleware refreshing Supabase auth session cookies
├── .env.local                           # Local environment variables (not committed)
├── eslint.config.mjs                    # ESLint 9 configuration with FlatCompat for next/core-web-vitals
├── next.config.ts                       # Next.js configuration (outputFileTracingRoot)
├── package.json                         # Project dependencies, scripts, and overrides
├── postcss.config.mjs                   # PostCSS configuration enabling @tailwindcss/postcss
├── README.md                            # High-level repo summary and local setup guide
└── tsconfig.json                        # TypeScript compiler options and path mappings
```

---

## 4. ROUTES AND PAGES

### Pages

| Path | File | Methods / Type | Purpose | Auth Required |
|---|---|---|---|---|
| `/` | `src/app/page.tsx` | Client Component | Public landing page ("inntoit") with interactive 3D spatial card animations, video/insta/pin mockups, feature breakdowns, and pricing tier cards. | No |
| `/login` | `src/app/login/page.tsx` | Client Component | Google OAuth sign-in page. Checks if user is already authenticated and redirects to `/dashboard`. Triggers `supabase.auth.signInWithOAuth({ provider: 'google' })`. | No |
| `/dashboard` | `src/app/dashboard/page.tsx` | Server Component | Main application view. Retrieves user via `supabase.auth.getUser()`, redirects unauthenticated users to `/login`. Fetches bookmarks via `supabase.from('bookmarks').select('*').order('created_at', { ascending: false })` and passes them to `<BookmarkList />`. | Yes (Server redirect to `/login`) |
| `/share` | `src/app/share/page.tsx` | Client Component | PWA Web Share Target endpoint. Catches incoming shares (`url`, `text`, `title` query params) from mobile OS share sheets, POSTs payload to `/api/save`, and navigates to `/dashboard`. | Yes (Session cookie required by `/api/save`) |

### API Routes & Auth Handlers

| Path | File | Methods | Purpose | Auth Mechanism |
|---|---|---|---|---|
| `/auth/callback` | `src/app/auth/callback/route.ts` | `GET` | Exchanges OAuth temporary code for session cookie via `supabase.auth.exchangeCodeForSession(code)`. If first login (`count === 0`), inserts a default onboarding welcome note into `bookmarks`. Redirects to `/dashboard` (or `next` query param). | Public callback (exchanges OAuth code) |
| `/auth/signout` | `src/app/auth/signout/route.ts` | `POST` | Destroys Supabase session on the server via `supabase.auth.signOut()` and returns a `303 See Other` redirect to `/`. | Session cookie |
| `/api/save` | `src/app/api/save/route.ts` | `POST`, `OPTIONS` | Core ingestion endpoint for saving links, notes, images, videos, and social embeds. Performs deduplication, URL normalization, metadata scraping (Cheerio / VxTwitter), and database insertion. | **Dual Auth**: Supabase SSR Session Cookie OR API Token via `x-api-key` / `x-shortcut-token` header (hashed with SHA-256 and verified in `api_keys` table using `SUPABASE_SERVICE_ROLE_KEY`). |
| `/api/check-frame` | `src/app/api/check-frame/route.ts` | `GET` | Validates whether an external URL can be rendered inside an `<iframe>` by issuing a `HEAD` request (with SSRF validation) and checking `x-frame-options` and `content-security-policy: frame-ancestors`. Returns `{ allowIframe: boolean }`. | Session cookie (`supabase.auth.getUser()`, returns 401 if unauthenticated). |

### Middleware & Auth Architecture

- **`src/middleware.ts`**:
  - Intercepts all incoming requests except Next.js internals and static files (`/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`).
  - Instantiates `@supabase/ssr` `createServerClient` reading `request.cookies.getAll()` and writing cookies to both `request` and `response` via `cookiesToSet`.
  - Executes `await supabase.auth.getUser()`. This refreshes expired access tokens in the background and sets fresh session cookies on the HTTP response.
  - Does *not* redirect unauthenticated requests in middleware; route protection is handled explicitly in page Server Components (e.g., `/dashboard/page.tsx`) and API routes.
- **CORS Handling**:
  - In `src/app/api/save/route.ts`, an `ALLOWED_ORIGINS` `Set` restricts cross-origin requests to:
    1. `https://smart-bookmark-app-lime.vercel.app`
    2. `http://localhost:3000`
    3. `chrome-extension://${process.env.CHROME_EXTENSION_ID || 'YOUR_EXTENSION_ID_HERE'}`
  - Preflight `OPTIONS` requests respond with status `204` and headers: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods: POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key, x-shortcut-token`, and `Access-Control-Allow-Credentials: true`.
- **Extension & PWA Authentication**:
  - The Chrome extension (`smart-bookmarks-ext/background.js` and `popup.js`) sends `fetch(API_URL, { credentials: 'include' })` matching the `host_permissions` in `manifest.json`. This forwards the user's active Supabase session cookies from the browser to the API.

---

## 5. DATA MODEL

*(Note: There are no SQL migration files or generated Supabase type files in the repository. The schema below is **factually inferred** from database queries across `src/hooks/useBookmarks.ts`, `src/app/api/save/route.ts`, `src/app/dashboard/page.tsx`, `src/components/ProfileDropdown.tsx`, `src/components/BookmarkList.tsx`, and `src/types/index.ts`.)*

### Table: `bookmarks` (Inferred)

| Column | Inferred PostgreSQL Type | TypeScript Type | Nullable | Defaults / Constraints | Inferred Purpose |
|---|---|---|---|---|---|
| `id` | `bigint` / `integer` | `number` | No | Primary Key, Auto-incrementing / Identity | Unique bookmark identifier |
| `user_id` | `uuid` | `string` | No | Foreign Key -> `auth.users(id)` | Identifies owner of bookmark; filtered by RLS |
| `url` | `text` | `string` | No | Unique constraint with `user_id` (triggers error code `23505`) | Target web address or internal synthetic URL (`https://smart-bookmark.internal/note-...`) |
| `title` | `text` | `string` | No | None | Display title of the save |
| `description` | `text` | `string` | Yes | `null` | Scraped meta description or tweet text |
| `content` | `text` | `string` | Yes | `null` | Rich-text HTML content for notes or personal comments |
| `image_url` | `text` | `string` | Yes | `null` | Scraped OpenGraph image, video thumbnail, or tweet media |
| `category` | `text` | `string` | No | Defaults to `'Inbox'` or `'Uncategorized'` | Main folder name |
| `sub_category` | `text` | `string` | Yes | `null` | Optional nested subfolder name |
| `tags` | `text[]` | `string[]` | Yes | e.g. `['onboarding']` or `['auto-saved', detectedType]` | Categorization tags |
| `type` | `text` | `string` | Yes | Defaults to `'link'`. Values: `'link'`, `'note'`, `'image'`, `'video'`, `'pdf'`, `'file'`, `'twitter'`, `'instagram'`, `'youtube'`, `'pinterest'`, `'github'`, `'linkedin'`, `'google'`, `'tiktok'` | Determines rendering card style and playback controls |
| `file_path` | `text` | `string` | Yes | `null` | File path in the `attachments` Supabase storage bucket |
| `file_type` | `text` | `string` | Yes | `null` | MIME type (e.g., `'application/pdf'`, `'image/png'`) |
| `created_at` | `timestamptz` | `string` | No | Defaults to `now()` | Creation timestamp |

- **Inferred Indexes & Constraints on `bookmarks`**:
  - Unique constraint on URL per user (the code in `useBookmarks.ts` and `api/save/route.ts` explicitly handles PostgreSQL error code `23505`).
  - Index on `user_id` and `created_at` (all queries filter by `user_id` and order by `created_at DESC`).
- **Inferred Row Level Security (RLS)**:
  - Users can only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` rows where `bookmarks.user_id = auth.uid()`.
  - Supabase Realtime publication is enabled for table `bookmarks` listening to changes matching `user_id=eq.${user.id}`.

### Table: `api_keys` (Inferred)

| Column | Inferred PostgreSQL Type | TypeScript Type | Nullable | Defaults / Constraints | Inferred Purpose |
|---|---|---|---|---|---|
| `id` | `bigint` / `uuid` | `number` / `string` | No | Primary Key | Key record ID |
| `user_id` | `uuid` | `string` | No | Foreign Key -> `auth.users(id)` | Owner of the API key |
| `token` | `text` | `string` | No | Unique index | Stores 64-character hex-encoded SHA-256 hash of the generated API token |
| `created_at` | `timestamptz` | `string` | Yes | Defaults to `now()` | Key creation timestamp |

- **Inferred Behavior on `api_keys`**:
  - `ProfileDropdown.tsx` generates an unhashed token `crypto.randomUUID().replace(/-/g, '')`, hashes it client-side with `window.crypto.subtle.digest('SHA-256')`, deletes any prior key for `user_id`, and inserts the hashed token.
  - `/api/save/route.ts` reads the incoming `x-api-key` or `x-shortcut-token` header, hashes it with Node `crypto.createHash('sha256')`, and uses `createAdminClient` with `SUPABASE_SERVICE_ROLE_KEY` to lookup `.eq('token', hashedApiKey).single()`.

### Storage Buckets

- **`attachments`**:
  - Publicly accessible bucket used for binary file uploads (images, videos, PDFs) from the composer bar via `supabase.storage.from('attachments').upload(fileName, file)`.
  - File naming pattern: `${user.id}/${Date.now()}-${randomString}.${fileExt}`.
  - Deletions: When a bookmark with a `file_path` is deleted in `BookmarkCard.tsx`, it calls `supabase.storage.from('attachments').remove([bookmark.file_path])`.

---

## 6. KEY TYPES

From `src/types/index.ts`:

```typescript
export type Bookmark = {
  id: number;
  title: string;
  url: string;
  category: string;
  sub_category?: string | null;
  created_at: string;
  user_id: string;
  description?: string | null;
  content?: string | null; 
  image_url?: string | null;
  tags?: string[];
  // Expanded types to support native social media cards
  type?: 'link' | 'note' | 'image' | 'video' | 'pdf' | 'file' | 'twitter' | 'instagram' | 'youtube' | 'pinterest' | 'github' | 'linkedin' | string;
  file_path?: string | null; 
  file_type?: string | null;
};
```

Other shared types defined in components/contexts:

From `src/context/ThemeContext.tsx`:
```typescript
type ThemeState = { url: string; hex: string };

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  bgTheme: ThemeState;
  setBgTheme: (theme: ThemeState) => void;
};
```

From `src/components/BookmarkList.tsx`:
```typescript
type Command = { id: string; group: string; label: string; hint?: string; run: () => void };
type FilterChip = { l: string; x: () => void };
```

---

## 7. COMPONENTS AND HOOKS

### `BookmarkList` (`src/components/BookmarkList.tsx`)
- **What it does**: The central client-side orchestrator for the dashboard. Renders the top navigation bar, command palette modal (`Cmd+K`), search input (`/`), quick capture composer with TipTap (`N`), media filter chips, date grouping, view layout controls, masonry grid with responsive columns (2 locked on mobile, auto/5/6/9 on desktop), file upload listener, and duplicate warning modal.
- **Props**:
  - `initialBookmarks: Bookmark[]`
  - `userEmail?: string`
- **Used by**: `src/app/dashboard/page.tsx`.
- **Uses**: `useBookmarks`, `Sidebar`, `BookmarkCard`, `BookmarkSkeleton`, `TipTapEditor`, `deriveDisplayType`, `createClient`.

### `BookmarkCard` (`src/components/BookmarkCard.tsx`)
- **What it does**: Renders an individual bookmark inside the masonry column. Supports specialized card presentation for each media type (`note`, `twitter`, `instagram`, `tiktok`, `youtube`, `google`, `pinterest`, `video`, `pdf`, `image`, standard `link`). Implements a 4-tier image fallback cascade (Step 0: DB image/YouTube thumb -> Step 1: `image.thum.io` screenshot -> Step 2: `api.microlink.io` -> Step 3: `s.wordpress.com/mshots` -> Step 4: domain initial favicon placeholder). Synchronizes card modal state with browser URL search params (`?b=<id>`) and handles browser back/forward history.
- **Props**:
  - `bookmark: Bookmark`
  - `theme: { card: string; btn: string; hover: string }`
  - `isDragged: boolean`
  - `onDragStart: (e: React.DragEvent, id: number) => void`
  - `onDragEnd: () => void`
  - `updateBookmark: (id: number, updates: Partial<Bookmark>) => Promise<void>`
  - `deleteBookmark: (id: number) => Promise<void>`
  - `forceOpenModal?: boolean`
  - `onCloseForcedModal?: () => void`
  - `folderHierarchy?: Record<string, string[]>`
  - `isMinimalist?: boolean`
- **Used by**: `src/components/BookmarkList.tsx`.
- **Uses**: `EditorialModal`, `BookmarkIcons`, `bookmarkHelpers`, `createPortal`, Supabase client.

### `EditorialModal` (`src/components/EditorialModal.tsx`)
- **What it does**: Full-screen modal inspector for reviewing and editing a bookmark. Two-column split layout: Left side provides interactive live preview or full TipTap editor for notes (with scoped paragraph styling), embedded YouTube iframe, interactive Instagram mockup with like heart animation, Pinterest pin card, Twitter embed, or fallback image cycler (`onCyclePreview`). Right side allows editing Title, URL, Main Folder (with autocomplete dropdown), Subfolder (with autocomplete dropdown), Personal Notes / Caption textarea, creation timestamp display, and a deletion dialog with keyboard trap (`Enter` to confirm, `Escape` to cancel). Automatically saves changes on field blur or modal exit.
- **Props**:
  - `bookmark: Bookmark`
  - `isVisible: boolean`
  - `displayType: string`
  - `previewImageUrl?: string`
  - `folderHierarchy?: Record<string, string[]>`
  - `onClose: () => void`
  - `onSave: (id: number, updates: Partial<Bookmark>) => Promise<void>`
  - `onDelete: (id: number) => Promise<void>`
  - `onFullscreenImage: (url: string) => void`
  - `getDomain: (url: string) => string`
  - `onCyclePreview?: () => void`
- **Used by**: `src/components/BookmarkCard.tsx`.
- **Uses**: `TipTapEditor`, `BookmarkIcons`, `bookmarkHelpers`, `createPortal`.

### `Sidebar` (`src/components/Sidebar.tsx`)
- **What it does**: Collapsible lateral navigation panel. In collapsed mode (72px on desktop), shows compact media filter icons, dark mode switch, and profile button. In expanded mode (280px or mobile drawer), lists media type filters (`Links`, `Notes`, `Images`, `Videos`, `Documents`, `Socials`), folder tree with counts, expandable subfolders, inline folder creation, and drag-and-drop drop targets for moving bookmarks into categories.
- **Props**: `SidebarProps` interface containing `isCollapsed`, `userEmail`, `handleSignOut`, `isMobileMenuOpen`, `setIsMobileMenuOpen`, `activeFilter`, `setActiveFilter`, `activeSubFilter`, `setActiveSubFilter`, `activeMediaType`, `setActiveMediaType`, `getCounts`, `folderHierarchy`, `expandedFolders`, `toggleFolderExpand`, `customCategories`, `handleDeleteCategory`, `handleDragOver`, `handleDrop`, and category creation callbacks.
- **Used by**: `src/components/BookmarkList.tsx`.
- **Uses**: `ProfileDropdown`, `ThemeContext`.

### `TipTapEditor` (`src/components/TipTapEditor.tsx`)
- **What it does**: Rich-text ProseMirror/TipTap editor wrapper. Supports headings (H1, H2), bullet lists, task lists (with custom circular checkboxes), blockquotes, code blocks, horizontal rules, and resizable tables. Implements a floating portal Slash Command menu triggered by typing `/` in focus mode, with keyboard navigation (`Up`, `Down`, `Enter`, `Escape`), rotating dynamic placeholder text, and a floating "Remove Table" action button when inside a table.
- **Props**:
  - `value: string`
  - `onChange: (val: string) => void`
  - `onFocus?: () => void`
  - `onBlur?: () => void`
  - `isExpanded?: boolean`
- **Used by**: `src/components/BookmarkList.tsx` (quick capture composer), `src/components/EditorialModal.tsx` (note editing).

### `BookmarkSkeleton` (`src/components/BookmarkSkeleton.tsx`)
- **What it does**: Renders animated pulse skeleton cards while the layout initializes columns and calculates container dimensions.
- **Props**: None.
- **Used by**: `src/components/BookmarkList.tsx`.

### `ProfileDropdown` (`src/components/ProfileDropdown.tsx`)
- **What it does**: Displays user avatar circle with user's initial. Opens a popover menu showing the user's email, an "Integrations" section with a "New iOS Shortcut Key" button that generates a fresh random token, hashes it with SHA-256 via Web Crypto API, saves it to `api_keys`, and allows copying the plaintext token, and a "Sign Out" button.
- **Props**:
  - `email: string`
  - `isCollapsed?: boolean`
- **Used by**: `src/components/Sidebar.tsx`.

### `BookmarkForms` (`src/components/BookmarkForms.tsx`)
- **What it does**: Legacy form component supporting single URL entry and bulk URL textarea extraction.
- **Status**: **Unused in the active application** (replaced by the universal composer in `BookmarkList.tsx`).

### `BookmarkIcons` (`src/components/BookmarkIcons.tsx`)
- **What it does**: Exported SVG icon components (`TrashIcon`, `ExternalLinkIcon`, `CloseIcon`, `PlayCircleIcon`, `InfoIcon`, `SearchIcon`, `XIcon`, `InstagramIcon`, `YouTubeIcon`, `TikTokIcon`, `PinterestIcon`, `InstaHeartIcon`, `InstaCommentIcon`, `InstaShareIcon`, `InstaSaveIcon`, `InstaDotsIcon`).
- **Used by**: `src/app/page.tsx`, `BookmarkCard.tsx`, `EditorialModal.tsx`.

### `useBookmarks` (`src/hooks/useBookmarks.ts`)
- **What it does**: Core client-side state hook managing the `bookmarks` array.
  - Subscribes to a Supabase Realtime channel (`realtime_bookmarks_${user.id}`) on `public:bookmarks` filtered by `user_id=eq.${user.id}`. Handles `INSERT` (with client-side ID and URL deduplication), `DELETE`, and `UPDATE` events.
  - Attaches `focus` and `visibilitychange` window event listeners to silently re-fetch fresh bookmarks when the user returns to a background tab.
  - Exposes `deleteBookmark(id: number)` and `updateBookmark(id: number, updates: Partial<Bookmark>)` with toast notifications and unique constraint error handling (`23505`).
- **Used by**: `src/components/BookmarkList.tsx`.

### `ThemeContext` (`src/context/ThemeContext.tsx`)
- **What it does**: Provides `ThemeProvider` and `useTheme()` hook. Manages dark mode boolean and custom background theme (`url` and `hex`). Synchronizes the `.dark` class on `document.documentElement` and stores preferences in `localStorage` keys `'theme'`, `'bgUrl'`, and `'bgHex'`.
- **Used by**: `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/Sidebar.tsx`.

### `bookmarkHelpers` (`src/utils/bookmarkHelpers.tsx`)
- **What it does**: Utility collection for media analysis and parsing:
  - `deriveDisplayType(b: Bookmark)`: Categorizes a bookmark as `'twitter'`, `'instagram'`, `'youtube'`, `'tiktok'`, `'pinterest'`, `'github'`, `'google'`, `'pdf'`, `'image'`, `'video'`, `'note'`, or fallback `'link'`.
  - `isVideoMedia(url)`: Inspects file extension to distinguish videos from image formats.
  - `isGoogleSearchUrl(url)` & `getGoogleQuery(url)`: Parses Google query parameter `q`.
  - `getYouTubeId(url)`: Extracts 11-character video ID from YouTube watch URLs, short URLs, and shorts.
  - `getTwitterAuthor(url)`: Extracts handle from Twitter/X URLs.
  - `formatDate(dateString)` & `formatDateTime(dateString)`: Formats dates for UI.
  - `getInstaMeta(b)`: Extracts username, likes count, and caption from scraped Instagram title/description strings.
  - `renderInstagramText(text)`: Converts `#hashtags` and `@mentions` into clickable links.
  - `renderTwitterText(text, isExpanded)`: Parses quoted tweet URLs into Twitter iframe embeds and links hashtags/mentions.
  - `getPlatformMeta(url)`: Returns platform branding color and display name for known hosts (Spotify, Reddit, Figma, Vimeo, CodePen, SoundCloud, GitHub, CodeSandbox, LinkedIn, Dribbble, Behance, Notion).
  - `getUniversalEmbedUrl(url)`: Generates embeddable player iframe URLs for Spotify, Vimeo, Figma, CodePen, Reddit, SoundCloud, and CodeSandbox.

### `safeFetch` (`src/utils/safeFetch.ts`)
- **What it does**: SSRF (Server-Side Request Forgery) protection library for server-side HTTP requests:
  - `isPrivateIpAddress(ip)`: Inspects IPv4 and IPv6 addresses against private, loopback, link-local, carrier-grade NAT, multicast, and reserved ranges (RFC 1918, RFC 3927, RFC 6598, etc.).
  - `isSafeUrl(urlStr)`: Validates URL protocol (`http:` or `https:`), rejects `localhost`, `.local`, `.internal`, and uses Node `dns.lookup(hostname, { all: true })` to verify that all resolved IP addresses are public.
  - `safeFetch(url, options, maxRedirects)`: Wraps native `fetch` with `redirect: 'manual'`, verifying every redirect destination address against `isSafeUrl` to prevent DNS rebinding and open redirect SSRF attacks.
- **Used by**: `src/app/api/save/route.ts`, `src/app/api/check-frame/route.ts`.

### `normalizeUrl` (`src/utils/normalizeUrl.ts`)
- **What it does**: Cleans URLs by adding `https://` if missing, lowercasing hostnames, removing `www.`, removing trailing slashes, and removing hash fragments.
- **Used by**: `src/hooks/useBookmarks.ts`.

### Supabase Utilities (`src/utils/supabase/`)
- **`client.ts`**: Calls `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)` from `@supabase/ssr`.
- **`server.ts`**: Calls `createServerClient` from `@supabase/ssr` with async `cookies()` from `next/headers`.

---

## 8. MAIN USER FLOWS

### (a) Saving a Link from the Dashboard
1. User clicks the composer bar in `src/components/BookmarkList.tsx` or presses shortcut `N`.
2. User pastes a URL (e.g., `https://example.com/article`) into the TipTap input and presses `Cmd+Enter` (or clicks "Save").
3. `handleQuickCapture()` in `BookmarkList.tsx` parses the content. It detects that the input is a single link, normalizes it, and checks local `bookmarks` state for duplicates.
4. If unique, it dispatches `POST /api/save` with `{ url: "https://example.com/article" }`.
5. In `src/app/api/save/route.ts`:
   - Session is verified via `supabase.auth.getUser()`.
   - Normalization and deduplication check runs against the database (handling trailing slashes, http/https, and www variants).
   - If not duplicate, `isSafeUrl()` checks SSRF safety, then `safeFetch()` downloads the first 512KB of HTML.
   - `cheerio` extracts `<meta property="og:title">`, `<title>`, `<meta property="og:description">`, and `<meta property="og:image">`.
   - A new row is inserted into `bookmarks` with `type: 'link'`, `category: 'Inbox'`, `tags: ['auto-saved', 'link']`.
6. Supabase Realtime detects the database insert and broadcasts a `postgres_changes` event.
7. `useBookmarks.ts` receives the `INSERT` payload, ensures no duplicate by ID or URL exists in state, and prepends the new bookmark to the local list.

### (b) Saving a Note
1. User opens the composer in `BookmarkList.tsx` (`N` or click).
2. User types text or uses slash commands (`/h1`, `/task`, `/table`, `/code`) in `TipTapEditor.tsx`.
3. User presses `Cmd+Enter` or clicks "Save".
4. `handleQuickCapture()` verifies that the remaining text is not merely a bare link.
5. It sends `POST /api/save` with `{ url: window.location.origin + '/note-' + Date.now(), content: inputValue, type: 'note' }`.
6. `/api/save/route.ts` detects `itemType === 'note'`, skips external web scraping, sets `finalTitle: ''` and `finalDescription: null`, and inserts the note HTML directly into the `content` column of `bookmarks`.
7. Realtime sync broadcasts the insertion to `useBookmarks.ts`, updating the dashboard.

### (c) Uploading a File
1. User clicks the paperclip icon in `BookmarkList.tsx` or runs the "Upload a file" command from the palette.
2. The hidden `<input type="file" accept="image/*,video/*,application/pdf">` opens.
3. `handleFileUpload()` in `BookmarkList.tsx` gets the user ID, generates a unique storage path `${user.id}/${Date.now()}-${random}.${ext}`, and uploads the file to the `attachments` bucket via `supabase.storage.from('attachments').upload()`.
4. It calls `supabase.storage.from('attachments').getPublicUrl(fileName)` to get the CDN URL.
5. It inserts a new row directly into `bookmarks` via `supabase.from('bookmarks').insert(...)` with `file_path`, `file_type`, and `type: 'image' | 'video' | 'pdf' | 'file'`.
6. Realtime pushes the new card to the UI.

### (d) Saving from the Chrome Extension
1. **Selection Context**: User selects text on any webpage, right-clicks, and selects "Save inntoit" from the context menu.
2. In `smart-bookmarks-ext/background.js`:
   - The `chrome.contextMenus.onClicked` listener triggers.
   - Badge updates to `"..."` (color `#4D6A51`).
   - `chrome.scripting.executeScript` executes `extractSelectionHtmlInPage()` directly in the active tab. This recursively processes DOM nodes, stripping scripts/styles/media while preserving headers (`H1`-`H6`), lists (`UL`, `OL`, `LI`), blockquotes, code blocks, bold/italics, and absolute `<a>` hyperlinks.
   - If executeScript fails, `content.js` responds via `GET_CLICKED_CONTEXT` with `selectedHtml`. If neither succeeds, `plainTextToHtml()` formats the plain selection text into `<p>` paragraphs.
3. **URL Context**: `content.js` inspects `rightClickedElement` via `extractExactUrl()`:
   - For YouTube: grabs the canonical video link, stripping `&list=`, `&index=`, `&pp=`, and ignores temporary `blob:` URLs.
   - For X/Twitter: finds the nearest tweet article and extracts the permanent `/status/123...` URL.
   - For Instagram: extracts `/p/` or `/reel/` links.
   - For Pinterest: extracts `/pin/` links.
4. `background.js` executes `fetch('https://smart-bookmark-app-lime.vercel.app/api/save', { method: 'POST', credentials: 'include', body: JSON.stringify(payload) })`.
5. The user's Supabase session cookies authenticate the request.
6. Badge updates to `"OK"` on success, `"TXT"` if plain text fallback was used, `"DUP"` if 409 duplicate, or `"ERR"` on error, clearing after 2.2 seconds.

### (e) Opening a Bookmark in the Editorial Modal & Autosave
1. User clicks any card in `BookmarkCard.tsx`.
2. `openModal()` updates the browser URL without reload: `history.pushState({}, '', '?b=' + bookmark.id)` and sets `isModalOpen = true`.
3. `<EditorialModal />` mounts via a portal attached to `document.body`.
4. The user modifies the title, folder, subfolder, personal notes, or edits a rich-text note in TipTap.
5. On input blur (`onBlur`), escape key (`Escape`), swipe down on mobile, or clicking outside the modal, `handleAutoSave()` compares current state against the original bookmark values.
6. If any field changed, `onSave(bookmark.id, updates)` calls `updateBookmark()` in `useBookmarks.ts`, which sends an `UPDATE` query to Supabase: `supabase.from('bookmarks').update(payload).eq('id', id)`.
7. A toast notification `"Saved"` is shown, and the local list updates immediately.

### (f) Moving Items Between Folders (Drag and Drop)
1. User drags a card in `BookmarkCard.tsx`. `onDragStart` sets `dataTransfer.setData('bookmarkId', id.toString())` and sets `isDragged` styling (opacity 40%).
2. User hovers over any category or subfolder item in `Sidebar.tsx`. `handleDragOver` prevents default.
3. User drops the card on a folder. `handleDrop` retrieves the `bookmarkId` and invokes `updateBookmark(id, { category: targetCategory, sub_category: targetSubCategory || null })`.
4. Database updates and the bookmark transitions into the selected folder.

### (g) Search, Filtering, and Sorting
1. **Search**: User types into the search input or opens the command palette (`Cmd+K`). Queries match case-insensitively across `title`, `url`, `content`, `description`, `category`, and `sub_category`.
2. **Category / Folder Filter**: Clicking a folder or subfolder in the Sidebar sets `activeFilter` and `activeSubFilter`.
3. **Type Filter**: Clicking type pills (`Links`, `Notes`, `Images`, `Videos`, `Documents`, `Socials`) filters using `matchesType()` helper.
4. **Sorting**: Clicking the sort toggle alternates `sortOrder` between `'desc'` (newest first) and `'asc'` (oldest first).
5. **Date Grouping**: Toggling "Group by date" in the View menu organizes bookmarks under sticky date headers (`Today`, `Yesterday`, or formatted date string).
6. **Masonry Distribution**: In `BookmarkList.tsx`, `distributeIntoColumns` uses estimated heights (`estimateCardHeight`) to balance cards across columns while strictly preserving descending chronological order.

---

## 9. STYLING AND DESIGN SYSTEM

- **Aesthetic**: Neo-brutalist and Swiss-international minimalist aesthetic combining warm, organic tones (`#FAF9F5` warm paper, `#FBF9F4` alabaster) with structured high-contrast dark mode (`#0F120F` obsidian, `#151815` charcoal). Accented with muted forest green (`#4D6A51` in light mode, `#8FAA91` in dark mode) and subtle high-blur glassmorphism (`backdrop-blur-xl`, `border-black/[0.04]` / `border-white/[0.04]`).
- **Typography**:
  - `Geist Sans` (`--font-geist-sans`) and `Geist Mono` (`--font-geist-mono`) loaded via `next/font/google` in `layout.tsx`.
  - Landing page imports Google Fonts: `Archivo`, `JetBrains Mono` (`font-mono-tech`), `Plus Jakarta Sans` (`font-body`), and Fontshare's `Cabinet Grotesk` (`font-tall-block`, `font-block`, `font-syne-black`).
  - Editorial modal and cards use system serif fonts (`font-serif` / Georgia) for reading notes and titles.
- **Dark Mode Architecture**:
  - Driven by the `.dark` class on the root `<html>` element (`document.documentElement.classList.add('dark')`).
  - In `src/app/globals.css`, Tailwind v4 variant is defined: `@custom-variant dark (&:is(.dark *));`.
  - Global transitions are defined on `*, ::before, ::after` for `background-color`, `border-color`, `color`, `fill`, `stroke` with a `300ms` cubic-bezier transition.
- **Global CSS Overrides (`src/app/globals.css`)**:
  - **TipTap Task Lists**: Custom styling for `.prose li[data-type="taskItem"]` removing default bullets, aligning circular radio-style checkboxes (`border: 2px solid #A0AEC0`, checked background `#4D6A51` with white checkmark), and striking through checked label text.
  - **TipTap Tables**: Collapsed border styling with subtle border lines (`rgba(0, 0, 0, 0.15)` in light, `rgba(255, 255, 255, 0.15)` in dark) and shaded headers.
  - **Custom Scrollbars**: `.custom-scrollbar` class with a 6px transparent track and rounded gray thumb.
- **Toaster Configuration (`src/app/layout.tsx`)**:
  - Neo-brutalist styling: `border: '4px solid #111827'`, `boxShadow: '6px 6px 0px 0px rgba(17,24,39,1)'`, `borderRadius: '1rem'`.

---

## 10. KNOWN ISSUES AND TODOS

### Code Comments (`TODO`, `FIXME`, `HACK`, `FIX`)

1. **`src/app/globals.css` (Line 207)**:
   ```css
   /* --- FIX: CORRECTED TABLE BORDERS --- */
   ```
   *Context*: Fixes table borders inside TipTap editor to render correctly in both light and dark modes.
2. **`src/context/ThemeContext.tsx` (Line 60)**:
   ```typescript
   // FIX: Removed the '!isDarkMode' block so the image renders in both modes
   ```
   *Context*: Allows custom background images to render in both light and dark mode instead of light-only.
3. **`smart-bookmarks-ext/background.js` (Line 152)**:
   ```javascript
   // FIX: YouTube passes temporary 'blob:https...' links when right-clicking a video.
   
   i dont need this custom background images so i think i should delete this!
   ```
   *Context*: YouTube right-click events produce ephemeral `blob:` URLs for `<video>` tags; the extension explicitly discards `blob:` URLs and falls back to the tab's canonical page URL.

### Fragile, Duplicated, or Inconsistent Patterns

1. **Duplicated URL Normalization Logic**:
   - `src/utils/normalizeUrl.ts`: Strips `www.`, trailing slash, and hash.
   - `src/app/api/save/route.ts` (Line 37): Contains its own `normalizeUrl()` function that includes custom YouTube `?v=` query parameter sanitization and preserves `#` hashes specifically for notes.
   - `src/components/BookmarkList.tsx` (Line 56): Contains yet another private `normalizeUrl()` implementation that normalizes YouTube links but handles queries differently.
   - `smart-bookmarks-ext/content.js` (Line 144): Contains a `cleanUrl()` function that deletes YouTube parameters `list`, `index`, `pp` and Twitter tracking parameters.
   *Risk*: Inconsistent normalization across frontend, backend, and extension can lead to deduplication mismatches where the client fails to recognize an existing database entry.
2. **Hardcoded Production URLs**:
   - `https://smart-bookmark-app-lime.vercel.app` is hardcoded in:
     - `src/app/api/save/route.ts` (CORS allowed origins)
     - `smart-bookmarks-ext/background.js` (`API_URL`)
     - `smart-bookmarks-ext/popup.js` (`API_URL`)
     - `smart-bookmarks-ext/manifest.json` (`host_permissions`)
   - `https://inntoit.app/welcome` is hardcoded in `src/app/auth/callback/route.ts` (onboarding note).
   *Risk*: Deploying to a custom domain or staging preview breaks extension requests and CORS unless these hardcoded strings are updated.
3. **Dead / Unused Component (`BookmarkForms.tsx`)**:
   - `src/components/BookmarkForms.tsx` is completely unreferenced across the application. It represents an older form-based input UI that was replaced by the composer in `BookmarkList.tsx`.
4. **Unreachable Background Customization UI**:
   - `ThemeContext.tsx` manages `bgTheme` (`bgUrl` and `bgHex`) and stores them in `localStorage`, but no user interface is exposed in the dashboard or sidebar to allow users to select or upload a custom background.
    i dont want this feature now.
5. **Synthetic URL Inconsistency for Notes**:
   - When saving notes without a URL, `api/save/route.ts` creates `https://smart-bookmark.internal/note-${Date.now()}`, whereas `BookmarkList.tsx` creates `${window.location.origin}/note-${Date.now()}`.
6. **Dual SHA-256 Hashing Mechanisms**:
   - `ProfileDropdown.tsx` uses the browser's Web Crypto API (`window.crypto.subtle.digest('SHA-256')`).
   - `api/save/route.ts` uses Node.js `crypto.createHash('sha256')`.
   - While both generate standard SHA-256 hex strings, any whitespace or encoding deviation between them could cause token validation failures.

---

## 11. ENVIRONMENT

The following environment variables are used by the application:

| Variable Name | Required By | Description / Purpose | Read In |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend & Backend | The public HTTPS endpoint for the Supabase project. Used by browser clients, SSR server clients, and the service-role admin client. | `src/utils/supabase/client.ts`, `src/utils/supabase/server.ts`, `src/middleware.ts`, `src/app/api/save/route.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend & Backend | The public anonymous API key for Supabase. Used for public queries and client-side authentication subject to Row Level Security (RLS). | `src/utils/supabase/client.ts`, `src/utils/supabase/server.ts`, `src/middleware.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend Only | Privileged Supabase secret key with admin access (bypasses RLS). Used in `/api/save` to query the `api_keys` table and authenticate external requests (e.g. iOS Shortcuts) by hashed token. | `src/app/api/save/route.ts` |
| `CHROME_EXTENSION_ID` | Backend Only | The Chrome Extension ID (from the Chrome Web Store or Developer Mode). Used in `/api/save` to whitelist `chrome-extension://${CHROME_EXTENSION_ID}` in the CORS allowlist. Defaults to `'YOUR_EXTENSION_ID_HERE'` if unset. | `src/app/api/save/route.ts` |
| `NODE_ENV` | Build & Runtime | Node environment flag (`'development'` vs `'production'`). Used in auth callback to determine redirect hosts. | `src/app/auth/callback/route.ts` |

---

## 12. FULL SOURCE OF KEY FILES

*(Note: Per handover instructions, full source code of key files is located in [`PROJECT_SOURCES.md`](./PROJECT_SOURCES.md) at the project root.)*
