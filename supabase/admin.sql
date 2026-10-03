-- Apply after upgrade.sql, media.sql and growth.sql. No account gets admin rights automatically.
begin;
create table if not exists public.dating_admins(id uuid primary key references auth.users on delete cascade);
alter table public.dating_admins enable row level security;
revoke all on public.dating_admins from anon,authenticated;
create or replace function public.dating_is_admin() returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and exists(select 1 from public.dating_admins where id=auth.uid()); $$;
revoke all on function public.dating_is_admin() from public;
grant execute on function public.dating_is_admin() to authenticated;
create table if not exists public.dating_support_messages(
 id uuid primary key default gen_random_uuid(),member_id uuid not null references auth.users on delete cascade,
 author_id uuid not null references auth.users on delete cascade,body text not null check(length(trim(body)) between 1 and 2000),created_at timestamptz not null default now()
);
create index if not exists dating_support_member on public.dating_support_messages(member_id,created_at);
alter table public.dating_support_messages enable row level security;
revoke all on public.dating_support_messages from anon,authenticated;
grant select,insert on public.dating_support_messages to authenticated;
drop policy if exists support_read on public.dating_support_messages;
create policy support_read on public.dating_support_messages for select to authenticated using(member_id=auth.uid() or public.dating_is_admin());
drop policy if exists support_insert on public.dating_support_messages;
create policy support_insert on public.dating_support_messages for insert to authenticated with check(author_id=auth.uid() and (member_id=auth.uid() or public.dating_is_admin()));
create table if not exists public.dating_suspensions(member_id uuid primary key references auth.users on delete cascade,reason text not null check(length(trim(reason)) between 1 and 400),created_at timestamptz not null default now(),admin_id uuid not null references auth.users);
alter table public.dating_suspensions enable row level security;
revoke all on public.dating_suspensions from anon,authenticated;
create or replace function public.dating_is_suspended(member uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.dating_suspensions where member_id=member); $$;
revoke all on function public.dating_is_suspended(uuid) from public;
grant execute on function public.dating_is_suspended(uuid) to authenticated;
create or replace function public.dating_has_profile() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.dating_profiles where id=auth.uid()) and not public.dating_is_suspended(auth.uid()); $$;
create or replace function public.dating_can_chat(a uuid,b uuid) returns boolean language sql stable security definer set search_path='' as $$ select (a=auth.uid() or b=auth.uid()) and a<>b and not public.dating_is_suspended(a) and not public.dating_is_suspended(b) and not public.dating_is_blocked(a,b) and exists(select 1 from public.dating_likes where sender=a and recipient=b) and exists(select 1 from public.dating_likes where sender=b and recipient=a); $$;
drop policy if exists profiles_read on public.dating_profiles;
create policy profiles_read on public.dating_profiles for select to authenticated using(id=auth.uid() or(public.dating_has_profile() and not public.dating_is_suspended(id) and not public.dating_is_blocked(auth.uid(),id) and (visible or public.dating_are_mutual(auth.uid(),id))));
drop policy if exists profiles_insert on public.dating_profiles;
create policy profiles_insert on public.dating_profiles for insert to authenticated with check(id=auth.uid() and not public.dating_is_suspended(auth.uid()));
drop policy if exists profiles_update on public.dating_profiles;
create policy profiles_update on public.dating_profiles for update to authenticated using(id=auth.uid() and not public.dating_is_suspended(auth.uid())) with check(id=auth.uid() and not public.dating_is_suspended(auth.uid()));
drop policy if exists likes_insert on public.dating_likes;
create policy likes_insert on public.dating_likes for insert to authenticated with check(sender=auth.uid() and not public.dating_is_suspended(sender) and not public.dating_is_suspended(recipient) and not public.dating_is_blocked(sender,recipient));
create or replace function public.dating_public_directory() returns table(id uuid,name text,age integer,borough text,intention text,interests text[]) language sql stable security definer set search_path='' as $$ select p.id,p.name,p.age,p.borough,p.intention,p.interests from public.dating_profiles p where p.public_intro and p.visible and not exists(select 1 from public.dating_suspensions s where s.member_id=p.id) and (auth.uid() is null or not exists(select 1 from public.dating_blocks b where (b.sender=auth.uid() and b.recipient=p.id) or (b.recipient=auth.uid() and b.sender=p.id))) order by p.borough,p.name,p.id; $$;
create or replace function public.dating_admin_members(page_number integer default 0,search_term text default '') returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.dating_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 with members as (
 select u.id,u.email,u.created_at as joined_at,u.email_confirmed_at is not null as confirmed,u.last_sign_in_at,
 p.name,p.age,p.borough,p.neighborhood,p.bio,p.intention,p.gender,p.interested_in,p.interests,p.visible,p.public_intro,p.photo_paths,p.video_path,c.value as contact,c.share as contact_shared,s.member_id is not null as suspended
 from auth.users u left join public.dating_profiles p on p.id=u.id left join public.dating_contacts c on c.id=u.id left join public.dating_suspensions s on s.member_id=u.id
 where (p.id is not null or u.raw_user_meta_data->>'app'='after-hours' or u.raw_user_meta_data->>'referral_source' in ('invite','direct') or exists(select 1 from public.dating_support_messages m where m.member_id=u.id) or u.id=auth.uid())
 and (coalesce(p.name,'') ilike '%'||left(search_term,120)||'%' or u.email ilike '%'||left(search_term,120)||'%')
 ), page as(select * from members order by joined_at desc,id limit 50 offset greatest(0,page_number)*50)
 select jsonb_build_object('members',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb),'total',(select count(*) from members),'suspended',(select count(*) from members where suspended),'confirmed',(select count(*) from members where confirmed)) into result;
 return result;
