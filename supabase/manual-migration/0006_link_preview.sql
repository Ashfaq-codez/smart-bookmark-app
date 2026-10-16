-- inntoit 0006: remember when a link card's missing preview picture was last looked for.
-- Run after 0005. Run STEP 1 first (it only reads), then STEP 2, then STEP 3 to check.
--
-- Why: link cards without a picture now repair themselves (the page is read again, or a screenshot is taken).
-- This column makes sure each card is tried at most once a day, so a page that never has a picture
-- isn't fetched over and over.
--
--   preview_tried_at  when the last repair attempt ran (null = never)
--
-- Nothing existing is changed or removed. The new column starts empty.

-- =====================================================================
-- STEP 1: read-only checks. Safe to run any time; nothing is changed.
-- =====================================================================

-- 1a. The new column must NOT exist yet. Expect: no rows.
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'bookmarks' and column_name = 'preview_tried_at';

-- 1b. For your information: how many link cards have no picture (these will repair themselves).
select count(*) as links_without_picture from public.bookmarks
where type = 'link' and (image_url is null or image_url = '');

-- =====================================================================
-- STEP 2: apply. Runs as one unit: either everything is added or nothing.
-- =====================================================================
begin;

alter table public.bookmarks add column if not exists preview_tried_at timestamptz;

-- A repair attempt is not an edit: keep updated_at as it was when ONLY these bookkeeping columns change.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (to_jsonb(new) - array['post_data', 'post_data_fetched_at', 'post_data_failed_at', 'preview_tried_at', 'updated_at'])
     = (to_jsonb(old) - array['post_data', 'post_data_fetched_at', 'post_data_failed_at', 'preview_tried_at', 'updated_at']) then
    new.updated_at = old.updated_at;
  else
    new.updated_at = now();
  end if;
  return new;
end;
$$;

commit;

-- =====================================================================
-- STEP 3: check (read-only). Expect 1 row: preview_tried_at, timestamp with time zone, YES.
-- =====================================================================
-- select column_name, data_type, is_nullable from information_schema.columns
-- where table_schema = 'public' and table_name = 'bookmarks' and column_name = 'preview_tried_at';

-- =====================================================================
-- ROLLBACK (only if something breaks). Nothing else is lost.
-- =====================================================================
-- begin;
-- alter table public.bookmarks drop column if exists preview_tried_at;
-- create or replace function public.set_updated_at()
-- returns trigger language plpgsql set search_path = '' as $$
-- begin
--   if (to_jsonb(new) - array['post_data', 'post_data_fetched_at', 'post_data_failed_at', 'updated_at'])
--      = (to_jsonb(old) - array['post_data', 'post_data_fetched_at', 'post_data_failed_at', 'updated_at']) then
--     new.updated_at = old.updated_at;
--   else
--     new.updated_at = now();
--   end if;
--   return new;
-- end;
-- $$;
-- commit;
