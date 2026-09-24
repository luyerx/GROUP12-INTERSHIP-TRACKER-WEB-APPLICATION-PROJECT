// One-time setup. Default is read-only; --apply is guarded by an atomic marker.
import assert from 'node:assert/strict';
import dns from 'node:dns';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { MongoClient, ObjectId } from 'mongodb';
import nextEnv from '@next/env';

export const markerId = 'final-resource-data-2026-v1';
const seek = 'https://nz.seek.com/career-advice/article/';
export const plan = [
  ['6aa358f5bb4d522a95cc88f3','How to Write a Strong Internship CV',seek+'curriculum-vitae-cv-format-templates-and-examples','SEEK New Zealand'],
  ['6aa358f6bb4d522a95cc88f4','Preparing for Behavioural Interviews',seek+'heres-how-to-ace-behavioural-interview-questions','SEEK New Zealand'],
  ['6aa358f6bb4d522a95cc88f5','Internship Application Checklist','https://www.summeroftech.co.nz/candidates','Summer of Tech',{title:'Internship Search and Application Guide',category:'Job Search',type:'Guide',description:'Find New Zealand technology internships and understand eligibility, candidate profiles and the application process. The guide is public; applying requires a candidate account.'}],
  ['6aa358f6bb4d522a95cc88f6','Writing an Effective Cover Letter',seek+'how-to-write-a-great-cover-letter','SEEK New Zealand'],
  ['6aa358f7bb4d522a95cc88f7','STAR Interview Response Framework',seek+'how-to-use-the-star-interview-technique','SEEK New Zealand'],
  ['6aa358f7bb4d522a95cc88f8','Researching a Company Before Applying',seek+'what-should-you-research-before-an-interview','SEEK New Zealand'],
  ['6aa358f7bb4d522a95cc88f9','Graduate Career Planning Guide',seek+'how-to-write-a-career-plan','SEEK New Zealand'],
  ['6aa358f7bb4d522a95cc88fa','Technical Interview Preparation','https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing','Microsoft Careers'],
  ['6aa358f7bb4d522a95cc88fb','Technical interview preparation','https://careers.microsoft.com/v2/global/en/hiring-tips/student-interviewing','Microsoft Careers',{title:'Student Technical Interview Preparation'}],
  ['6aa358f8bb4d522a95cc88fc','Graduate CV template',seek+'free-resume-template','SEEK New Zealand'],
  ['6aa358f8bb4d522a95cc88fd','Building a career action plan',seek+'5-steps-to-your-future-career-planner','SEEK New Zealand',{type:'Guide'}],
  ['6aa358f8bb4d522a95cc88fe','Cover letter checklist',seek+'how-to-write-a-great-cover-letter','SEEK New Zealand'],
  ['6aa8d36572747ba0417c9d06','aaaaaaaaaa','https://react.dev','React',{title:'React Official Documentation'}],
  ['6ab2b570e93706c25b07177c','Updated Admin Test Resource','https://docs.github.com/en/get-started/using-github/hello-world','GitHub Docs',{title:'GitHub Basics: Hello World',description:'Learn repositories, branches, commits and pull requests using GitHub official documentation to support software projects and technical career preparation.'}],
].map(([id,previousTitle,url,source,changes={}])=>({id,previousTitle,url,source,changes}));

export function configure() {
  nextEnv.loadEnvConfig(process.cwd());
  if (process.env.FINAL_DEMO_DNS) dns.setServers(process.env.FINAL_DEMO_DNS.split(','));
  assert.ok(process.env.MONGODB_URI, 'Database configuration is required');
  assert.equal(process.env.MONGODB_DB || 'internship_tracker', 'internship_tracker');
}
export const hash = rows => createHash('sha256').update(JSON.stringify(rows)).digest('hex');
export async function unrelatedHashes(db) {
  const result = {};
  for (const {name} of await db.listCollections({}, {nameOnly:true}).toArray()) {
    if (['resources','final_resource_setups'].includes(name) || name.startsWith('system.')) continue;
    result[name] = hash(await db.collection(name).find({}).sort({_id:1}).toArray());
  }
  return result;
}
export async function checkLinks(rows) {
  return Promise.all(rows.map(async row => {
    const u = new URL(row.url);
    assert.equal(u.protocol,'https:'); assert.ok(!u.username && !u.password);
    // Only these reviewed official hosts are fetched by the setup/verification scripts.
    assert.ok(['nz.seek.com','www.summeroftech.co.nz','careers.microsoft.com','react.dev','docs.github.com'].includes(u.hostname));
    const r = await fetch(u, {redirect:'manual',signal:AbortSignal.timeout(30000)});
    assert.equal(r.status,200,`${row.title || row.previousTitle}: HTTP ${r.status}`);
    const body = await r.text();
    assert.ok(body.length > 1000);
    const title = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    assert.ok(title && !/access denied|just a moment|sign in/i.test(title));
    return {url:row.url,status:r.status,pageTitle:title,checkedAt:new Date().toISOString()};
  }));
}
export async function applySetup(client,db,before,links) {
  const session = client.startSession();
  try {
    await session.withTransaction(async()=>{
      assert.equal(await db.collection('final_resource_setups').countDocuments({_id:markerId},{session}),0,'Setup already completed; later website edits must not be overwritten');
      const current = await db.collection('resources').find({}, {session}).sort({_id:1}).toArray();
      assert.equal(hash(current),hash(before),'Resource changed during preparation');
      assert.equal(current.length,plan.length);
      const baseline = await unrelatedHashes(db);
      await db.collection('final_resource_setups').insertOne({_id:markerId,completedAt:new Date(),before:current,unrelatedHashes:baseline,links},{session});
      for (const item of plan) {
        const row = current.find(r=>String(r._id)===item.id);
        assert.equal(row?.title,item.previousTitle);
        assert.equal(row.status,'Published');
        assert.equal(row.url,item.id===plan[12].id?'https://react.dev':item.id===plan[13].id?'https://example.com/test-resource':'');
        const result=await db.collection('resources').updateOne({_id:new ObjectId(item.id)},{$set:{url:item.url,source:item.source,...item.changes,updatedAt:new Date()}},{session});
        assert.equal(result.matchedCount,1);
      }
    });
  } finally { await session.endSession(); }
}
async function main() {
  configure(); const client = new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000});
  try {
    await client.connect(); const db=client.db('internship_tracker');
    if(await db.collection('final_resource_setups').findOne({_id:markerId})) {
      console.log('Already completed. No changes made; do not delete the completion marker.'); return;
    }
    const before=await db.collection('resources').find({}).sort({_id:1}).toArray();
    console.log(JSON.stringify({database:db.databaseName,apply:process.argv.includes('--apply'),plan},null,2));
    const links=await checkLinks(plan);
    if(process.argv.includes('--apply')) {await applySetup(client,db,before,links);console.log('Applied once in a transaction; snapshot and marker saved.');}
    else console.log('Read-only preview; no database changes.');
  } finally { await client.close(); }
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) main().catch(e=>{console.error(`Setup failed (${e.name}); credentials suppressed.`);process.exitCode=1;});
