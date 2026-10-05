-- inntoit 0003: data integrity and small performance fixes. Run after 0001 (0002 is independent).

begin;

-- 1. Deleting a user from Supabase Auth currently FAILS while they still have bookmarks
--    (the bookmarks foreign key has no ON DELETE CASCADE; api_keys already has it).
alter table public.bookmarks
  drop constraint bookmarks_user_id_fkey,
  add constraint bookmarks_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
-- Note: this does not remove the user's files in storage; that needs a separate cleanup later.

-- 2. updated_at: needed for incremental sync, "recently edited" sorting and the knowledge graph.
alter table public.bookmarks
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookmarks_set_updated_at on public.bookmarks;
create trigger bookmarks_set_updated_at
  before update on public.bookmarks
  for each row execute function public.set_updated_at();

-- 3. Same rules, faster: auth.uid() is evaluated once per query instead of once per row.
alter policy "Users can view their own bookmarks"   on public.bookmarks using ((select auth.uid()) = user_id);
alter policy "Users can update their own bookmarks" on public.bookmarks using ((select auth.uid()) = user_id);
alter policy "Users can delete their own bookmarks" on public.bookmarks using ((select auth.uid()) = user_id);
alter policy "Users can insert their own bookmarks" on public.bookmarks with check ((select auth.uid()) = user_id);
alter policy "Users can manage their own API keys"  on public.api_keys  using ((select auth.uid()) = user_id);

commit;
