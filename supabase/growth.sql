-- Apply after schema.sql and upgrade.sql. Public introductions are opt-in.
begin;
alter table public.dating_profiles add column if not exists public_intro boolean not null default false;
create or replace function public.dating_public_directory()
returns table(id uuid,name text,age integer,borough text,intention text,interests text[])
language sql stable security definer set search_path='' as $$
 select p.id,p.name,p.age,p.borough,p.intention,p.interests
 from public.dating_profiles p
 where p.public_intro and p.visible
 and (auth.uid() is null or not exists(select 1 from public.dating_blocks b where
 (b.sender=auth.uid() and b.recipient=p.id) or (b.recipient=auth.uid() and b.sender=p.id)))
 order by p.borough,p.name,p.id;
$$;
revoke all on function public.dating_public_directory() from public;
grant execute on function public.dating_public_directory() to anon,authenticated;
commit;
