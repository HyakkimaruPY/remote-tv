const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright');
const root=path.resolve(__dirname,'..'),base='http://127.0.0.1:18765';
const server=spawn('python3',['local-lab/server.py'],{cwd:root,stdio:['ignore','pipe','pipe']});
const helper=process.env.PHILCO_REAL_BRIDGE==='1'?spawn(process.env.PHILCO_HELPER||'/tmp/philco-helper-host',['--bridge'],{stdio:['ignore','pipe','pipe']}):null;
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const checks=[],errors=[];
(async()=>{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('server exit '+code)))});
 if(helper){for(let i=0;i<50;i++){try{const r=await fetch('http://127.0.0.1:8765/health');if(r.ok)break}catch(e){}await new Promise(r=>setTimeout(r,50))}}
 const browser=await chromium.launch({headless:true,executablePath:process.env.RTV_CHROMIUM||'/root/.cache/ms-playwright/chromium_headless_shell-1161/chrome-linux/headless_shell',args:['--no-sandbox']});
 try{
 const context=await browser.newContext({viewport:{width:1280,height:720}});
 await context.route('http://127.0.0.1:8765/**',async route=>{
 const u=new URL(route.request().url()),target=u.searchParams.get('u')||'';
 let dest=base+u.pathname+u.search;
 if(process.env.PHILCO_REAL_BRIDGE==='1'&&['/hls','/fetch'].includes(u.pathname)&&(target.includes('tv.fixture')||target.includes('127.0.0.2:18766'))){u.searchParams.set('u',target.replace('tv.fixture','127.0.0.2:18766'));dest=u.href}
 try{const r=await context.request.get(dest);await route.fulfill({response:r,headers:{...r.headers(),'access-control-allow-origin':'*'}})}catch(e){await route.abort()}
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?candidate=1');await page.waitForFunction(()=>TVLab.ready==='player1');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'tv');checks.push('real manifest boot and initial remote focus');
 await page.locator('#tv').click();await page.waitForSelector('#c14catlist button');
 await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');
 await page.waitForFunction(()=>{const v=document.querySelector('[data-native-sim]');return v&&v.currentTime>.2});
 const preview=await page.evaluate(()=>{let v=document.querySelector('[data-native-sim]'),r=v.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,decoded:v.videoWidth,transparent:getComputedStyle(document.getElementById('c14body')).backgroundColor,plays:TVLab.calls.filter(c=>c.name==='play').length}});
 if(manifest.version==='0.56-beta.2'){
 const theme=await page.evaluate(()=>{let ch=document.querySelector('#c14chlist button'),panel=document.getElementById('c14chs'),button=document.getElementById('c14full'),ctrl=button.parentNode;return{panel:getComputedStyle(panel).backgroundColor,radius:getComputedStyle(ch).borderRadius,buttonRadius:getComputedStyle(button).borderRadius,padding:getComputedStyle(ctrl).paddingLeft,buttonHeight:button.getBoundingClientRect().height}});
 assert.deepEqual(theme,{panel:'rgb(0, 0, 0)',radius:'4px',buttonRadius:'4px',padding:'22px',buttonHeight:44});checks.push('beta 2 pure black panels, 4px corners and aligned 44px controls');
 }
 assert.equal(preview.decoded,640);assert.equal(preview.transparent,'rgba(0, 0, 0, 0)');assert.equal(preview.plays,1);checks.push('real host video decode through simulated native ABI and HTTP fixture bridge');
 await page.screenshot({path:path.join(__dirname,'results/preview.png')});
 await page.keyboard.press('Enter');await page.waitForFunction(()=>CommonPlayer14.state.full===1);
 const full=await page.locator('[data-native-sim]').boundingBox();assert.deepEqual(full,{x:0,y:0,width:1280,height:720});checks.push('fullscreen 16:9 and native display rectangle');
 await page.screenshot({path:path.join(__dirname,'results/fullscreen.png')});
 await page.keyboard.press('Escape');await page.waitForFunction(()=>CommonPlayer14.state.full===0);checks.push('Back restores preview');
 // Held-key navigation should not reopen the current native stream.
 const starts=await page.evaluate(()=>TVLab.calls.filter(c=>c.name==='play').length);
 for(let i=0;i<35;i++){await page.keyboard.press('ArrowDown');await page.waitForTimeout(180)}
 assert.equal(await page.evaluate(()=>TVLab.calls.filter(c=>c.name==='play').length),starts);assert.equal(await page.evaluate(()=>CommonPlayer14.state.ci),11);checks.push('35 directional actions advance focus across pages without unwanted stream restart');
 // Select another channel, then exit while transport is deliberately slow.
 await page.evaluate(()=>{TVLab.scenario='slow'});await context.request.get(base+'/lab/scenario?id=slow');
 await page.locator('#c14chlist button').nth(1).click();
 await page.waitForFunction(()=>TVLab.calls.filter(c=>c.name==='play').length>1);
 for(let i=0;i<2;i++){await page.keyboard.press('Escape');await page.waitForTimeout(450)}
 await page.waitForTimeout(3000);
 assert.equal(await page.locator('[data-native-sim]').count(),0);checks.push('exit during delayed transport removes video and invalidates late completion');
 await context.request.get(base+'/lab/scenario?id=healthy');
 await page.goto(base+'/?candidate=1');await page.waitForFunction(()=>TVLab.ready==='player1');
 // Exercise actual Xtream auth/core/router/UI against fake credentials only.
 await page.locator('#rawLaunch').click();await page.waitForSelector('.ch14',{timeout:12000});
 await page.locator('.ch14').first().click();await page.waitForFunction(()=>document.querySelector('[data-native-sim]')?.currentTime>.2);
 checks.push('Xtream authentication, category API and 720p-first route integrated');
 await page.screenshot({path:path.join(__dirname,'results/xtream.png')});
 // Offline must not cause uncontrolled native reopen cycles.
 await context.request.get(base+'/lab/scenario?id=offline');
 await page.locator('.ch14').nth(1).click();await page.waitForTimeout(3000);
 const before=await page.evaluate(()=>TVLab.calls.filter(c=>c.name==='play').length);await page.waitForTimeout(2000);
 assert.equal(await page.evaluate(()=>TVLab.calls.filter(c=>c.name==='play').length),before);checks.push('short outage stays within recovery grace period');
 await context.request.get(base+'/lab/scenario?id=healthy');
 assert.deepEqual(errors,[]);
 const timings=await page.evaluate(()=>({firstFrames:TVLab.firstFrames,nativeErrors:TVLab.errors,calls:TVLab.calls.length}));
 const result={status:'PASS',version:manifest.version,bridge:process.env.PHILCO_REAL_BRIDGE==='1'?'Go v7.2':'Python contract',base:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),viewport:'1280x720',checks,preview,timings,pageErrors:errors,limits:['Chromium is not Philco WebKit','QJY/MStar ABI is simulated',process.env.PHILCO_REAL_BRIDGE==='1'?'Recovered v7.2 Go helper executed; newer incomplete patches modeled by adapter':'Python bridge adapter; use PHILCO_REAL_BRIDGE=1 to exercise recovered Go helper','Synthetic media and credentials only']};
 fs.writeFileSync(path.join(__dirname,manifest.version==='0.56-beta.2'?'results/browser-beta2.json':(process.env.PHILCO_REAL_BRIDGE==='1'?'results/browser-go.json':'results/browser.json')),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{server.kill();if(helper)helper.kill()});