end; $$;
create or replace function public.dating_admin_suspend(target uuid,suspend boolean,note text default '') returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.dating_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 if exists(select 1 from public.dating_admins where id=target) then raise exception 'Administrator accounts cannot be suspended here'; end if;
 if not exists(select 1 from auth.users u where u.id=target and (u.raw_user_meta_data->>'app'='after-hours' or u.raw_user_meta_data->>'referral_source' in ('invite','direct') or exists(select 1 from public.dating_profiles where id=target) or exists(select 1 from public.dating_support_messages where member_id=target))) then raise exception 'Dating member not found'; end if;
 if suspend then
  if length(trim(note)) not between 1 and 400 then raise exception 'Provide a suspension reason'; end if;
  insert into public.dating_suspensions(member_id,reason,admin_id) values(target,trim(note),auth.uid()) on conflict(member_id) do update set reason=excluded.reason,admin_id=excluded.admin_id,created_at=now();
 else delete from public.dating_suspensions where member_id=target; end if;
end; $$;
create or replace function public.dating_admin_reports() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.dating_is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(to_jsonb(r)) from(select r.id,r.sender,r.recipient,r.reason,r.created_at,p.name as reported_name from public.dating_reports r left join public.dating_profiles p on p.id=r.recipient order by r.created_at desc limit 100) r),'[]'::jsonb);
end; $$;
revoke all on function public.dating_admin_members(integer,text),public.dating_admin_suspend(uuid,boolean,text),public.dating_admin_reports() from public;
grant execute on function public.dating_admin_members(integer,text),public.dating_admin_suspend(uuid,boolean,text),public.dating_admin_reports() to authenticated;
create or replace function public.dating_admin_can_read_media(bucket text,path text) returns boolean language sql stable security definer set search_path='' as $$ select public.dating_is_admin() and exists(select 1 from public.dating_profiles p where (bucket='dating-photos' and path=any(p.photo_paths)) or(bucket='dating-videos' and path=p.video_path)); $$;
revoke all on function public.dating_admin_can_read_media(text,text) from public;
grant execute on function public.dating_admin_can_read_media(text,text) to authenticated;
drop policy if exists dating_admin_media_read on storage.objects;
create policy dating_admin_media_read on storage.objects for select to authenticated using(public.dating_admin_can_read_media(bucket_id,name));
commit;
