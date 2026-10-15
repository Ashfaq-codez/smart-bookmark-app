-- inntoit 0005: a stored snapshot of each X post (author, text, photos, video, quoted post, link card, counts).
-- Run after 0004. Run STEP 1 first (it only reads), then STEP 2, then STEP 3 to check.
--
-- Why: the X card is currently rebuilt from a title, a description and one media address, which loses the
-- author, the video poster, the quoted post and the link card. The server now reads the post once from X's
-- free embed data and keeps a trimmed copy here. Only addresses are stored, never X's files.
--
--   post_data            the snapshot (null = not read yet)
--   post_data_fetched_at when the snapshot was last read successfully
--   post_data_failed_at  when the last attempt failed (deleted / private post); the server retries at most once a day
--
-- Nothing existing is changed or removed. The new columns start empty.

-- =====================================================================
-- STEP 1: read-only checks. Safe to run any time; nothing is changed.
-- =====================================================================

-- 1a. The new columns must NOT exist yet. Expect: no rows.
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'bookmarks'
  and column_name in ('post_data', 'post_data_fetched_at', 'post_data_failed_at');

-- 1b. For your information: how many X posts are saved (these will get a snapshot later).
select count(*) as x_posts from public.bookmarks where type = 'twitter';

-- =====================================================================
-- STEP 2: apply. Runs as one unit: either everything is added or nothing.
-- =====================================================================
begin;

alter table public.bookmarks
  add column if not exists post_data            jsonb,
  add column if not exists post_data_fetched_at timestamptz,
  add column if not exists post_data_failed_at  timestamptz;

-- A snapshot is never huge; this stops a broken one from bloating the table (64 KB is far above a real post).
alter table public.bookmarks drop constraint if exists bookmarks_post_data_size;
alter table public.bookmarks add constraint bookmarks_post_data_size
  check (post_data is null or pg_column_size(post_data) <= 65536);

-- Reading a snapshot is not an edit: keep updated_at as it was when ONLY the snapshot columns change.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (to_jsonb(new) - array['post_data', 'post_data_fetched_at', 'post_data_failed_at', 'updated_at'])
     = (to_jsonb(old) - array['post_data', 'post_data_fetched_at', 'post_data_failed_at', 'updated_at']) then
    new.updated_at = old.updated_at;
  else
    new.updated_at = now();
  end if;
  return new;
end;
$$;

commit;

-- =====================================================================
-- STEP 3: check (read-only). Expect 3 rows: post_data jsonb, post_data_failed_at and post_data_fetched_at
-- timestamp with time zone, all nullable = YES.
-- =====================================================================
-- select column_name, data_type, is_nullable from information_schema.columns
-- where table_schema = 'public' and table_name = 'bookmarks' and column_name like 'post_data%'
-- order by column_name;

-- =====================================================================
-- ROLLBACK (only if something breaks). Removes the snapshots; nothing else is lost.
-- =====================================================================
-- begin;
-- alter table public.bookmarks drop constraint if exists bookmarks_post_data_size;
-- alter table public.bookmarks drop column if exists post_data, drop column if exists post_data_fetched_at,
--   drop column if exists post_data_failed_at;
-- create or replace function public.set_updated_at()
-- returns trigger language plpgsql set search_path = '' as $$
-- begin
--   new.updated_at = now();
--   return new;
-- end;
-- $$;
-- commit;
