import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const repo='gim1203-hue/dating-app';
const result=spawnSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',windowsHide:true,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'}});
if(result.status!==0)throw Error('No saved GitHub credential is available. Sign in to GitHub Git Credential Manager before publishing.');
const credential=Object.fromEntries(result.stdout.trim().split(/\r?\n/).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)]}));
if(!credential.password)throw Error('GitHub credential was not available.');
async function api(path,method='GET',body){
 const response=await fetch(`https://api.github.com/repos/${repo}/${path}`,{method,headers:{Authorization:`Bearer ${credential.password}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 const data=response.status===204?null:await response.json();
 if(!response.ok&&response.status!==404)throw Error(`GitHub ${method} ${path} failed (${response.status}): ${data?.message||'Request denied'}`);
 return {status:response.status,data};
}
const env=Object.fromEntries(readFileSync('.env.local','utf8').replace(/^\uFEFF/,'').split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^['"]|['"]$/g,'')]}));
const url=env.VITE_SUPABASE_URL,key=env.VITE_SUPABASE_PUBLISHABLE_KEY;
if(!url||!key)throw Error('The local Supabase public configuration is missing.');
if(!new URL(url).hostname.endsWith('.supabase.co'))throw Error('Expected a hosted Supabase URL for the public website.');
if(!key.startsWith('sb_publishable_')){let role;try{role=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role}catch{}if(role!=='anon')throw Error('Only a Supabase publishable or anon key may be used in a public build.');}
for(const [name,value] of [['VITE_SUPABASE_URL',url],['VITE_SUPABASE_PUBLISHABLE_KEY',key]]){
 const existing=await api(`actions/variables/${name}`);
 await api(existing.status===404?'actions/variables':`actions/variables/${name}`,existing.status===404?'POST':'PATCH',{name,value});
 console.log(`Configured public build variable: ${name}`);
}
const pages=await api('pages');
if(pages.status===404)await api('pages','POST',{build_type:'workflow'});
else if(pages.data.build_type!=='workflow')await api('pages','PUT',{build_type:'workflow'});
console.log('GitHub Pages is configured for Actions deployment.');
console.log('Website address: https://gim1203-hue.github.io/dating-app/');
