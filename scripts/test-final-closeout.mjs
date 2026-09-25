import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
let count = 0;
const check = (v, label) => { assert.ok(v, label); count++; };
let instant = '2026-09-25T11:59:00Z';
class TestDate extends Date { constructor(...args) { super(...(args.length ? args : [instant])); } static now() { return new Date(instant).getTime(); } }
let actor = { id: '000000000000000000000002', role: 'employee' };
let failure = '', missing = false, writes = 0, listing;
const id = '000000000000000000000001';
const fail = () => { if (failure === 'write') throw new Error('Mongo internal secret stack transaction failed'); };
const query = value => ({ sort: () => query(value), select: () => query(value), lean: async () => { fail(); return value; } });
const model = {
  create: async data => { fail(); writes++; listing = { ...data, _id: id, updatedAt: new Date(), toObject() { return data; } }; return listing; },
  findByIdAndUpdate: () => query(missing ? null : { _id: id }),
  findByIdAndDelete: () => query(missing ? null : { _id: id }),
  findOneAndUpdate: async (_filter, data) => { fail(); if (missing) return null; listing = { ...listing, ...data }; return { _id: id }; },
  find: filter => query(listing && (!filter.createdBy || filter.createdBy.$in?.includes(listing.createdBy)) && (!filter.status || filter.status === listing.status) ? [listing] : []),
};
const overrides = new Map([
  ['server-only', {}],
  ['@/lib/models/Session', { SessionModel: {} }],
  ['@/lib/models/PasswordResetToken', { PasswordResetTokenModel: {} }],
  ['@/lib/models/ReminderLog', { ReminderLogModel: {} }],
  ['@/lib/auth', { getAuthenticatedUser: async () => actor }],
  ['@/lib/mongodb', { connectToDatabase: async () => { if (failure === 'connect') throw new Error('Mongo secret connection string'); } }],
  ['@/lib/models/Opportunity', { OpportunityModel: model }],
  ['@/lib/models/Resource', { ResourceModel: model }],
  ['@/lib/models/Application', { ApplicationModel: { find: () => query([]) } }],
  ['@/lib/models/User', { UserModel: { ...model, find: filter => { if (filter.role) { check(filter.role === 'employee' && filter.status === 'Active', 'discovery keeps Active Employee predicate'); return query([{ _id: '000000000000000000000002' }]); } return query([]); } } }],
  ['@/lib/eventsRepository', Object.fromEntries(['createCalendarEvent','updateCalendarEvent','deleteCalendarEvent'].map(n => [n, async () => { fail(); return missing ? null : { id }; }]))],
]);
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const m = { exports: {} };
  vm.runInNewContext('(function(require,module,exports){'+code+'\n})', { Response, Request, Date: TestDate, URL, console, process, Intl, TextEncoder }, { filename:file })(name => {
    if (overrides.has(name)) return overrides.get(name);
    if (name.startsWith('@/')) { const p=name.slice(2); return load(p+(fs.existsSync(p+'.ts')?'.ts':'.tsx')); }
    return require(name);
  }, m, m.exports);
  cache.set(file,m.exports); return m.exports;
}
const body = { organisation:'Company', role:'Intern', location:'Auckland', closingDate:'2099-12-31', status:'Published', description:'A sufficiently long employee internship description.' };
const resource = { title:'Guide',description:'',category:'Careers',type:'Guide',featured:false,source:'Team',url:'https://www.auckland.ac.nz/guide',status:'Published' };
const event = { applicationId:id, type:'interview',title:'Interview',organisation:'Company',date:'2026-09-27',time:'10:00' };
async function call(file, method, data, kind='resources', routeId=id) {
  return load('app/api/'+file+'/route.ts')[method](new Request('http://localhost/api?kind='+kind,{method, ...(data ? {body:JSON.stringify(data),headers:{'Content-Type':'application/json'}}:{})}),{params:Promise.resolve({id:routeId})});
}
check((await call('opportunities','POST',body)).status===201,'Employee creates Published');
actor={id:'student',role:'student'};
check((await (await call('opportunities','GET')).json()).data[0].id===id,'Student discovers newly published Active Employee listing');
for (const role of ['admin','superadmin']) {
  actor={id:'actor',role}; const before=writes;
  for (const status of ['Draft','Published','Closed']) {
    check((await call('opportunities','POST',{...body,status})).status===403,role+' modern create rejected');
    check((await call('admin/content','POST',{...body,status},'opportunities')).status===403,role+' legacy create rejected');
  }
  check(writes===before,'denied creates never write');
  check((await call('opportunities/'+ '[id]','PATCH',{...body,status:'Closed'})).status===200,role+' closes existing listing');
  check(listing.createdBy==='000000000000000000000002',role+' preserves Employee ownership');
  check((await call('admin/content/[id]','PUT',body,'opportunities')).status===200,role+' legacy management retained');
}
const cases = [
 ['events','POST',event,'student',400], ['events/[id]','PUT',event,'student',404], ['events/[id]','DELETE',null,'student',404],
 ['admin/content','POST',resource,'admin',null], ['admin/content/[id]','PUT',resource,'admin',404], ['admin/content/[id]','DELETE',null,'admin',404],
 ['admin/content/[id]','PUT',body,'admin',404,'opportunities'], ['admin/content/[id]','DELETE',null,'admin',404,'opportunities'],
 ['admin/users/[id]','PATCH',{programme:'CS',status:'Active'},'admin',403],
];
for(const [file,method,data,role,missingStatus,kind] of cases) {
  actor={id:'actor',role};
  for (const fault of file.startsWith('events') ? ['write'] : ['connect','write']) {
    failure=fault; const r=await call(file,method,data,kind); const text=await r.text();
    check(r.status===500 && r.headers.get('content-type').includes('application/json'),file+' '+method+' '+fault+' safe JSON 500');
    const j=JSON.parse(text); check(j.success===false && !/Mongo|secret|stack|transaction failed/.test(text), 'no internal details or false success');
  }
  failure=''; missing=true;
  if(missingStatus) check((await call(file,method,data,kind)).status===missingStatus,file+' preserves missing/protected semantics');
  missing=false;
  check((await call(file,method,data,kind)).status===(method==='POST'?201:200),file+' recovers after rejection');
  if(data) check((await call(file,method,{},kind)).status===400,file+' validation retained');
  actor=null; check((await call(file,method,data,kind)).status===401,file+' unauthenticated retained');
  actor={id:'actor',role:role==='student'?'admin':'student'}; check((await call(file,method,data,kind)).status===403,file+' forbidden retained');
}
const zone=load('lib/aucklandTime.ts'), dates=load('lib/date.ts');
const Tasks=load('components/dashboard/UpcomingTasks.tsx').default;
const Deadline=load('components/ui/Deadline.tsx').default;
const originalTZ=process.env.TZ;
for(const tz of ['Pacific/Auckland','America/Los_Angeles']) {
  process.env.TZ=tz;
  for(const [now,today] of [
    ['2026-09-25T11:59:00Z','2026-09-25'],['2026-09-25T12:01:00Z','2026-09-26'],
    ['2026-04-04T10:59:00Z','2026-04-04'],['2026-04-04T11:01:00Z','2026-04-05'],
    ['2026-04-04T13:59:00Z','2026-04-05'],['2026-04-04T14:01:00Z','2026-04-05'],
    ['2026-09-26T13:59:00Z','2026-09-27'],['2026-09-26T14:01:00Z','2026-09-27'],
  ]) {
    instant=now; check(zone.aucklandDateKey()===today,tz+' Auckland midnight/DST key');
    const tomorrow=new Date(Date.parse(today+'T00:00:00Z')+86400000).toISOString().slice(0,10);
    const dashboardContext={Date:TestDate,today,BUSINESS_TIME_ZONE:zone.BUSINESS_TIME_ZONE,toDateInputValue:dates.toDateInputValue,calendarDayDifference:zone.calendarDayDifference,useMemo:fn=>fn(),applications:[
      {id:'past',deadline:'2026-01-01',status:'Preparing'},
      {id:'today',deadline:today,status:'Preparing'},
      {id:'tomorrow',deadline:tomorrow,status:'Interested'},
      {id:'invalid',deadline:'broken',status:'Preparing'},
    ]};
    check(vm.runInNewContext(handler('app/dashboard/page.tsx','dashboardStats'),dashboardContext).upcomingDeadlineCount===2,'actual Dashboard upcoming count');
    check(vm.runInNewContext(handler('app/dashboard/page.tsx','nextDeadline'),dashboardContext).application.id==='today','actual Dashboard next deadline');
    check(vm.runInNewContext(handler('app/dashboard/page.tsx','currentDateLabel'),dashboardContext)===new Intl.DateTimeFormat('en-NZ',{timeZone:'Pacific/Auckland',weekday:'long',day:'numeric',month:'long'}).format(new Date(now)),'actual Dashboard Auckland heading');
    let interviews;
    await vm.runInNewContext(handler('components/dashboard/UpcomingInterviews.tsx','load'),{
      aucklandDateKey:zone.aucklandDateKey,setLoading:()=>{},setError:message=>{if(message)throw Error(message);},setRows:rows=>interviews=rows,
      fetch:async()=>({ok:true,json:async()=>({data:[{id:'late',type:'interview',date:today,time:'15:00'},{id:'early',type:'interview',date:today,time:'09:00'},{id:'past',type:'interview',date:'2026-01-01',time:'09:00'}]})}),
    })();
    check(interviews.map(row=>row.id).join(',')==='early,late','actual upcoming interview filter and HH:mm order');
    for(const days of [-1,0,1,2,7,14,15]) {
      const key=new Date(Date.parse(today+'T00:00:00Z')+days*86400000).toISOString().slice(0,10);
      check(zone.calendarDayDifference(key)===days,tz+' DST-safe day difference '+days);
      const html=renderToStaticMarkup(React.createElement(Tasks,{applications:[{id:'a',organisation:'Company',roleTitle:'Test role',deadline:key,status:'Preparing'}]}));
      const expected=days===0?'Due today':days===1?'Due tomorrow':`Due in ${days} days`;
      check(days>=0&&days<=14?html.includes(expected):html.includes('No upcoming deadlines'),tz+' task window '+days);
      if(days>=0&&days<=7) check(renderToStaticMarkup(React.createElement(Deadline,{value:key})).includes(expected),'Deadline badge agrees');
      check(dates.toDateInputValue(key)===key,'date-only value unchanged');
    }
  }
}
if(originalTZ===undefined) delete process.env.TZ; else process.env.TZ=originalTZ;
// Execute actual UI handlers with failed HTTP responses; assert dialog/input retention and retry.
function handler(file,name) {
  const source=fs.readFileSync(file,'utf8'), ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX); let found;
  function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text===name)found=n.getText(ast);if(ts.isVariableDeclaration(n)&&n.name.getText(ast)===name)found='const '+n.getText(ast);ts.forEachChild(n,visit);}visit(ast); assert.ok(found,name);
  return ts.transpileModule(found+'; '+name+';',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
}
for(const [file,name] of [['app/calendar/page.tsx','handleSaveEvent'],['app/calendar/page.tsx','handleDeleteEvent'],['components/admin/AdminContentTable.tsx','save'],['components/admin/AdminUsersTable.tsx','save'],['components/opportunities/OpportunityForm.tsx','save']]) {
  for(const failureMode of ['json500','network']) {
    const state={busy:false,error:'',closed:false,reset:false,navigated:false};
    const context={FormData:class {get(k){return {title:'Keep title',programme:'Keep programme',status:'Active'}[k]||'';}},
      applicationId:id,organisation:'Keep company',eventDate:'2026-09-27',eventTime:'10:00',eventTitle:'Keep title',eventType:'interview',eventLocation:'Keep location',eventNotes:'Keep notes',isSavingEvent:false,isDeletingEvent:false,
      formMode:'create',editingEventId:null,selectedEvent:{id,type:'interview'},editing:{id,title:'Keep title'},kind:'resources',canManage:()=>true,canManageRoles:true,id,data:body,base:'/admin/opportunities',
      isDateInputValue:dates.isDateInputValue,
      setBusy:v=>state.busy=v,setIsSavingEvent:v=>state.busy=v,setIsDeletingEvent:v=>state.busy=v,
      setError:v=>state.error=v,setEventFormError:v=>state.error=v,setDeleteError:v=>state.error=v,setSuccess:()=>{},
      setShowEventForm:()=>state.closed=true,setShowDeleteModal:()=>state.closed=true,setEditing:()=>state.closed=true,setEditingEventId:()=>state.closed=true,
      resetEventForm:()=>state.reset=true,router:{push:()=>state.navigated=true,refresh:()=>{}},
      fetch:async()=>{if(failureMode==='network')throw Error('Network unavailable');return Response.json({success:false,message:'Unable to save. Please retry.'},{status:500});},
    };
    await vm.runInNewContext(handler(file,name),context)({preventDefault(){},currentTarget:{}});
    check(!state.busy && state.error && !state.closed && !state.reset && !state.navigated,file+' '+name+' '+failureMode+' keeps form and releases retry');
  }
}

