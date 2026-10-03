export const boroughs=['Bronx','Brooklyn','Manhattan','Queens','Staten Island'];
export const intentions=['Casual dating','Long-term relationship','Open to possibilities'];
export const genders=['Woman','Man','Nonbinary','Prefer not to say'];
export const interests=['Coffee','Live music','Art','Cooking','Movies','Fitness','Travel','Dancing','Photography','Gaming','Reading','Food adventures','Outdoors','Comedy','Pets'];
export const blankProfile={name:'',age:25,borough:'Bronx',bio:'',neighborhood:'',intention:'Open to possibilities',gender:'Prefer not to say',interested_in:['Everyone'],interests:[],public_intro:false,video_path:null,photo_paths:[],available_until:null,visible:true};
export function isAvailable(profile,now=Date.now()){return !!profile.available_until && new Date(profile.available_until).getTime()>now}
export function compatible(a,b){const accepts=(p,g)=>!p.interested_in?.length||p.interested_in.includes('Everyone')||p.interested_in.includes(g||'Prefer not to say');return accepts(a,b.gender)&&accepts(b,a.gender)}
export function filterProfiles(people,profile,filters,now=Date.now()){
 return people.filter(p=>p.visible!==false&&compatible(profile,p)&&(filters.borough==='All NYC'||p.borough===filters.borough)&&(filters.intention==='All intentions'||p.intention===filters.intention)&&p.age>=filters.minAge&&p.age<=filters.maxAge&&(!filters.tonight||isAvailable(p,now))&&`${p.name} ${p.neighborhood||''} ${p.bio} ${(p.interests||[]).join(' ')}`.toLowerCase().includes(filters.query.toLowerCase()));
}
export function validateProfile(p){if(!p.name.trim()||p.name.trim().length>40)throw Error('Enter a name between 1 and 40 characters.');if(!Number.isInteger(Number(p.age))||p.age<18||p.age>100)throw Error('Age must be between 18 and 100.');if(!p.interested_in.length)throw Error('Choose who you would like to meet.');return p}
