// Read-only verification: actual GET/auth/DB code, with an existing student supplied at the session boundary.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {MongoClient} from 'mongodb';
import mongoose from 'mongoose';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
import {configure,markerId,plan,checkLinks,unrelatedHashes} from './setup-final-resource-data.mjs';

configure();
const require=createRequire(import.meta.url), cache=new Map();
let user;
function load(file) {
  file=path.resolve(file); if(cache.has(file))return cache.get(file);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const loaded={exports:{}};
  function localRequire(name) {
    if(name==='server-only')return {};
    if(name==='@/lib/auth')return {getAuthenticatedUser:async()=>user};
    if(name.startsWith('@/'))return load(name.slice(2)+'.ts');
    return require(name);
  }
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,loaded,loaded.exports);
  cache.set(file,loaded.exports); return loaded.exports;
}
const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000});
try {
  await client.connect(); const db=client.db('internship_tracker');
  const marker=await db.collection('final_resource_setups').findOne({_id:markerId});
  assert.ok(marker,'Setup completion marker required');
  const rows=await db.collection('resources').find({}).sort({_id:1}).toArray();
  assert.equal(rows.length,14);
  const {isPublicResourceUrl,validResourceLink}=load('lib/resource-url.ts');
  for(const row of rows) {
    assert.ok(validResourceLink(row));
    const original=marker.before.find(r=>String(r._id)===String(row._id));
    assert.ok(original); assert.equal(row.featured,original.featured); assert.equal(row.status,original.status);
  }
  const links=await checkLinks(rows.filter(r=>r.status==='Published'));
  assert.deepEqual(await unrelatedHashes(db),marker.unrelatedHashes,'Unrelated data changed since setup');
  const student=await db.collection('users').findOne({role:'student',status:'Active'},{projection:{role:1,status:1}});
  assert.ok(student); user={id:String(student._id),role:student.role,status:student.status};
  const handler=load('app/api/resources/route.ts');
  const response=await handler.GET();assert.equal(response.status,200);
  const data=(await response.json()).data;
  assert.equal(data.length,rows.filter(r=>r.status==='Published').length);
  assert.deepEqual(data.map(r=>r.id).sort(),rows.map(r=>String(r._id)).sort());
  assert.deepEqual([...new Set(data.map(r=>r.category))].sort(),[...new Set(rows.map(r=>r.category))].sort());
  assert.equal(data.filter(r=>r.featured).length,4);
  assert.ok(data.slice(0,4).every(r=>r.featured));
  const {default:ResourceLink}=load('components/resources/ResourceLink.tsx');
  for(const row of data) {
    const html=renderToStaticMarkup(React.createElement(ResourceLink,{url:row.url,title:row.title,origin:'http://localhost:3000'}));
    assert.ok(html.includes('<a ') && !html.includes('Resource link unavailable'));
  }
  user=undefined;assert.equal((await handler.GET()).status,401);
  user={role:'employee'};assert.equal((await handler.GET()).status,403);
  // Exercise both real Admin handlers; rejected requests return before DB mutation.
  user={role:'admin'};
  const post=load('app/api/admin/content/route.ts'), put=load('app/api/admin/content/[id]/route.ts');
  const invalid=['','javascript:alert(1)','data:text/plain,test','file:///tmp/test','http://localhost/a','http://127.0.0.1/a','http://10.0.0.1/a','http://[::1]/','https://u:p@example.org/','https://example.com/test'];
  for(const url of invalid) {
    const payload={title:'Validation only',category:'Technical',type:'Guide',featured:false,source:'Test',description:'',status:'Published',url};
    const request=()=>new Request('http://localhost/api/admin/content?kind=resources',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    assert.equal((await post.POST(request())).status,400);
    assert.equal((await put.PUT(request(),{params:Promise.resolve({id:plan[0].id})})).status,400);
    if(url) assert.equal(isPublicResourceUrl(url),false);
  }
  assert.ok(validResourceLink({status:'Draft',url:''}));
  assert.ok(validResourceLink({status:'Published',url:'https://react.dev'}));
  const report={database:db.databaseName,verifiedAt:new Date().toISOString(),published:data.length,featured:4,studentGet:'200; real handler and database; existing Active Student supplied at authentication boundary',resourceLinks:'14 real ResourceLink components render anchors; no unavailable labels',browserLogin:'not exercised',authorization:'unauthenticated 401; employee 403',adminValidation:'POST and PUT reject 10 invalid Published URLs; no writes',unrelatedCollections:'All stored hashes match, including opportunities and final_demo_setups',rows:rows.map(r=>({id:String(r._id),title:r.title,category:r.category,type:r.type,source:r.source,url:r.url,status:r.status,featured:r.featured})),links};
  const outIndex=process.argv.indexOf('--report');
  if(outIndex>=0)fs.writeFileSync(process.argv[outIndex+1],JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} catch(e) {console.error(`Verification failed (${e.name}); credentials suppressed.`);process.exitCode=1;}
finally {await mongoose.disconnect();await client.close();}
