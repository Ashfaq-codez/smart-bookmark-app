-- inntoit 0002: lock down the "attachments" storage bucket.
--
-- PROBLEM: the current policies only check "is logged in", not "is this MY file".
--   * any logged-in user can delete ANY user's file
--   * any logged-in user can write into ANY user's folder
--   * anyone can list every file path in the bucket
-- FIX: uploads must go into the user's own <user id>/ folder; reading and deleting is limited
-- to the file's owner (storage records the uploader in owner_id, which also covers older files
-- that were uploaded before the app used per-user folders).
-- Public image/video/PDF URLs keep working, because the bucket itself stays public.

-- ---------- STEP 1: run this first (changes nothing) ----------
-- Lists files that are NOT inside a <user id>/ folder (older uploads), who owns them, and which bookmark uses them.
-- Expected: owner_id equals the bookmark's user_id on every row. If owner_id is empty, stop and ask.
--
-- select o.name, o.owner_id, b.id as bookmark_id, b.user_id, b.title
-- from storage.objects o
-- left join public.bookmarks b on b.file_path = o.name
-- where o.bucket_id = 'attachments'
--   and ((storage.foldername(o.name))[1] is null
--        or (storage.foldername(o.name))[1] !~ '^[0-9a-fA-F-]{36}$');

-- ---------- STEP 2: apply (safe to run even if an earlier version of this file was already run) ----------
begin;

drop policy if exists "Authenticated Uploads" on storage.objects;
drop policy if exists "Authenticated Deletes" on storage.objects;
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "attachments: upload to own folder" on storage.objects;
drop policy if exists "attachments: read own files" on storage.objects;
drop policy if exists "attachments: delete own files" on storage.objects;

create policy "attachments: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "attachments: read own files" on storage.objects
  for select to authenticated
  using (bucket_id = 'attachments'
         and (owner_id = (select auth.uid())::text
              or (storage.foldername(name))[1] = (select auth.uid())::text));

create policy "attachments: delete own files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'attachments'
         and (owner_id = (select auth.uid())::text
              or (storage.foldername(name))[1] = (select auth.uid())::text));

-- Upload limits (the bucket currently accepts any file of any size).
-- 50 MB is the Free plan's per-file maximum; lower it if you want.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/*', 'video/*', 'application/pdf']
where id = 'attachments';

commit;

-- ---------- STEP 3: test in the app ----------
-- Upload an image, open it, delete the bookmark (that also deletes the file). All three must still work.

-- ---------- ROLLBACK (only if something breaks; restores the old, permissive policies) ----------
-- begin;
-- drop policy if exists "attachments: upload to own folder" on storage.objects;
-- drop policy if exists "attachments: read own files" on storage.objects;
-- drop policy if exists "attachments: delete own files" on storage.objects;
-- create policy "Authenticated Uploads" on storage.objects for insert
--   with check (bucket_id = 'attachments' and auth.role() = 'authenticated');
-- create policy "Authenticated Deletes" on storage.objects for delete
--   using (bucket_id = 'attachments' and auth.role() = 'authenticated');
-- create policy "Public Access" on storage.objects for select
--   using (bucket_id = 'attachments');
-- update storage.buckets set file_size_limit = null, allowed_mime_types = null where id = 'attachments';
-- commit;
