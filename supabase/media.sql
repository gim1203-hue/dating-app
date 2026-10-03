-- Apply after schema.sql and upgrade.sql in the Supabase SQL editor.
begin;
alter table public.dating_profiles add column if not exists video_path text;
create or replace function public.dating_validate_video() returns trigger language plpgsql set search_path='' as $$
begin
 if new.video_path is not null and (new.video_path not like new.id::text||'/%' or new.video_path like '%..%' or new.video_path like '%//%' or length(new.video_path)>200) then raise exception 'Video must belong to your profile'; end if;
 return new;
end; $$;
drop trigger if exists dating_video_ownership on public.dating_profiles;
create trigger dating_video_ownership before insert or update on public.dating_profiles for each row execute function public.dating_validate_video();
revoke all on function public.dating_validate_video() from public;
create table if not exists public.dating_contacts(
 id uuid primary key references public.dating_profiles on delete cascade,
 value text not null default '' check(length(value)<=120),
 share boolean not null default false
);
alter table public.dating_contacts enable row level security;
revoke all on public.dating_contacts from anon,authenticated;
grant select,insert,update on public.dating_contacts to authenticated;
drop policy if exists contacts_read on public.dating_contacts;
create policy contacts_read on public.dating_contacts for select to authenticated using(id=auth.uid() or (share and public.dating_can_chat(auth.uid(),id)));
drop policy if exists contacts_insert on public.dating_contacts;
create policy contacts_insert on public.dating_contacts for insert to authenticated with check(id=auth.uid());
drop policy if exists contacts_update on public.dating_contacts;
create policy contacts_update on public.dating_contacts for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('dating-videos','dating-videos',false,26214400,array['video/mp4','video/webm']) on conflict(id) do nothing;
drop policy if exists dating_video_read on storage.objects;
create policy dating_video_read on storage.objects for select to authenticated using(bucket_id='dating-videos' and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.dating_profiles p where p.id::text=(storage.foldername(storage.objects.name))[1] and p.video_path=storage.objects.name)));
drop policy if exists dating_video_insert on storage.objects;
create policy dating_video_insert on storage.objects for insert to authenticated with check(bucket_id='dating-videos' and (storage.foldername(name))[1]=auth.uid()::text and public.dating_has_profile());
drop policy if exists dating_video_delete on storage.objects;
create policy dating_video_delete on storage.objects for delete to authenticated using(bucket_id='dating-videos' and (storage.foldername(name))[1]=auth.uid()::text);
commit;
