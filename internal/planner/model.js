export const TIERS = ['manager', 'professional', 'executive'];
export const TIER_INFO = {
  manager: {name:'Manager', family:'ManagedCAER', subtitle:'Everyday IT, fully managed', description:'Managed endpoints, business-hours remote support, M365 administration and a business-grade security foundation.'},
  professional: {name:'Professional', family:'SecureCAER', subtitle:'Security & compliance assistance', description:'Manager coverage plus advanced security controls, policy guidance, risk assessment assistance and backup validation.'},
  executive: {name:'Executive', family:'SecureCAER', subtitle:'Governance & strategic oversight', description:'Professional coverage plus executive reporting, vendor coordination, continuity testing and governance planning.'}
};
export const TYPES = {computer:'Computers', mobile:'Mobile devices', network:'Network devices', server:'Servers'};
const service = (id,name,category,scope,min,note='') => ({id,name,category,scope,note,coverage:Object.fromEntries(TIERS.map((t,i)=>[t,min === null ? 'scope' : i>=min ? 'included' : 'excluded']))});
export const CATALOG = [
  service('rmm','Endpoint monitoring / RMM','Managed IT','computer',0,'24/7 monitoring and alerting; this does not mean a 24/7 helpdesk.'),
  service('inventory','Asset inventory','Managed IT','computer',0),
  service('health','Device health checks','Managed IT','computer',0),
  service('patch','Patch management','Managed IT','computer',0,'OS and supported third-party software.'),
  service('helpdesk','Business-hours remote helpdesk','Managed IT','client',0,'Response commitments follow Appendix B and the signed SOW.'),
  service('m365','Microsoft 365 administration','Managed IT','user',0,'Tenant and account administration. Microsoft licenses are separate.'),
  service('reporting','Service reporting & alert review','Managed IT','client',0),
  service('qbr','Quarterly business review','Managed IT','client',0),
  service('lob','Business application support','Managed IT','client',0,'Best effort; subject to vendor availability and SOW limits.'),
  service('networkmonitor','Network monitoring','Managed IT','client',0,'Monitoring only. Configuration and security management use the separately scoped NetCAER module.'),
  service('edr','Endpoint security / EDR','Security','computer',0),
  service('antivirus','Managed antivirus','Security','computer',0),
  service('backup','Managed backup & recovery','Continuity','computer',0,'Define data, retention and recovery scope. Storage and licensing costs are separate.'),
  service('backupmonitor','Backup monitoring','Continuity','computer',0),
  service('dns','DNS / web filtering','Security','computer',1),
  service('email','Email security','Security','user',1),
  service('sat','Security awareness training','Security','user',1),
  service('darkweb','Credential exposure monitoring','Security','user',1),
  service('vulnerability','Vulnerability scanning','Security','computer',1),
  service('mfa','MFA guidance & enforcement','Security','user',1),
  service('policy','Security policy guidance','Compliance','client',1,'Assistance within an agreed framework and SOW.'),
  service('risk','Risk assessment assistance','Compliance','client',1,'Assistance is not an audit or certification.'),
  service('insurance','Cyber insurance readiness','Compliance','client',1),
  service('validation','Backup validation & DR planning','Continuity','client',1),
  service('executivereport','Executive reporting','Governance','client',2),
  service('vendors','Expanded vendor coordination','Governance','client',2),
  service('advancedbackup','Advanced restore testing / RTO & RPO','Governance','client',2,'Define recovery objectives and test schedule in the SOW.'),
  service('governance','Governance planning','Governance','client',2),
  service('netcaer','NetCAER network management','Separate scope','network',null,'List firewalls, switches and APs in the SOW. Service level follows the chosen family; price separately.'),
  service('mdm','Mobile device management','Separate scope','mobile',null,'Appendix A describes management levels; enrollment, licensing and billing scope must be confirmed.'),
  service('servers','Server management & backup','Separate scope','server',null,'Server workload, applications, backup and recovery terms need a separate scope.'),
  service('afterhours','24/7 helpdesk / after-hours support','Separate scope','client',null,'Define provider, hours, response targets and recurring price.'),
  service('onsite','Onsite support','Separate scope','project',null,'Separately quote visits or an onsite allowance.'),
  service('migration','Migrations / project work','Separate scope','project',null,'Separate project approval and one-time quote.'),
  service('audit','Compliance audit / certification','Separate scope','project',null,'Requires separately defined professional scope; not guaranteed by any tier.'),
  service('incident','Forensics / extended incident response','Separate scope','project',null,'Beyond standard remediation; separately defined scope and price.')
];
export const DEFAULT_NEEDS = ['helpdesk','m365','patch','edr','backup'];
export function newState(example=false) {
  return {schemaVersion:1,prospect:{name:example?'Hill Country Design (example)':'',industry:example?'Architecture & design':'',users:example?8:0,computer:example?6:0,mobile:0,network:example?3:0,server:0,compliance:'none',notes:'',example},
    needs:example?[...DEFAULT_NEEDS,'email','mfa','sat','netcaer']:[...DEFAULT_NEEDS],selectedTier:'manager',addons:[],devices:[],catalog:structuredClone(CATALOG),
    rates:{manager:75,professional:135,executive:null,mobile:null,network:null,server:null},addonPrices:{}};
}
export function money(value) {return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(value);}
export function requiredIds(state) {
  const ids = new Set(state.needs);
  if (state.prospect.compliance!=='none') ['policy','risk','mfa'].forEach(x=>ids.add(x));
  for (const [type,id] of [['mobile','mdm'],['network','netcaer'],['server','servers']]) if (state.prospect[type]>0) ids.add(id);
  return [...ids];
}
export function inventory(state) {
  return Object.fromEntries(Object.keys(TYPES).map(type=>{const rows=state.devices.filter(d=>d.type===type),excluded=rows.filter(d=>!d.covered).length; return [type,{total:state.prospect[type]||0,listed:rows.length,excluded,covered:Math.max(0,(state.prospect[type]||0)-excluded),unlisted:Math.max(0,(state.prospect[type]||0)-rows.length)}];}));
}
export function inputErrors(state) {
  const errors=[];
  for(const k of ['users',...Object.keys(TYPES)]) if(!Number.isInteger(state.prospect[k])||state.prospect[k]<0||state.prospect[k]>9999) errors.push(`Enter a whole number from 0 to 9,999 for ${k==='users'?'users':TYPES[k].toLowerCase()}.`);
  for(const [type,v] of Object.entries(inventory(state))) if(v.listed>v.total) errors.push(`${v.listed} named ${TYPES[type].toLowerCase()} exceed the declared total of ${v.total}. Update the total or remove a row.`);
  for(const [k,v] of Object.entries({...state.rates,...state.addonPrices})) if(v!==null&&(!Number.isFinite(v)||v<0||v>1000000)) errors.push(`Enter a valid non-negative rate for ${k}.`);
  for(const d of state.devices) if(!d.name.trim())errors.push('Each named device needs a name.');
  return errors;
}
export function statusFor(state,id,tier=state.selectedTier) {
  const item=state.catalog.find(s=>s.id===id);
  if(item.coverage[tier]==='included') return 'included';
  return state.addons.includes(id)?'scoped':item.coverage[tier];
}
export function compare(state,tier) {
  const ids=requiredIds(state),covered=ids.filter(id=>['included','scoped'].includes(statusFor(state,id,tier))),gaps=ids.filter(id=>!covered.includes(id));
  return {tier,total:ids.length,covered:covered.length,gaps,percent:ids.length?Math.round(covered.length/ids.length*100):100};
}
export function recommendation(state) {
  const core=requiredIds(state).filter(id=>state.catalog.find(s=>s.id===id).scope!=='project'&&state.catalog.find(s=>s.id===id).coverage && TIERS.some(t=>state.catalog.find(s=>s.id===id).coverage[t]==='included'));
  const floor=state.prospect.compliance==='none'?0:1;
  const eligible=TIERS.slice(floor);
  return eligible.find(t=>core.every(id=>['included','scoped'].includes(statusFor(state,id,t)))) || [...eligible].sort((a,b)=>compare(state,b).covered-compare(state,a).covered)[0];
}
export function estimate(state,tier=state.selectedTier) {
  const inv=inventory(state),lines=[],unquoted=[];
  for(const type of Object.keys(TYPES)) {
    const qty=inv[type].covered;if(!qty) continue;
    const rate=type==='computer'?state.rates[tier]:state.rates[type];
    if(rate===null) unquoted.push(`${TYPES[type]} (${qty})`); else lines.push({label:type==='computer'?`${TIER_INFO[tier].name} computers`:TYPES[type],qty,rate,total:Math.round(qty*rate*100)/100});
  }
  for(const id of requiredIds(state).filter(id=>statusFor(state,id,tier)==='scoped')) {
    const s=state.catalog.find(s=>s.id===id);
    if(['mobile','network','server'].includes(s.scope)) continue;
    if(s.scope==='project') {unquoted.push(`${s.name} (separate quote)`);continue;}
    const rate=state.addonPrices[id]??null;
    if(rate===null) unquoted.push(s.name); else lines.push({label:s.name,qty:1,rate,total:rate});
  }
  return {lines,unquoted,total:Math.round(lines.reduce((n,l)=>n+l.total,0)*100)/100};
}
export function deviceControls(state,device) {
  if(!device.covered)return [];
  return state.catalog.filter(s=>s.scope===device.type&&['included','scoped'].includes(statusFor(state,s.id))&&(!['mobile','network','server'].includes(device.type)||requiredIds(state).includes(s.id)));
}
export function verification(state) {
  let required=0,verified=0;
  for(const d of state.devices) for(const s of deviceControls(state,d)) {required++;if(d.verified.includes(s.id))verified++;}
  return {required,verified,missing:required-verified,percent:required?Math.round(verified/required*100):null};
}
export function issues(state) {
  const inv=inventory(state),out=[];
  compare(state,state.selectedTier).gaps.forEach(id=>out.push({kind:'scope',text:`${state.catalog.find(s=>s.id===id).name}: not covered in this configuration.`}));
  for(const [type,v] of Object.entries(inv)) {
    if(v.excluded)out.push({kind:'device',text:`${v.excluded} ${TYPES[type].toLowerCase()} excluded from the proposed agreement; no CAER coverage planned.`});
    if(v.unlisted)out.push({kind:'inventory',text:`${v.unlisted} ${TYPES[type].toLowerCase()} still need names, enrollment and control verification.`});
  }
  const v=verification(state);if(v.missing)out.push({kind:'verify',text:`${v.missing} planned device controls are not yet verified on named covered devices.`});
  if(state.prospect.compliance!=='none'&&state.selectedTier==='manager')out.push({kind:'scope',text:'Compliance assistance calls for SecureCAER. Manager does not include a compliance engagement unless separately agreed.'});
  if(!state.prospect.users&&requiredIds(state).some(id=>state.catalog.find(s=>s.id===id).scope==='user')) out.push({kind:'inventory',text:'User services are selected with zero users. Confirm the account count.'});
  if(!inv.computer.covered) out.push({kind:'quote',text:'No covered computers. Define a standalone service scope before quoting an endpoint tier.'});
  estimate(state).unquoted.forEach(x=>out.push({kind:'quote',text:`Price to confirm: ${x}.`}));
  return out;
}
export function summaryText(state) {
  const errors=inputErrors(state);if(errors.length)throw new Error(errors.join('\n'));
  const recTier=recommendation(state),selected=TIER_INFO[state.selectedTier],rec=TIER_INFO[recTier],inv=inventory(state),e=estimate(state),fit=compare(state,state.selectedTier),recEstimate=estimate(state,recTier),recFit=compare(state,recTier);
  const byStatus=status=>requiredIds(state).filter(id=>statusFor(state,id)===status).map(id=>state.catalog.find(s=>s.id===id).name);
  return ['CAER TECHNOLOGIES | SERVICE CONFIGURATION','Planning draft — confirm rates, scope and signed SOW.',`Prepared: ${new Date().toLocaleDateString('en-US')}`,'',`Prospect: ${state.prospect.name||'Unnamed prospect'}${state.prospect.example?' [ILLUSTRATIVE EXAMPLE]':''}`,`Industry: ${state.prospect.industry||'Not supplied'}`,`Users: ${state.prospect.users}`,`Compliance assistance: ${state.prospect.compliance}`,'','RECOMMENDED CONFIGURATION',`${rec.family} / ${rec.name} for ${inv.computer.covered} covered computers and ${state.prospect.users} users.`,`${recEstimate.unquoted.length?'Known recurring subtotal':'Estimated recurring services'}: ${money(recEstimate.total)}; licensing, storage and one-time fees excluded.`,...recFit.gaps.map(id=>`• Add or agree separate scope: ${state.catalog.find(s=>s.id===id).name}.`),...requiredIds(state).filter(id=>statusFor(state,id,recTier)==='scoped').map(id=>`• Confirm proposed separate scope: ${state.catalog.find(s=>s.id===id).name}.`),...recEstimate.unquoted.map(x=>`• Obtain price: ${x}.`),...(inv.computer.excluded?[`• Enroll or document responsibility for ${inv.computer.excluded} excluded computers.`]:[]),'','SELECTED CONFIGURATION REVIEW',`Recommended starting tier: ${rec.family} / ${rec.name}`,`Selected configuration: ${selected.family} / ${selected.name}`,`Required-service coverage: ${fit.covered} of ${fit.total} (${fit.percent}%)`,...Object.entries(inv).map(([type,v])=>`${TYPES[type]}: ${v.total} total; ${v.covered} proposed covered; ${v.excluded} excluded; ${v.unlisted} unnamed`),'','INCLUDED REQUIREMENTS',...byStatus('included').map(x=>`• ${x}`),'','SEPARATE SCOPE IN CONFIGURATION',...byStatus('scoped').map(x=>`• ${x}`),'','UNCOVERED REQUIREMENTS',...(fit.gaps.length?fit.gaps.map(id=>`• ${state.catalog.find(s=>s.id===id).name}`):['None at service-scope level. Delivery and enrollment still require verification.']),'','KNOWN MONTHLY SERVICE ESTIMATE',...e.lines.map(l=>`• ${l.label}: ${l.qty} × ${money(l.rate)} = ${money(l.total)}`),`${e.unquoted.length?'Known subtotal':'Estimated monthly services'}: ${money(e.total)}`,...e.unquoted.map(x=>`• Additional price required: ${x}`),'Licenses, backup storage, hardware, taxes, projects and onboarding are excluded from this estimate.','Rates start from the September 1 service matrix ($75 / Manager computer; $135 / Professional computer). Review them before quoting. Executive and other asset rates require a quote.','','FOLLOW-UP ACTIONS',...issues(state).map(x=>`• ${x.text}`),'','NAMED DEVICE VIEW',...state.devices.map(d=>`${d.name} [${TYPES[d.type]}] — ${d.covered?'planned covered':'excluded'}; ${deviceControls(state,d).filter(s=>d.verified.includes(s.id)).length}/${deviceControls(state,d).length} planned controls verified${d.notes?`; ${d.notes}`:''}`),'',`Notes: ${state.prospect.notes||'None'}`,'','Scope reference: Appendix A-2026 and Appendix C-2026 (v1.3, September 25), plus CAER_Client_Service_Matrix (September 1). ManagedCAER is labeled ManageCAER in the source documents.','A separate scope selection is a proposed configuration, not an executed agreement. Compliance support is assistance, not a certification or guarantee.'].join('\n');
}
export function validateImport(raw,{allowDraftErrors=false}={}) {
  if(!raw||raw.schemaVersion!==1)throw new Error('This is not a CAER planner version 1 export.');
  const base=newState(),p=raw.prospect;
  if(!p||typeof p.name!=='string'||typeof p.industry!=='string'||typeof p.notes!=='string'||![p.name,p.industry,p.notes].every(x=>x.length<=5000)||!['none','HIPAA','Other framework'].includes(p.compliance))throw new Error('Invalid prospect details.');
  const ids=new Set(CATALOG.map(s=>s.id));
  for(const list of [raw.needs,raw.addons])if(!Array.isArray(list)||list.length>CATALOG.length||!list.every(id=>ids.has(id)))throw new Error('Invalid service requirements.');
  if(!TIERS.includes(raw.selectedTier)||!Array.isArray(raw.catalog)||raw.catalog.length!==CATALOG.length||new Set(raw.catalog.map(s=>s.id)).size!==CATALOG.length)throw new Error('Invalid tier catalog.');
  base.catalog=CATALOG.map(def=>{const s=raw.catalog.find(x=>x.id===def.id);if(!s||!TIERS.every(t=>['included','scope','excluded'].includes(s.coverage?.[t])))throw new Error('Invalid tier coverage.');return {...structuredClone(def),coverage:{...s.coverage}};});
  if(!Array.isArray(raw.devices)||raw.devices.length>500)throw new Error('Invalid device inventory (maximum 500 rows).');
  base.devices=raw.devices.map(d=>{if(typeof d.name!=='string'||(!allowDraftErrors&&!d.name.trim())||d.name.length>200||!Object.hasOwn(TYPES,d.type)||typeof d.covered!=='boolean'||!Array.isArray(d.verified)||!d.verified.every(id=>ids.has(id))||typeof d.notes!=='string'||d.notes.length>2000)throw new Error('Invalid device row.');return {id:crypto.randomUUID(),name:d.name,type:d.type,covered:d.covered,verified:[...new Set(d.verified)],notes:d.notes};});
  base.prospect={...base.prospect,...Object.fromEntries(Object.keys(base.prospect).map(k=>[k,Object.hasOwn(p,k)?p[k]:base.prospect[k]]))};
  base.prospect.example=!!p.example;base.needs=[...new Set(raw.needs)];base.addons=[...new Set(raw.addons)];base.selectedTier=raw.selectedTier;
  if(!raw.rates)throw new Error('Missing rates.');
  for(const k of Object.keys(base.rates)) {if(!Object.hasOwn(raw.rates,k))throw new Error('Missing rate.');base.rates[k]=raw.rates[k];}
  base.addonPrices={};for(const [k,v]of Object.entries(raw.addonPrices||{})){if(!ids.has(k))throw new Error('Unknown add-on.');base.addonPrices[k]=v;}
  for(const k of ['users',...Object.keys(TYPES)])if(base.prospect[k]!==null&&typeof base.prospect[k]!=='number')throw new Error('Invalid asset count.');
  for(const v of Object.values({...base.rates,...base.addonPrices}))if(v!==null&&typeof v!=='number')throw new Error('Invalid rate.');
  const errors=inputErrors(base);if(errors.length&&!allowDraftErrors)throw new Error(errors[0]);
  return base;
}
