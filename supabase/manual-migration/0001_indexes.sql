-- inntoit 0001: indexes. Safe to run more than once. Only adds indexes, changes no data.
-- (Your api_keys.token is already unique via api_keys_token_key, so no index is added for it.)

-- The main dashboard query: WHERE user_id = ? ORDER BY created_at DESC
create index if not exists bookmarks_user_created_idx
  on public.bookmarks (user_id, created_at desc, id desc);

-- Folder / sub-folder filtering
create index if not exists bookmarks_user_category_idx
  on public.bookmarks (user_id, category, sub_category);

-- Tag filtering (needed for the tags feature)
create index if not exists bookmarks_tags_gin_idx
  on public.bookmarks using gin (tags);
