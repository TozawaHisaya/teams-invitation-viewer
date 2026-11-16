const TIVDetails=(()=>{
const days=['SU','MO','TU','WE','TH','FR','SA'], jp=['日','月','火','水','木','金','土'];
const dayfmt=t=>new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'}).format(t);
function recurrence(e,now=Date.now()){
 const r=Object.fromEntries(e.rule.split(';').filter(x=>x.includes('=')).map(x=>x.split('='))); const labels=(r.BYDAY||'').split(',').filter(x=>days.includes(x));
 const until=r.UNTIL?TIV.date({key:'UNTIL',value:r.UNTIL}):null;
 const result={label:labels.map(x=>jp[days.indexOf(x)]).join('・'),until,next:null};
 // Only Tokyo-local or UTC series: avoid incorrect DST predictions.
 if(!e.rule||e.cancel||e.exceptions||e.start===null||!['DAILY','WEEKLY'].includes(r.FREQ)||Object.keys(r).some(k=>!['FREQ','INTERVAL','BYDAY','UNTIL','COUNT','WKST'].includes(k))|| (r.INTERVAL&&r.INTERVAL!=='1')||r.COUNT|| (r.UNTIL&&until===null)||!( /Z$/.test(e.startRaw?.value||'')||/TZID=(?:Asia\/Tokyo|Tokyo Standard Time)(?:;|$)/i.test(e.startRaw?.key||''))|| (r.BYDAY&&labels.length!==r.BYDAY.split(',').length))return result;
 const utc=/Z$/.test(e.startRaw.value); const offset=utc?0:32400000; const allowed=labels.length?labels:r.FREQ==='WEEKLY'?[days[new Date(e.start+offset).getUTCDay()]]:days;
 let t=e.start+Math.max(0,Math.floor((now-e.start)/86400000))*86400000;
 for(let i=0;i<8;i++,t+=86400000){if(until!==null&&t>until)break;if(t>=now&&allowed.includes(days[new Date(t+offset).getUTCDay()])){result.next=t;break}}return result;
}
function warnings(text,e){const out=[];const seen=new Set();if(e.start===null)return out;const base=TIV.clock(e.start);const mins=s=>+s.slice(0,2)*60+ +s.slice(3);for(const m of text.normalize('NFKC').matchAll(/(?:\d{1,2}\s*月\s*\d{1,2}\s*日|\d{1,2}\/\d{1,2})?\s*(?:より|から)?\s*(\d{1,2})\s*[:：時]\s*(\d{2})\s*分?\s*(?:より|から)?\s*開始/g)){if(+m[1]>23||+m[2]>59)continue;const time=m[1].padStart(2,'0')+':'+m[2];if(time===base||seen.has(time))continue;seen.add(time);out.push({time,diff:mins(time)-mins(base),excerpt:m[0].trim()})}return out;}
function priority(url){
 const path=new URL(url).pathname.toLowerCase();
 return path.startsWith("/meet/")?0:path.startsWith("/l/meetup-join/")?1:2;
}
function links(text){
 const found=new Map();
 for(const raw of text.match(/https:\/\/(?:teams\.microsoft\.com|teams\.live\.com|teams\.cloud\.microsoft)\/(?:l\/meetup-join|meet|join)\/[^\s<>"'\\]+/gi)||[]){
  try{
   const clean=raw.replace(/&(?:amp|#38|#x26);/gi,'&').replace(/&(?:quot|#34|#x22|lt|gt);.*$/i,'').replace(/[).,;]+$/,'');
   const u=new URL(clean);if(!['teams.microsoft.com','teams.live.com','teams.cloud.microsoft'].includes(u.hostname)||u.username||u.password||u.port)continue;
   const norm=v=>v.replace(/%[0-9a-f]{2}/gi,m=>{const c=String.fromCharCode(parseInt(m.slice(1),16));return /[A-Za-z0-9._~-]/.test(c)?c:m.toUpperCase()});
   let path=norm(u.pathname);
   if(path.startsWith('/l/meetup-join/')){try{path=decodeURIComponent(path)}catch{}}
   const params=[...u.searchParams.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
   const key=JSON.stringify([u.hostname,path,params,u.hash]);
   if(!found.has(key))found.set(key,u.href);
  }catch{}
 }return [...found.values()].sort((a,b)=>priority(a)-priority(b));
}
return {recurrence,warnings,links,dayfmt};})();
if(typeof module!=='undefined')module.exports=TIVDetails;
