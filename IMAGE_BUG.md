# IMAGE_BUG: uploaded images show broken in card and modal

Read-only investigation, no code changed. No .env values or keys included.

## Likely root cause

Uploaded files are saved with the public URL in `url` and **nothing in `image_url`**, but the card and modal build the `<img>` src from `image_url` only. For uploads that is `undefined`, so the `<img>` has no src and shows broken. The "open source" link uses `url`, which is the correct public Supabase URL, so it opens fine.

It isn't a CSP, Supabase or bucket problem.

## 1. Content-Security-Policy

- `next.config.ts` is only `outputFileTracingRoot: path.join(__dirname)`. There is no `headers()` and no `images` block.
- `src/middleware.ts` only refreshes the Supabase session (`supabase.auth.getUser()`) and sets no headers.
- There is no `vercel.json` and no `public/_headers`.
- A repo-wide search for `Content-Security-Policy` / `img-src` matches only `src/app/api/check-frame/route.ts`. That route inspects other sites' headers and does not set any on this app.
- **No CSP and no `img-src` directive exists, so nothing blocks the Supabase storage domain.**

## 2. How the `<img>` src is built

Plain `<img>` everywhere (no `next/image`). No `getPublicUrl` or `createSignedUrl` is called in either component.

**BookmarkCard.tsx**
- Lines 154-163: `previewImageUrl`
  ```tsx
  if (fallbackStep === 0) return ytHighResThumbnail || bookmark.image_url || undefined;
  return undefined; // Triggers Favicon UI
  ```
- Lines 150-152 set the starting step: `setFallbackStep((bookmark.image_url || ytHighResThumbnail) ? 0 : 1)`.
- Line 300 (image card): `<img src={previewImageUrl} ... onError={() => setFallbackStep(prev => prev + 1)} />`
- `file_path` is used only to delete the file (line 135). It is never used to build a display URL.

**EditorialModal.tsx**
- Line 346 (image type): `<img src={previewImageUrl} ...>`, with no `onError`.
- `previewImageUrl` is the prop passed from the card (BookmarkCard.tsx line 366), so the modal inherits the same empty value.
- Line 184 (social attachment) uses `bookmark.image_url` directly.

**Where uploads are created**: `BookmarkList.tsx:371-379`
```tsx
const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(fileName)
...
insert([{ user_id, title: file.name, url: publicUrl, type, file_path: fileName, file_type: file.type }])
```
`image_url` is never set. `url` holds the public URL.

## 3. "Open source" link

`EditorialModal.tsx` links use `href={bookmark.url}` (e.g. lines 267, 327, 368, 406). The PDF branch uses `src={bookmark.url}` (line 342). There is no redirect or API route.

Difference: the link and the PDF viewer use **`url`** (the public Supabase URL, which works). The image card and modal use **`image_url`** (empty for uploads).

## 4. "attachments" bucket

- It is **public**. `supabase/baseline.sql:66-67` inserts it with `public = true`. `0002_storage_security.sql` states "the bucket itself stays public".
- `0002` changed only the policies (upload and delete restricted to the user's own folder, read policy for authenticated users) and set a 50 MB limit and mime types `image/*`, `video/*`, `application/pdf`. It never makes the bucket private.
- The public URL (`/object/public/...`) doesn't go through those policies. That matches the link opening fine in a new tab.
- The repo has only one commit for `supabase/`: `fd508fc` (2026-10-06, "add database setup records"). These files are records of what was run by hand, so the actual date of the change in the dashboard isn't in git. I haven't checked the live project.

## 5. Commits (`git log --oneline -15` on the requested paths)

```
7e03c86 2026-10-08 Welcome card opens tour, larger desktop tour, socials icon, new command palette
fa10596 2026-10-08 Fix pin icon stacking over header; move pin button above folders
2c4cc5d 2026-10-08 Pin to top and saved view preferences
35b910e 2026-10-07 Save first, read page details after
5747a8c 2026-10-06 load bookmarks in pages with database search and counts
fd508fc 2026-10-06 add database setup records and .env.example
eb175b6 2026-10-06 run auth middleware only on app pages and API
ef8b5b5 2026-10-03 dashboard design change
c149a2d 2026-10-03 dashboard design change
240068e 2026-10-02 dashboard design change
fcdcf82 2026-10-01 text seclection format
9bfc1b9 2026-09-29 landing page update claude
97e2ab7 2026-09-29 card fallbakc preview
ac21d5d 2026-09-28 card fallbakc preview
1936974 2026-09-28 card fallbakc preview
```

Most likely culprit: **`35b910e` (2026-10-07, "Save first, read page details after")**. It removed the card's fallback steps that fetched `https://image.thum.io/...${bookmark.url}`, `api.microlink.io?url=${bookmark.url}` and `s.wordpress.com/mshots/...${bookmark.url}`. For an uploaded image, `bookmark.url` is the image itself, so those screenshot services were probably the only thing that displayed it. The code comment says they were removed because they "showed 'not authorized' and leaked saved addresses". Now the fallback returns `undefined`.

Not likely: `eb175b6` (middleware matcher narrowing, doesn't touch images or headers), `5747a8c` (adds `image_url` to the list columns, so it's fetched, but uploads still have it null), and `fd508fc` (docs and SQL records only).

I confirmed the removal in the 35b910e diff. I did not run the app, so "this was the only thing rendering uploads" is inferred from the code, not observed.

## 6. `images.remotePatterns`

Not applicable: `next/image` is not used and `next.config.ts` has no `images` config.

## Suggested fix (not applied)

For `type` `image` (and `video`/`pdf` if needed), fall back to `bookmark.url` when `image_url` is empty. For example, in `previewImageUrl` use `bookmark.image_url || (displayType === 'image' ? bookmark.url : undefined)`, and make the same change in the step-0 check. Optionally also set `image_url: publicUrl` at the upload insert (`BookmarkList.tsx:378`). Existing rows would still need a backfill: `update bookmarks set image_url = url where type = 'image' and file_path is not null and image_url is null`.
