import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',C='33333333-3333-4333-8333-333333333333';
test('database migrations enforce ownership, mutual chat, blocking, photo privacy and profile removal',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1,'/') $$;grant usage on schema storage to authenticated;grant select,insert,delete on storage.objects to authenticated;`);
 await db.exec(await readFile('supabase/schema.sql','utf8'));
 await db.exec(await readFile('supabase/upgrade.sql','utf8'));
 await db.exec(`insert into auth.users values('${A}'),('${B}'),('${C}');`);
 async function asUser(id){await db.exec(`reset role;select set_config('request.jwt.claim.sub','${id}',false);set role authenticated;`)}
 for(const [id,name] of [[A,'A'],[B,'B'],[C,'C']]){await asUser(id);await db.query("insert into public.dating_profiles(id,name,age,borough) values($1,$2,25,'Bronx')",[id,name])}
 await asUser(A);await assert.rejects(db.query("insert into public.dating_messages(sender,recipient,body) values($1,$2,'Hello')",[A,B]));
 await assert.rejects(db.query("insert into public.dating_likes(sender,recipient) values($1,$2)",[B,C]));
 await db.query('insert into public.dating_likes values($1,$2)',[A,B]);
 await asUser(B);await db.query('insert into public.dating_likes values($1,$2)',[B,A]);
 await asUser(A);await db.query("insert into public.dating_messages(sender,recipient,body) values($1,$2,'Hello')",[A,B]);
 assert.equal((await db.query('select * from public.dating_messages')).rows.length,1);
 await asUser(C);assert.equal((await db.query('select * from public.dating_messages')).rows.length,0);
 assert.equal((await db.query('select public.dating_can_chat($1,$2) as allowed',[A,B])).rows[0].allowed,false);
 await asUser(A);await db.query('update public.dating_profiles set visible=false where id=$1',[A]);
 await asUser(C);assert.equal((await db.query('select * from public.dating_profiles where id=$1',[A])).rows.length,0);
 await asUser(B);assert.equal((await db.query('select * from public.dating_profiles where id=$1',[A])).rows.length,1);
 await asUser(A);await db.query("insert into storage.objects(bucket_id,name) values('dating-photos',$1)",[`${A}/one.jpg`]);
 await db.query('update public.dating_profiles set photo_paths=$1 where id=$2',[[`${A}/one.jpg`],A]);
 await assert.rejects(db.query('update public.dating_profiles set photo_paths=$1 where id=$2',[[`${B}/stolen.jpg`],A]));
 await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('dating-photos',$1)",[`${B}/fake.jpg`]));
 await asUser(B);assert.equal((await db.query('select * from storage.objects')).rows.length,1);
 await asUser(C);assert.equal((await db.query('select * from storage.objects')).rows.length,0);
 await asUser(B);await db.query('insert into public.dating_blocks values($1,$2)',[B,A]);
 assert.equal((await db.query('select * from public.dating_messages')).rows.length,0);
 assert.equal((await db.query('select * from public.dating_likes')).rows.length,0);
 assert.equal((await db.query('select * from storage.objects')).rows.length,0);
 await assert.rejects(db.query("insert into public.dating_messages(sender,recipient,body) values($1,$2,'Blocked')",[B,A]));
 await db.query('delete from public.dating_blocks where sender=$1 and recipient=$2',[B,A]);
 await db.query('select public.dating_remove_profile()');
 assert.equal((await db.query('select * from public.dating_profiles where id=$1',[B])).rows.length,0);
 await db.exec('reset role');assert.equal((await db.query('select * from auth.users where id=$1',[B])).rows.length,1);
 }finally{await db.close()}
});
