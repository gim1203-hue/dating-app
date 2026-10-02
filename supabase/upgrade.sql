-- Run once in LearnFlow SQL Editor after the original schema.sql.
-- This migration only changes dating_ objects and its own photo bucket.
begin;
alter table public.dating_profiles
 add column if not exists neighborhood text not null default '' check(length(neighborhood)<=60),
 add column if not exists intention text not null default 'Open to possibilities' check(intention in ('Casual dating','Long-term relationship','Open to possibilities')),
 add column if not exists gender text not null default 'Prefer not to say' check(gender in ('Woman','Man','Nonbinary','Prefer not to say')),
 add column if not exists interested_in text[] not null default array['Everyone'] check(interested_in <@ array['Everyone','Woman','Man','Nonbinary','Prefer not to say']::text[] and cardinality(interested_in)>0),
 add column if not exists interests text[] not null default '{}' check(cardinality(interests)<=8),
 add column if not exists photo_paths text[] not null default '{}' check(cardinality(photo_paths)<=4),
 add column if not exists available_until timestamptz,
 add column if not exists visible boolean not null default true;

create or replace function public.dating_are_mutual(a uuid,b uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select (a=auth.uid() or b=auth.uid()) and exists(select 1 from public.dating_likes where sender=a and recipient=b) and exists(select 1 from public.dating_likes where sender=b and recipient=a);
$$;
revoke all on function public.dating_are_mutual(uuid,uuid) from public;
grant execute on function public.dating_are_mutual(uuid,uuid) to authenticated;
drop policy if exists profiles_read on public.dating_profiles;
create policy profiles_read on public.dating_profiles for select to authenticated
using(id=auth.uid() or (public.dating_has_profile() and not public.dating_is_blocked(auth.uid(),id) and (visible or public.dating_are_mutual(auth.uid(),id))));

create or replace function public.dating_validate_photos() returns trigger
language plpgsql set search_path='' as $$
begin
 if exists(select 1 from unnest(new.photo_paths) p where p not like new.id::text||'/%' or p like '%..%' or p like '%//%') then
  raise exception 'Photos must belong to your own profile';
 end if;
 return new;
end; $$;
drop trigger if exists dating_photo_ownership on public.dating_profiles;
create trigger dating_photo_ownership before insert or update on public.dating_profiles for each row execute function public.dating_validate_photos();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('dating-photos','dating-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
drop policy if exists dating_photo_read on storage.objects;
create policy dating_photo_read on storage.objects for select to authenticated using (
 bucket_id='dating-photos' and ((storage.foldername(name))[1]=auth.uid()::text or
 exists(select 1 from public.dating_profiles p where p.id::text=(storage.foldername(storage.objects.name))[1] and storage.objects.name=any(p.photo_paths)))
);
drop policy if exists dating_photo_insert on storage.objects;
create policy dating_photo_insert on storage.objects for insert to authenticated with check(bucket_id='dating-photos' and (storage.foldername(name))[1]=auth.uid()::text and public.dating_has_profile());
drop policy if exists dating_photo_delete on storage.objects;
create policy dating_photo_delete on storage.objects for delete to authenticated using(bucket_id='dating-photos' and (storage.foldername(name))[1]=auth.uid()::text);

-- Unmatching or blocking removes the previous conversation permanently.
create or replace function public.dating_clear_conversation() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 delete from public.dating_messages where (sender=old.sender and recipient=old.recipient) or (sender=old.recipient and recipient=old.sender);
 return old;
end; $$;
drop trigger if exists dating_unmatch_cleanup on public.dating_likes;
create trigger dating_unmatch_cleanup after delete on public.dating_likes for each row execute function public.dating_clear_conversation();
create or replace function public.dating_block_cleanup() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 delete from public.dating_likes where (sender=new.sender and recipient=new.recipient) or (sender=new.recipient and recipient=new.sender);
 delete from public.dating_messages where (sender=new.sender and recipient=new.recipient) or (sender=new.recipient and recipient=new.sender);
 return new;
end; $$;
drop trigger if exists dating_block_cleanup_trigger on public.dating_blocks;
create trigger dating_block_cleanup_trigger after insert on public.dating_blocks for each row execute function public.dating_block_cleanup();
create or replace function public.dating_remove_profile() returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 delete from public.dating_profiles where id=auth.uid();
end; $$;
revoke all on function public.dating_validate_photos(),public.dating_clear_conversation(),public.dating_block_cleanup(),public.dating_remove_profile() from public;
grant execute on function public.dating_remove_profile() to authenticated;
commit;
