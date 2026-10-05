// Real handlers/models in a uniquely named test database; no mail or Gemini calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import ts from 'typescript';
import mongoose from 'mongoose';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const dbName='internship_tracker_test_f'+randomBytes(6).toString('hex');
process.env.MONGODB_DB=dbName;
process.env.GEMINI_API_KEY='';
const require=createRequire(import.meta.url), cache=new Map();
let token='',count=0,ip=0,connected=false;
function load(file){
 file=path.resolve(file); if(cache.has(file))return cache.get(file);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const m={exports:{}};
 vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(name=>{
  if(name==='server-only')return {};
  if(name==='next/headers')return {cookies:async()=>({get:()=>({value:token})})};
  if(name.startsWith('@/'))return load(name.slice(2)+'.ts');
  return require(name);
 },m,m.exports);cache.set(file,m.exports);return m.exports;
}
function check(v,label){assert.ok(v,label);count++;console.log('FREEZE PASS '+label);}
async function call(file,method='GET',body,id,raw=false){
 const request=new Request('http://localhost/api?kind='+(file==='admin/content'&&method==='POST'?'resources':'opportunities'),{method,headers:{'Content-Type':'application/json','x-forwarded-for':'198.51.100.'+(++ip)},...(body===undefined?{}:{body:raw?body:JSON.stringify(body)})});
 const response=await load('app/api/'+file+'/route.ts')[method](request,{params:Promise.resolve({id})});
 return {status:response.status,body:await response.json()};
}
try{
 await load('lib/mongodb.ts').connectToDatabase();connected=true;
 assert.equal(mongoose.connection.name,dbName);
 const {UserModel:User}=load('lib/models/User.ts'),{SessionModel:Session}=load('lib/models/Session.ts');
 const {ApplicationModel:App}=load('lib/models/Application.ts'),{CalendarEventModel:Event}=load('lib/models/CalendarEvent.ts');
 const {OpportunityModel:Opportunity}=load('lib/models/Opportunity.ts'),{PasswordResetTokenModel:Reset}=load('lib/models/PasswordResetToken.ts');
 const {ReminderLogModel:Reminder}=load('lib/models/ReminderLog.ts');
 for(const model of [User,Session,App,Event,Opportunity,Reset,Reminder])await model.init();
 const makeUser=role=>User.create({fullName:'Freeze '+role,email:randomBytes(5).toString('hex')+'@example.test',passwordHash:'unused-test-hash',role,status:'Active'});
 const student=await makeUser('student'),other=await makeUser('student'),employee=await makeUser('employee'),admin=await makeUser('admin'),superadmin=await makeUser('superadmin');
 async function as(user){token='freeze-'+user._id;await Session.updateOne({token},{$set:{userId:user._id,expiresAt:new Date(Date.now()+3600000)}},{upsert:true});}
 const listing={organisation:'Freeze employer',role:'Intern',location:'Auckland',closingDate:'2099-12-31',description:'Original snapshot JD with application instructions: apply online.',status:'Published',applicationUrl:'https://example.test/apply'};
 await as(employee);const created=await call('opportunities','POST',listing);check(created.status===201,'employee publishes');const opportunityId=created.body.data.id;
 await as(student);const tracked=await call('opportunities/[id]/track','POST',undefined,opportunityId);check(tracked.status===201,'track creates snapshot');const appId=tracked.body.data.id;
 const saved=(await call('applications/[id]','GET',undefined,appId)).body.data;
 check(saved.jobDescription===listing.description&&saved.deadline===listing.closingDate&&saved.sourceLink===listing.applicationUrl,'unmodified listing snapshot fields');
 await as(employee);check((await call('opportunities/[id]','PATCH',{...listing,description:'Updated current JD with different application instructions.',closingDate:'2098-06-01',location:'Wellington',applicationUrl:'https://example.test/new'},opportunityId)).status===200,'employee updates JD, deadline, location and instructions URL');
 await as(student);const snapshot=(await call('applications/[id]','GET',undefined,appId)).body.data;
 check(['jobDescription','deadline','location','sourceLink'].every(k=>snapshot[k]===saved[k]),'snapshot stays unchanged after employer update');
 const latest=await call('opportunities/[id]','GET',undefined,opportunityId);check(latest.status===200&&latest.body.data.closingDate==='2098-06-01'&&latest.body.data.description!==snapshot.jobDescription,'latest detail endpoint returns current data');
 check((await call('opportunities/[id]/track','POST',undefined,opportunityId)).body.data.id===appId,'repeat track retains existing snapshot');
 for(const changes of [{status:'Closed'},{status:'Published',closingDate:'2000-01-01'},{status:'Draft'}]){
  await Opportunity.updateOne({_id:opportunityId},{$set:changes});
  check((await call('opportunities/[id]','GET',undefined,opportunityId)).status===404,'latest unavailable: '+JSON.stringify(changes));
  check((await call('applications/[id]','GET',undefined,appId)).status===200,'application survives unavailable listing');
 }
 await Opportunity.deleteOne({_id:opportunityId});
 check((await call('opportunities/[id]','GET',undefined,opportunityId)).status===404&&(await call('applications/[id]','GET',undefined,appId)).status===200,'deleted opportunity leaves readable application');
 const external=await call('applications','POST',{organisation:'External',roleTitle:'Intern',sourceLink:'https://example.test'});check(external.status===201,'external applications unchanged');
 for(const scheme of ['javascript:alert(1)','data:text/plain,bad','file:///tmp/file']){
  check((await call('applications','POST',{organisation:'Invalid',roleTitle:'Intern',sourceLink:scheme})).status===400,'sourceLink rejects '+scheme.split(':')[0]);
  await as(employee);check((await call('opportunities','POST',{...listing,applicationUrl:scheme})).status===400,'applicationUrl rejects '+scheme.split(':')[0]);await as(student);
 }
 const eventInput={applicationId:appId,type:'interview',title:'Test',organisation:'Freeze',date:'2099-12-30',time:'09:30'};
 for(const date of ['2026-02-30','2026-13-01','09/24/2026'])check((await call('events','POST',{...eventInput,date})).status===400,'invalid calendar date '+date);
 for(const time of ['24:00','12:60','9:30','10:30 AM'])check((await call('events','POST',{...eventInput,time})).status===400,'invalid calendar time '+time);
 for(const time of ['00:00','23:59','09:30',''])check((await call('events','POST',{...eventInput,time})).status===201,'valid calendar time '+time);
 const event=(await call('events','POST',eventInput)).body.data;
 check((await call('events','POST',{...eventInput,applicationId:'bad'})).status===400,'invalid body applicationId');
 for(const [route,method,body] of [['applications/[id]','GET'],['applications/[id]','PUT',{}],['applications/[id]','DELETE'],['applications/[id]/status','PATCH',{}],['events/[id]','PUT',{}],['events/[id]','DELETE'],['opportunities/[id]','GET'],['opportunities/[id]/track','POST']])check((await call(route,method,body,'invalid')).status===400,route+' '+method+' invalid ID');
 await as(other);check((await call('applications/[id]','GET',undefined,appId)).status===404,'valid foreign application ID stays 404');check((await call('events/[id]','DELETE',undefined,event.id)).status===404,'valid foreign event ID stays 404');
 const otherApp=await call('applications','POST',{organisation:'Other',roleTitle:'Other'});const otherEvent=await call('events','POST',{...eventInput,applicationId:otherApp.body.data.id});
 await as(student);
 for(const [route,method,id] of [['applications','POST'],['applications/[id]','PUT',appId],['applications/[id]/status','PATCH',appId],['events','POST'],['events/[id]','PUT',event.id],['profile','PATCH'],['auth/register','POST'],['auth/login','POST'],['auth/forgot-password','POST'],['auth/reset-password','POST']])check((await call(route,method,'{',id,true)).status===400,route+' malformed JSON');
 await as(employee);for(const [route,id] of [['opportunities',undefined],['opportunities/[id]',appId],['employee/profile',undefined]])check((await call(route,id||route==='employee/profile'?'PATCH':'POST','{',id,true)).status===400,route+' malformed JSON');
 await as(superadmin);for(const [route,method,id] of [['admin/content','POST'],['admin/content/[id]','PUT',appId],['admin/users','POST'],['admin/users/[id]','PATCH',String(student._id)]])check((await call(route,method,'{',id,true)).status===400,route+' malformed JSON');
 for(const [route,method] of [['admin/content/[id]','PUT'],['admin/content/[id]','DELETE'],['admin/users/[id]','PATCH'],['admin/users/[id]','DELETE']])check((await call(route,method,method==='DELETE'?undefined:{},'bad')).status===400,route+' '+method+' invalid ID');
 const registration={fullName:'Race',email:'race@example.test',password:'Strong-test-only-39!'};
 const race=await Promise.all([call('auth/register','POST',registration),call('auth/register','POST',registration)]);
 check(race.map(r=>r.status).sort().join(',')==='201,409','concurrent register returns one 201 and one safe 409');
 check((await call('auth/register','POST',registration)).status===409,'duplicate registration 409');
 const admins=await Promise.all([call('admin/users','POST',{...registration,email:'race-admin@example.test'}),call('admin/users','POST',{...registration,email:'race-admin@example.test'})]);
 check(admins.map(r=>r.status).sort().join(',')==='201,409','concurrent Add Admin safely returns 409');
 const valid=await Opportunity.create({...listing,createdBy:employee._id});
 await Opportunity.create({...listing,createdBy:new mongoose.Types.ObjectId()});await Opportunity.create({...listing,createdBy:admin._id});await Opportunity.create({...listing});await Opportunity.create({...listing,createdBy:student._id});
 await as(student);let discovery=await call('opportunities');check(discovery.body.data.length===1&&discovery.body.data[0].id===String(valid._id),'discovery excludes missing, orphan and non-employee publishers');
 await as(admin);check((await call('admin/users/[id]','PATCH',{programme:'',status:'Suspended'},String(employee._id))).status===200,'suspend employee');
 check((await call('opportunities')).body.data.some(r=>r.id===String(valid._id)),'admin still sees suspended employee opportunity');
 await as(employee);check((await call('opportunities')).status===401,'suspended employee cannot access protected API');
 await as(student);check((await call('opportunities')).body.data.length===0,'suspended employee hidden from discovery');check((await call('opportunities/[id]','GET',undefined,String(valid._id))).status===404,'suspended publisher direct detail hidden');check((await call('opportunities/[id]/track','POST',undefined,String(valid._id))).status===409,'suspended publisher cannot be newly tracked');
 await as(admin);check((await call('admin/users/[id]','PATCH',{programme:'',status:'Suspended'},String(student._id))).status===200,'suspend student');await as(student);check((await call('applications')).status===401,'suspended student existing session rejected');
 check((await call('auth/login','POST',{email:student.email,password:'unused'})).status===403,'suspended student login rejected');
 check(await App.exists({_id:appId})&&await Event.exists({_id:event.id}),'suspension preserves student history');
 const {eligible}=load('lib/notifications/rules.ts');
 check(eligible('deadline',{id:appId,userId:String(student._id),date:'2026-09-25'},{id:String(student._id),email:student.email,role:'student',status:'Suspended'},new Date('2026-09-24'))===null,'suspended student reminder ineligible');
 await Reset.create({userId:student._id,tokenHash:'delete-test',usable:true,expiresAt:new Date(Date.now()+3600000)});
 for(const state of ['claimed','sending','sent'])await Reminder.create({key:String(student._id)+':deadline:'+state,token:state,state,leaseUntil:new Date(Date.now()+3600000)});
 await Reminder.create({key:String(other._id)+':deadline:claimed',token:'other',state:'claimed',leaseUntil:new Date(Date.now()+3600000)});
 await Reset.create({userId:other._id,tokenHash:'other-test',usable:true,expiresAt:new Date(Date.now()+3600000)});
 await as(admin);
 // Force a child-cleanup failure to verify the existing transaction policy is retained.
 const original=Reset.deleteMany;Reset.deleteMany=async()=>{throw Error('injected');};
 try{check((await call('admin/users/[id]','DELETE',undefined,String(student._id))).status===500,'cleanup failure returns controlled error');}finally{Reset.deleteMany=original;}
 check(await User.exists({_id:student._id})&&await Session.exists({userId:student._id}),'cleanup failure rolls back deletion and session cleanup');
 check((await call('admin/users/[id]','DELETE',undefined,String(student._id))).status===200,'delete student');
 check(!await Session.exists({userId:student._id})&&!await Reset.exists({userId:student._id})&&!await Reminder.exists({key:new RegExp('^'+student._id+':'),state:'claimed'}),'deleted student sessions tokens and pending claims removed');
 check(await App.exists({_id:appId})&&await Event.exists({_id:event.id}),'deleted student history retained under old owner ID');
 check(await Reminder.countDocuments({key:new RegExp('^'+student._id+':')})===2,'in-flight and sent reminder audit retained');
 token='freeze-'+student._id;check((await call('applications')).status===401,'deleted session unusable');
 check(eligible('deadline',{id:appId,userId:String(student._id),date:'2026-09-25'},null,new Date('2026-09-24'))===null,'deleted recipient never eligible');
 await as(admin);check((await call('admin/users/[id]','DELETE',undefined,String(employee._id))).status===200,'delete employee');
 check((await Opportunity.findById(valid._id)).status==='Closed','deleted employee published opportunity closed');
 await as(other);check((await call('opportunities')).body.data.length===0,'deleted employee leaves no discoverable orphan');
 check(await App.exists({_id:otherApp.body.data.id})&&await Event.exists({_id:otherEvent.body.data.id})&&await Session.exists({userId:other._id})&&await Reset.exists({userId:other._id})&&await Reminder.exists({key:String(other._id)+':deadline:claimed'}),'other users data sessions tokens reminders untouched');
 await as(admin);check((await call('admin/users/[id]','DELETE',undefined,String(superadmin._id))).status===403,'admin cannot delete Super Admin');check((await call('admin/users/[id]','DELETE',undefined,String(admin._id))).status===400,'self deletion blocked');
 await as(superadmin);check((await call('admin/users/[id]','PATCH',{programme:'',status:'Suspended'},String(superadmin._id))).status===400,'Super Admin self suspension blocked');
 // Retained legacy calendar rows continue to load despite strict new-write schemas.
 await Event.collection.insertOne({...eventInput,userId:other._id,applicationId:otherApp.body.data.id,date:'24 Sep 2026',time:'10:30 AM'});
 await as(other);check((await call('events')).body.data.some(r=>r.time==='10:30 AM'),'legacy time strings remain readable');
 console.log('SUCCESS '+count+' feature-freeze assertions.');
}catch(error){console.error('FAILED',error.message);process.exitCode=1;}
finally{if(connected){assert.ok(dbName.startsWith('internship_tracker_test_')&&mongoose.connection.name===dbName);await mongoose.connection.dropDatabase();}await mongoose.disconnect();}
