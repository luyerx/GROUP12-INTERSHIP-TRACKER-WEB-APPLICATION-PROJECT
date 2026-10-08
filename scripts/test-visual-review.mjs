import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Optional visual review: real isolated test sessions, read-only pages, local browser fixtures.
export async function testVisualReview({base,student,employee,admin,appId}) {
 const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const output=process.env.VISUAL_SCREENSHOTS_DIR;
 if(output)await fs.mkdir(output,{recursive:true});
 const errors=[];let count=0;
 const check=(value,label)=>{assert.ok(value,label);count++;console.log('VISUAL PASS '+label);};
 const roles=[['Product Studio','Design internship','Auckland','Hybrid'],['Digital Team','Software internship','Wellington','On-site'],['Research Collective','Graduate analyst','Christchurch','Remote']].map(([organisation,role,location,workMode],i)=>({id:String(i+1).padStart(24,'0'),organisation,role,location,workMode,status:'Published',employmentType:i===2?'Graduate':'Internship',closingDate:'2099-12-15',updatedAt:'2026-10-07T00:00:00Z',description:'A visual review fixture. Work with a small team, develop practical skills and contribute to projects with support from experienced colleagues.',applicationUrl:''}));
 const resources=[['Writing a resume that tells your story','CV & Resume','Template'],['Make your next interview a conversation','Interview','Guide'],['Find a direction that feels like you','Career Planning','Article']].map(([title,category,type],i)=>({id:'visual-'+i,title,category,type,featured:i===0,description:'Practical prompts and a clear starting point for your next career step. Use this guide to reflect on your experience and prepare with purpose.',source:'Visual review example',url:'https://example.test/career-guide'}));
 async function pageFor(cookie) {
  const context=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'Pacific/Auckland'});
  if(cookie)await context.addCookies([{name:'session_token',value:cookie.slice(cookie.indexOf('=')+1),url:base}]);
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));return page;
 }
 async function capture(page,url,name,ready='h1') {
  await page.goto(base+url);await page.locator(ready).first().waitFor();await page.waitForLoadState('networkidle');
  for(const width of [1440,1024,390]) {
   await page.setViewportSize({width,height:1000});
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' no overflow at '+width);
   check(await page.locator('h1').count()===1,name+' has one primary heading at '+width);
   if(name==='homepage'||name==='login') {
    const preview=page.locator('.product-preview--board');
    if(await preview.isVisible()) {
     const outer=await preview.boundingBox(),inner=await preview.locator('.preview-body').boundingBox();
     check(inner.width>outer.width*.85,name+' board preview has full-width content at '+width);
    }
   }
   if(width===1440 && await page.locator('.workspace-content').count()) {
    const content=await page.locator('.workspace-content').boundingBox();
    check(content.width>=1100,name+' uses available desktop workspace');
   }
   if(width===1440 && name==='calendar') {
    const month=await page.locator('.month-grid').boundingBox(),aside=await page.locator('.calendar-workspace-grid > aside').boundingBox();
    check(month.width/(month.width+aside.width)>=.72 && month.width/(month.width+aside.width)<=.78,'calendar uses 72–78% of desktop columns');
   }
   if(width===1440 && name==='opportunities') {
    const rail=await page.locator('.market-filters').boundingBox();
    check(rail.width>=240 && rail.width<=280,'opportunity filter rail stays readable');
    const actions=await page.locator('.market-list .job-actions').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().x));
    check(actions.every(x=>Math.abs(x-actions[0])<1),'opportunity actions align across results');
   }
   if(name==='ai-career-hub') {
    const list=page.getByRole('region',{name:'Saved career guidance'});
    check(await list.locator('a').count()===8,'all eight saved entries remain accessible at '+width);
    check(await list.evaluate(node=>node.clientHeight<=416 && node.scrollHeight>node.clientHeight),'AI history stays bounded and scrollable at '+width);
   }
   if(output) {
    await page.screenshot({path:path.join(output,name+'-'+width+'.png'),fullPage:true});
    if(['homepage','login','student-dashboard','opportunities','applications','calendar','ai-career-hub','admin-dashboard','employee-dashboard','resources'].includes(name))await page.screenshot({path:path.join(output,name+'-'+width+'-viewport.png')});
   }
  }
 }
 try {
  const publicPage=await pageFor();
  await capture(publicPage,'/','homepage');
  check(new URL(publicPage.url()).pathname==='/' && await publicPage.getByRole('link',{name:'Get Started',exact:false}).count()>=1,'root remains a public homepage');
  for(const id of ['features','career-hub','opportunities','resources','employers'])check(await publicPage.locator('#'+id).count()===1,'homepage contains '+id);
  await publicPage.getByRole('button',{name:'Open menu',exact:true}).click();
  await publicPage.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Features',exact:true}).click();
  check(await publicPage.getByRole('navigation',{name:'Mobile navigation'}).count()===0,'mobile anchor navigation closes menu');
  await capture(publicPage,'/login','login');await capture(publicPage,'/register','register');
  const studentPage=await pageFor(student);
  await studentPage.route('**/api/ai/history',route=>route.fulfill({json:{success:true,history:Array.from({length:8},(_,i)=>({id:String(i+1).padStart(24,'0'),feature:'interview-prep',applicationId:appId,createdAt:new Date(Date.now()-i*3600000).toISOString()}))}}));
  await studentPage.route('**/api/opportunities',route=>route.fulfill({json:{success:true,data:roles}}));
  await studentPage.route('**/api/opportunities/000000000000000000000001',route=>route.fulfill({json:{success:true,data:roles[0]}}));
  await studentPage.route('**/api/resources',route=>route.fulfill({json:{success:true,data:resources}}));
  await studentPage.goto(base+'/');await studentPage.getByRole('link',{name:'Go to Dashboard',exact:true}).waitFor();
  check(new URL(studentPage.url()).pathname==='/' && await studentPage.getByRole('link',{name:'Go to Dashboard'}).getAttribute('href')==='/dashboard','signed-in student stays on homepage with dashboard link');
  for(const [url,name,ready] of [['/dashboard','student-dashboard','h1'],['/opportunities','opportunities','.job-card'],['/opportunities/'+roles[0].id,'opportunity-detail','h1'],['/applications','applications','.tracker-table'],['/applications/'+appId,'application-detail','h1'],['/calendar','calendar','h1'],['/ai-assistant','ai-career-hub','h1'],['/resources','resources','.resource-feature'],['/profile','profile','h1']])await capture(studentPage,url,name,ready);
  await studentPage.goto(base+'/opportunities');await studentPage.locator('.job-card').first().waitFor();await studentPage.getByRole('textbox',{name:'Search',exact:true}).fill('Software');
  check(await studentPage.locator('.job-card').count()===1,'marketplace search still filters roles');
  await studentPage.getByRole('textbox',{name:'Search',exact:true}).fill('no-matching-role');await studentPage.getByRole('heading',{name:'No matching opportunities'}).waitFor();
  check(await studentPage.getByRole('button',{name:'Clear filters'}).count()>=1,'filtered empty state provides recovery');
  await studentPage.locator('.market-filters summary').click();check(!await studentPage.getByRole('textbox',{name:'Search',exact:true}).isVisible(),'mobile opportunity filters collapse');
  const employeePage=await pageFor(employee);for(const [url,name] of [['/employee/dashboard','employee-dashboard'],['/employee/opportunities','employee-opportunities'],['/employee/profile','company-profile']])await capture(employeePage,url,name);
  await employeePage.goto(base+'/');await employeePage.getByRole('link',{name:'Go to Dashboard'}).waitFor();check(await employeePage.getByRole('link',{name:'Go to Dashboard'}).getAttribute('href')==='/employee/dashboard','employer homepage dashboard link respects role');
  const adminPage=await pageFor(admin);await adminPage.route('**/api/opportunities',route=>route.fulfill({json:{success:true,data:roles}}));for(const [url,name] of [['/admin/dashboard','admin-dashboard'],['/admin/users','admin-users'],['/admin/opportunities','admin-opportunities'],['/admin/resources','admin-resources'],['/admin/ai-usage','admin-ai-usage']])await capture(adminPage,url,name);
  await adminPage.goto(base+'/admin/opportunities');await adminPage.getByRole('region',{name:'Opportunity management table'}).waitFor();check(await adminPage.locator('tbody tr').count()===3,'admin opportunities use a populated management table');
  await adminPage.goto(base+'/');await adminPage.getByRole('link',{name:'Go to Dashboard'}).waitFor();check(await adminPage.getByRole('link',{name:'Go to Dashboard'}).getAttribute('href')==='/admin/dashboard','admin homepage dashboard link respects role');
  check(errors.length===0,'no browser runtime errors: '+errors.join('; '));
  console.log('SUCCESS '+count+' visual/browser assertions; screenshots use isolated sessions and illustrative browser fixtures.');
 } finally {await browser.close();}
}
