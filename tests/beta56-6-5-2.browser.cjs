'use strict';
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const m=JSON.parse(fs.readFileSync('manifest.beta56-6-5-2.json','utf8'));
 const read=id=>fs.readFileSync(m.modules.find(x=>x.id===id).path,'utf8');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<html><head></head><body>'+read('shell')+'</body></html>');
  await page.addStyleTag({content:read('style')});
  await page.evaluate(()=>{window.RemoteTV={RequestScope:function(){this.cancel=function(){};}};window.PhilcoPortal651={capabilities(cb){cb('ausente',{ok:false,helloWorld:false,bridges:[{port:8765,state:'HTTP 404'},{port:8766,state:'Servidor ausente'}]});}};});
  await page.addScriptTag({content:read('philco-library-manager')});
  await page.addScriptTag({content:read('philco-module-portal-hello')});
  await page.click('#rtvLibs');await page.click('#rtvLibTab-portal');
  assert.equal(await page.locator('.rtvLib651Row').count(),2);
  assert.equal(await page.locator('#rtvLibTest-portal-bridge').isVisible(),false);
  assert.match(await page.locator('#rtvLibTabInfo').textContent(),/8765.*404.*8766/);
  const boxes=await page.evaluate(()=>{
   const rect=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right};};
   return {panel:rect(document.getElementById('rtvLibPanel')),rows:rect(document.getElementById('rtvLibRows')),footer:rect(document.getElementById('rtvLibFooter')),tabs:Array.from(document.querySelectorAll('.rtvLib651Tab')).map(rect),items:Array.from(document.querySelectorAll('.rtvLib651Row')).map(rect)};
  });
  assert.equal(boxes.panel.w,1280);assert.equal(boxes.panel.h,720);
  assert.ok(boxes.footer.bottom<=720,'footer clipped');
  for(const b of boxes.tabs)assert.ok(b.x>=0&&b.right<=1280&&b.h>=40,'tab outside viewport');
  for(const b of boxes.items)assert.ok(b.y>=boxes.rows.y&&b.bottom<=boxes.rows.bottom,'diagnostic row clipped');
  await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.id),'rtvLibToggle-portal-bridge');
  await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.id),'rtvLibToggle-portal-bridge','must not enter hidden action');
  fs.mkdirSync('test-artifacts',{recursive:true});await page.screenshot({path:'test-artifacts/beta652-portal.png'});
  assert.deepEqual(errors,[]);console.log('PASS 1280x720 Portal layout, focus and unavailable bridge explanation (Chromium host)');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