// Exercise actual event repository transaction rejection, not only a rejected repository stub.
overrides.delete('@/lib/eventsRepository');
overrides.set('@/lib/models/CalendarEvent', { CalendarEventModel: {} });
overrides.set('@/lib/mongodb', { connectToDatabase: async () => ({ connection: { transaction: async () => { throw Error('internal transaction secret'); } } }) });
for (const file of ['app/api/events/route.ts','app/api/events/[id]/route.ts','lib/eventsRepository.ts']) cache.delete(file);
actor={id:'student',role:'student'};
for(const [file,method] of [['events','POST'],['events/[id]','PUT']]) {
  const response=await call(file,method,event); const text=await response.text();
  check(response.status===500 && JSON.parse(text).success===false && !text.includes('secret'),'actual repository transaction failure is safe JSON');
}
// Password mock regression executes the unchanged single-use reset handler.
const bcrypt=require('bcryptjs');
let tokenAvailable=true, revoked=false, failRevocation=false;
const account={_id:id,passwordHash:await bcrypt.hash('Old-password-123',4),async save(){}};
overrides.set('next/server',{NextResponse:Response});
overrides.set('@/lib/rateLimit',{checkRateLimit:()=>({allowed:true}),getClientIdentifier:()=> 'mock-reset'});
overrides.set('@/lib/models/User',{UserModel:{findOne:()=>({session:async()=>account})}});
overrides.set('@/lib/models/PasswordResetToken',{PasswordResetTokenModel:{
  findOneAndDelete:async()=>{if(!tokenAvailable)return null;tokenAvailable=false;return {userId:id};},
  deleteMany:async()=>{},
}});
overrides.set('@/lib/models/Session',{SessionModel:{deleteMany:async()=>{if(failRevocation)throw Error('internal secret');revoked=true;}}});
overrides.set('@/lib/mongodb',{connectToDatabase:async()=>({connection:{transaction:async callback=>{
  const before={tokenAvailable,hash:account.passwordHash,revoked};
  try{return await callback({});}catch(e){tokenAvailable=before.tokenAvailable;account.passwordHash=before.hash;revoked=before.revoked;throw e;}
}}})});
const resetBody={token:'a'.repeat(64),password:'New-password-456'};
check((await call('auth/reset-password','POST',resetBody)).status===200,'mock password reset succeeds');
check(revoked && await bcrypt.compare(resetBody.password,account.passwordHash),'mock password hashed and sessions revoked');
check((await call('auth/reset-password','POST',resetBody)).status===400,'mock token reuse rejected');
tokenAvailable=true;failRevocation=true;const oldHash=account.passwordHash;
check((await call('auth/reset-password','POST',{...resetBody,password:'Other-password-789'})).status===503,'mock reset transaction failure returns 503');
check(tokenAvailable && account.passwordHash===oldHash,'mock transaction rollback preserves password/token (real Mongo integration still required)');

console.log('SUCCESS '+count+' final closeout assertions; no database, email or Gemini calls.');
