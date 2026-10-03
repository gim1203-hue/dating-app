import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',C='33333333-3333-4333-8333-333333333333';
test('admin privileges, scoped member information, support isolation and suspension are enforced by the database',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,created_at timestamptz default now(),email_confirmed_at timestamptz,last_sign_in_at timestamptz,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;grant usage on schema storage to authenticated;grant select,insert,delete on storage.objects to authenticated;`);
 for(const file of ['schema','upgrade','media','growth','admin'])await db.exec((await readFile(`supabase/${file}.sql`,'utf8')).replace(/^\uFEFF/,''));
 for(const [id,email] of [[A,'owner@example.com'],[B,'member@example.com'],[C,'learnflow@example.com']])await db.query('insert into auth.users(id,email) values($1,$2)',[id,email]);
 await db.query('insert into public.dating_admins values($1)',[A]);
 async function asUser(id){await db.exec(`reset role;select set_config('request.jwt.claim.sub','${id}',false);set role authenticated`)}
 await asUser(A);await db.query("insert into public.dating_profiles(id,name,age,borough) values($1,'Owner',30,'Queens')",[A]);
 await asUser(B);await db.query("insert into public.dating_profiles(id,name,age,borough,public_intro) values($1,'Member',25,'Bronx',true)",[B]);
 assert.equal((await db.query('select public.dating_is_admin() as allowed')).rows[0].allowed,false);
 await assert.rejects(db.query('insert into public.dating_admins values($1)',[B]));
 await assert.rejects(db.query('select public.dating_admin_members()'));
 await assert.rejects(db.query('select public.dating_admin_suspend($1,true,$2)',[A,'bad']));
 await db.query("insert into public.dating_support_messages(member_id,author_id,body) values($1,$1,'Please help')",[B]);
 await assert.rejects(db.query("insert into public.dating_support_messages(member_id,author_id,body) values($1,$2,'Fake admin')",[B,A]));
 await db.query("insert into storage.objects(bucket_id,name) values('dating-photos',$1)",[`${B}/private.jpg`]);
 await db.query('update public.dating_profiles set visible=false,photo_paths=$1 where id=$2',[[`${B}/private.jpg`],B]);
 await asUser(C);assert.equal((await db.query('select * from public.dating_support_messages')).rows.length,0);
 assert.equal((await db.query('select * from storage.objects')).rows.length,0);
 await assert.rejects(db.query("insert into public.dating_support_messages(member_id,author_id,body) values($1,$2,'Other inbox')",[B,C]));
 await asUser(A);assert.equal((await db.query('select * from storage.objects')).rows.length,1);
 await db.query('insert into public.dating_likes values($1,$2)',[A,B]);
 await asUser(B);await db.query('insert into public.dating_likes values($1,$2)',[B,A]);
 await db.query('update public.dating_profiles set visible=true where id=$1',[B]);
 assert.equal((await db.query('select public.dating_can_chat($1,$2) as allowed',[B,A])).rows[0].allowed,true);
 await asUser(A);let members=(await db.query('select public.dating_admin_members() as data')).rows[0].data;
 assert.equal(members.total,2);assert.equal(members.members.find(m=>m.id===B).email,'member@example.com');assert.equal(members.members.some(m=>m.id===C),false);
 await db.query("insert into public.dating_support_messages(member_id,author_id,body) values($1,$2,'Happy to help')",[B,A]);
 await db.query('select public.dating_admin_suspend($1,true,$2)',[B,'Review required']);
 await assert.rejects(db.query('select public.dating_admin_suspend($1,true,$2)',[C,'Unrelated user']));
 await assert.rejects(db.query('select public.dating_admin_suspend($1,true,$2)',[A,'Self']));
 await asUser(B);assert.equal((await db.query('select * from public.dating_support_messages')).rows.length,2);
 assert.equal((await db.query('select public.dating_has_profile() as available')).rows[0].available,false);
 assert.equal((await db.query('select public.dating_can_chat($1,$2) as allowed',[B,A])).rows[0].allowed,false);
 await assert.rejects(db.query("insert into public.dating_messages(sender,recipient,body) values($1,$2,'Blocked by suspension')",[B,A]));
 assert.equal((await db.query('select * from public.dating_public_directory()')).rows.length,0);
 assert.equal((await db.query("update public.dating_profiles set visible=true where id=$1 returning id",[B])).rows.length,0);
 await assert.rejects(db.query('delete from public.dating_suspensions where member_id=$1',[B]));
 await asUser(A);await db.query('select public.dating_admin_suspend($1,false,$2)',[B,'']);
 await asUser(B);assert.equal((await db.query('select public.dating_has_profile() as available')).rows[0].available,true);
 await db.exec('reset role;set role anon');await assert.rejects(db.query('select public.dating_admin_members()'));await assert.rejects(db.query('select * from public.dating_support_messages'));
 }finally{await db.close()}
});
