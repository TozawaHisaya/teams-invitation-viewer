const assert=require('node:assert/strict'),p=require('./parser');const event=(start,end,method='REQUEST')=>p.parse(`BEGIN:VCALENDAR\nMETHOD:${method}\nBEGIN:VEVENT\nDTSTART${start}\nDTEND${end}\nEND:VEVENT\nEND:VCALENDAR`)[0];let e=event(':20261118T050000Z',':20261118T060000Z');assert.equal(e.start,Date.UTC(2026,10,18,5));assert.equal(p.compare('13:00 ～ 14:00',e).state,'mismatch');assert.equal(p.compare('14:00 ～ 15:00',e).state,'match');assert.equal(p.compare('不明',e).state,'unknown');assert.equal(event(';TZID=Tokyo Standard Time:20261118T140000',';TZID=Asia/Tokyo:20261118T150000').start,e.start);assert.equal(event(':20261118T140000',':20261118T150000').start,null);assert.equal(event(':20261118T050000Z',':20261118T060000Z','CANCEL').cancel,true);console.log('7 checks passed');
global.TIV=p;const d=require('./details');const r=p.parse('BEGIN:VCALENDAR\nBEGIN:VEVENT\nDTSTART;TZID=Tokyo Standard Time:20260901T103000\nDTEND;TZID=Tokyo Standard Time:20260901T110000\nRRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=20261130T023000Z\nDESCRIPTION:皆様\\nなお、ST定例は10/5より11:30開始とします。\nEND:VEVENT\nEND:VCALENDAR')[0];assert.equal(d.warnings(r.description,r)[0].diff,60);assert.equal(d.recurrence(r,Date.UTC(2026,10,16,6)).next,Date.UTC(2026,10,17,1,30));assert.equal(d.recurrence(r,Date.UTC(2026,11,1)).next,null);assert.equal(d.recurrence({...r,exceptions:true}).next,null);assert.equal(d.links('https://teams.microsoft.com/meet/123?p=abc').length,1);assert.equal(d.warnings('10:30開始',r).length,0);console.log('6 additional checks passed');

const base='https://teams.microsoft.com/meet/123';
assert.equal(d.links(`${base}?p=abc&x=1 ${base}?x=1&amp;p=abc`).length,1);
assert.equal(d.links(`${base}?p=%61bc ${base}?p=abc`).length,1);
assert.equal(d.links(`${base}?p=abc ${base}?p=def`).length,2);
assert.equal(d.links(`${base}?p=abc https://teams.microsoft.com/meet/456?p=abc`).length,2);
assert.equal(d.links('https://teams.microsoft.com/l/meetup-join/19%3ameeting%40thread.v2/0 https://teams.microsoft.com/l/meetup-join/19:meeting@thread.v2/0').length,1);

console.log('5 link checks passed');

const long='https://teams.microsoft.com/l/meetup-join/19%3ameeting%40thread.v2/0?context=%7B%7D';
const short=base+'?p=abc';
assert.deepEqual(d.links(long+' '+short),[short,long]);
assert.deepEqual(d.links(short+' '+long),[short,long]);
assert.deepEqual(d.links(long),[long]);
assert.deepEqual(d.links(short),[short]);
assert.equal(d.links(long+' '+short+' '+base+'?p=def').length,3);
console.log('5 priority checks passed');
