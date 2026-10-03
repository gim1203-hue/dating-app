import {readFileSync} from 'node:fs';
const env=Object.fromEntries(readFileSync('.env.local','utf8').replace(/^\uFEFF/,'').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]}));
const headers={apikey:env.VITE_SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}`,'Content-Type':'application/json'};
const directory=await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/rpc/dating_public_directory`,{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(15000)});
const data=await directory.json();console.log(directory.ok?`Public directory available; ${data.length} opted-in introductions.`:`Public directory unavailable: HTTP ${directory.status}, code ${data.code||'unknown'}`);
const settings=await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/settings`,{headers,signal:AbortSignal.timeout(15000)});
if(settings.ok){const s=await settings.json();console.log(JSON.stringify({signup_disabled:s.disable_signup,email_signup_enabled:s.external?.email,email_autoconfirm:s.mailer_autoconfirm}));}
