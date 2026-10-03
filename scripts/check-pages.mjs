const repo='gim1203-hue/dating-app';
const headers={Accept:'application/vnd.github+json','User-Agent':'After-Hours-deployment-check'};
const result=await fetch(`https://api.github.com/repos/${repo}/actions/runs?head_sha=e45444c&per_page=5`,{headers,signal:AbortSignal.timeout(15000)});
const data=await result.json();
if(!result.ok)throw Error(`GitHub deployment lookup failed: ${result.status}`);
for(const r of data.workflow_runs||[])console.log(JSON.stringify({id:r.id,name:r.name,status:r.status,conclusion:r.conclusion,url:r.html_url}));
const site=await fetch('https://gim1203-hue.github.io/dating-app/',{signal:AbortSignal.timeout(15000)});
console.log(`Public website HTTP status: ${site.status}`);
if(site.ok){const html=await site.text();console.log(`Website title present: ${html.includes('After Hours NYC')}`);const assets=[...html.matchAll(/(?:src|href)="(\/dating-app\/assets\/[^\"]+)"/g)].map(m=>m[1]);for(const asset of assets){const r=await fetch(`https://gim1203-hue.github.io${asset}`,{signal:AbortSignal.timeout(15000)});console.log(`Asset ${asset}: ${r.status}`)}}
