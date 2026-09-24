import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import ts from 'typescript';
import mongoose from 'mongoose';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const dbName = 'internship_tracker_test_n' + randomBytes(6).toString('hex');
process.env.MONGODB_DB = dbName;
process.env.RESEND_API_KEY = 'test-only-key';
process.env.NOTIFICATION_FROM_EMAIL = 'test@example.test';
const require = createRequire(import.meta.url), cache = new Map();
let actor;
function load(file) {
 file = path.resolve(file); if(cache.has(file))return cache.get(file);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const m={exports:{}};
 vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(name=>{
  if(name==='server-only')return {};
  if(name==='@/lib/auth')return {getAuthenticatedUser:async()=>actor};
  if(name==='next/server')return {NextResponse:Response};
  if(name.startsWith('@/'))return load(name.slice(2)+'.ts');
  return require(name);
 },m,m.exports);cache.set(file,m.exports);return m.exports;
}
let assertions=0,connected=false;
function check(value,label){assert.ok(value,label);assertions++;console.log('PASS '+label)}
const originalFetch=globalThis.fetch;
try {
 await load('lib/mongodb.ts').connectToDatabase();connected=true;
 assert.equal(mongoose.connection.name,dbName);
 const {UserModel:User}=load('lib/models/User.ts');
 const {ApplicationModel:App}=load('lib/models/Application.ts');
 const {CalendarEventModel:Event}=load('lib/models/CalendarEvent.ts');
 const {ReminderLogModel:Log}=load('lib/models/ReminderLog.ts');
 const {executeReminders}=load('lib/notifications/runner.ts');
 const {PATCH}=load('app/api/profile/route.ts');
 const u=await User.create({fullName:'Notification test',email:'notification@example.test',passwordHash:'unused-test-only',role:'student',status:'Active'});
 actor={id:String(u._id),email:u.email,role:'student'};
 const {aucklandDateKey}=load('lib/aucklandTime.ts');
 const date=aucklandDateKey(new Date(Date.now()+24*60*60*1000)), time='12:00';
 const a=await App.create({userId:u._id,organisation:'Test only',roleTitle:'Notification test',deadline:date,status:'Applied'});
 await Event.create({userId:u._id,applicationId:String(a._id),type:'interview',title:'Notification test',organisation:'Test only',date,time});
 const prefs={fullName:u.fullName,email:u.email,university:'',degree:'',major:'',graduationYear:'',location:'',preferredRoles:[],preferredLocations:[],skills:[],openToInternships:true};
 let sent=0,providerStatus=200;
 globalThis.fetch=async url=>{assert.equal(url,'https://api.resend.com/emails');sent++;return new Response('{}',{status:providerStatus})};
 for(const [emailNotifications,deadlineReminders,interviewReminders,expected] of [[false,true,true,0],[true,false,false,0],[true,true,false,1],[true,false,true,1],[true,true,true,2]]) {
  await Log.deleteMany({});sent=0;
  const response=await PATCH(new Request('http://localhost/api/profile',{method:'PATCH',body:JSON.stringify({...prefs,emailNotifications,deadlineReminders,interviewReminders})}));
  check(response.status===200,'Profile API saves switch combination '+[emailNotifications,deadlineReminders,interviewReminders]);
  const persisted=await User.findById(u._id).lean();
  check(persisted.emailNotifications===emailNotifications&&persisted.deadlineReminders===deadlineReminders&&persisted.interviewReminders===interviewReminders,'all three switches persisted');
  const result=await executeReminders();check(result.sent===expected&&sent===expected,'real runner respects saved Profile switches: '+expected+' sends');
 }
 await Log.deleteMany({});sent=0;
 const concurrent=await Promise.all([executeReminders(),executeReminders()]);
 check(concurrent.reduce((n,r)=>n+r.sent,0)===2&&sent===2,'Mongo unique claims prevent concurrent duplicate delivery');
 check((await executeReminders()).sent===0&&sent===2,'completed reminders never resend');
 await Log.deleteMany({});providerStatus=429;sent=0;
 const failed=await executeReminders();
 check(failed.failed===2&&failed.sent===0&&await Log.countDocuments({})===0,'definite provider failure never marks sent and releases claims');
 providerStatus=200;check((await executeReminders()).sent===2,'definite failure safely retries');
 await Log.deleteMany({});globalThis.fetch=async()=>{throw Error('ambiguous network timeout')};
 check((await executeReminders()).failed===2&&await Log.countDocuments({state:'sending'})===2,'uncertain provider outcome retained as sending, never sent');
 await Log.updateMany({},{$set:{leaseUntil:new Date(0)}});
 sent=0;globalThis.fetch=async()=>{sent++;return new Response('{}',{status:200})};
 check((await executeReminders()).sent===0&&sent===0,'uncertain delivery not reclaimed after lease expiration');
 await Log.deleteMany({});
 const normalUpdate=Log.updateOne;
 Log.updateOne=function(filter,update,...rest){if(update.$set?.state==='sent')throw Error('simulated sent persistence failure');return normalUpdate.call(this,filter,update,...rest)};
 try{check((await executeReminders()).failed===2,'accepted mail with failed persistence is reported failed')}finally{Log.updateOne=normalUpdate}
 check(await Log.countDocuments({state:'sending'})===2,'accepted mail retains duplicate barrier after persistence failure');
 sent=0;check((await executeReminders()).sent===0&&sent===0,'accepted mail with failed persistence is never sent twice');
 await Log.deleteMany({});await App.deleteOne({_id:a._id});
 check((await executeReminders()).sent===0,'orphan interview ignored after parent deletion');
 console.log('SUCCESS '+assertions+' notification integration assertions; only isolated DB and mocked email transport.');
} finally {
 globalThis.fetch=originalFetch;
 if(connected){assert.ok(dbName.startsWith('internship_tracker_test_n')&&mongoose.connection.name===dbName);await mongoose.connection.dropDatabase();console.log('Isolated notification test database removed.')}
 await mongoose.disconnect();
}
