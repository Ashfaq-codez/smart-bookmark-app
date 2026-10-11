-- inntoit 0004: a short "fingerprint" of each note's text, so the save route can spot duplicate notes quickly.
-- Run after 0003. Run STEP 1 first (it only reads), then STEP 2.
--
-- Why: comparing whole note bodies (can be huge) is slow and cannot use a normal index well.
-- A fingerprint is a short code made from the text: the same text always gives the same code.
-- The database keeps it up to date by itself, so the app never writes it.

-- =====================================================================
-- STEP 1: read-only checks. Safe to run any time; nothing is changed.
-- =====================================================================

-- 1a. Is the pgcrypto extension installed? (It provides the digest() function.)
--     Expect one row. On Supabase it normally lives in the "extensions" schema.
--     If you get no rows, run:  create extension if not exists pgcrypto with schema extensions;
select extname, extnamespace::regnamespace from pg_extension where extname = 'pgcrypto';

-- 1b. How many duplicate notes (same text, same user) already exist?
--     This is only for your information; STEP 2 does not delete or change anything.
select user_id, count(*) as copies, left(content, 60) as starts_with
from public.bookmarks
where type = 'note' and content is not null
group by user_id, content
having count(*) > 1
order by copies desc;

-- =====================================================================
-- STEP 2: apply. Runs as one unit: either everything is added or nothing.
-- =====================================================================
begin;

-- 2a. The fingerprint column. "generated always ... stored" means Postgres fills it in
--     itself whenever a note's content is saved or edited; the app cannot (and must not) write it.
--     It is the first 16 characters of the SHA-256 of the text, and only exists for notes.
--     Other bookmarks (and notes without text) get NULL, and NULL never matches anything.
--     NOTE: adding a stored column rewrites the table once; with a small table this takes moments.
alter table public.bookmarks
  add column if not exists content_fp text generated always as (
    case when type = 'note' and content is not null
         then left(encode(extensions.digest(content, 'sha256'), 'hex'), 16)
    end
  ) stored;

-- 2b. A plain index (NOT unique, so existing duplicates stay valid) to make the duplicate lookup fast.
create index if not exists bookmarks_user_content_fp_idx
  on public.bookmarks (user_id, content_fp)
  where content_fp is not null;

commit;

-- ROLLBACK (only if you need to undo this; run it by itself):
-- begin;
--   drop index if exists public.bookmarks_user_content_fp_idx;
--   alter table public.bookmarks drop column if exists content_fp;
-- commit;
