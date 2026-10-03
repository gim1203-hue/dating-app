import {spawnSync} from 'node:child_process';
const result=spawnSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',windowsHide:true,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'}});
const credential=Object.fromEntries(result.stdout.trim().split(/\r?\n/).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)]}));
if(result.status!==0||!credential.password)throw Error('Saved GitHub credential unavailable.');
async function pages(method='GET',body){
 const response=await fetch('https://api.github.com/repos/gim1203-hue/dating-app/pages',{method,headers:{Authorization:`Bearer ${credential.password}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 if(!response.ok)throw Error(`Pages request failed (${response.status}).`);
 return response.status===204?null:response.json();
}
const before=await pages();
console.log(JSON.stringify({before:{cname:before.cname,build_type:before.build_type,html_url:before.html_url}}));
await pages('PUT',{cname:null,build_type:'workflow'});
const after=await pages();
console.log(JSON.stringify({after:{cname:after.cname,build_type:after.build_type,html_url:after.html_url}}));
if(after.cname)throw Error('Custom domain was not cleared.');
