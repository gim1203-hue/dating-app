-- Run only after reviewing and approving the owner's administrator access.
-- Requires the existing owner account to be confirmed; never creates a login or password.
do $$
declare owner_id uuid;
begin
 select id into owner_id from auth.users where lower(email)='gimrankhan1203@gmail.com' and email_confirmed_at is not null;
 if owner_id is null then raise exception 'Create and confirm gimrankhan1203@gmail.com before activating administrator access'; end if;
 insert into public.dating_admins(id) values(owner_id) on conflict(id) do nothing;
end; $$;
