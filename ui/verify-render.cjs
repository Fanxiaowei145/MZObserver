// Offscreen rendering of this local artifact; never controls a user's browser.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
app.commandLine.appendSwitch('force-device-scale-factor','1');
app.whenReady().then(async()=>{
 const out=path.resolve(__dirname,'../output');fs.mkdirSync(out,{recursive:true});
 const win=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,transparent:true,webPreferences:{offscreen:true,contextIsolation:true,nodeIntegration:false},backgroundColor:'#00000000'});
 fs.writeFileSync(path.join(out,'renderer-console.log'),'');
 win.webContents.on('console-message',(_e,level,message,line,source)=>fs.appendFileSync(path.join(out,'renderer-console.log'),`${level}: ${message} (${source}:${line})\n`));
 const run=code=>win.webContents.executeJavaScript(code),results=[];
 for(const s of [1,2,3]){
  await win.loadFile(path.join(__dirname,'index.html'),{query:{scene:String(s),export:'1'}});
  const check=await run('window.uiReady()');assert.equal(check.humans,6);assert.equal(check.scps,3);assert.deepEqual(check.missing,[]);
  await sleep(600);await run("document.querySelectorAll('.card').forEach(c=>c.classList.add('static'))");
  const geometry=await run(`(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};return [...document.querySelectorAll('.card')].map(c=>({id:c.dataset.id,card:rect(c),hp:rect(c.querySelector('.hp')),fill:parseFloat(getComputedStyle(c.querySelector('.fill')).height),shield:parseFloat(getComputedStyle(c.querySelector('.shield')).height),shieldBottom:parseFloat(getComputedStyle(c.querySelector('.shield')).bottom),roleText:c.querySelector('.role').textContent,border:getComputedStyle(c.querySelector('.frame')).borderWidth,armor:getComputedStyle(c.querySelector('.armor')).display,held:c.querySelector('.held')?getComputedStyle(c.querySelector('.held')).visibility:null,numberVisible:getComputedStyle(c.querySelector('.numbers')).visibility}))})()`);
  geometry.forEach(g=>{assert.equal(g.roleText,'');assert.equal(g.border,'0px');});
  if(s===1)geometry.forEach(g=>assert(Math.abs(g.fill+g.shield-90)<.1));
  if(s===2)assert(Math.abs(geometry[1].fill-61.2)<.1);
  if(s===3){assert.equal(geometry[4].fill,0);assert.equal(geometry[4].numberVisible,'hidden');assert.equal(geometry[4].held,'hidden');assert.equal(await run("document.querySelector('[data-id=H05] .held').getAttribute('src')"),null);}
  geometry.filter(g=>g.id[0]==='S').forEach(g=>assert(Math.abs(g.shieldBottom-g.fill)<.1));
  assert.equal(geometry[0].armor,'none');assert.equal(geometry[0].held,'hidden');
  const im=await win.webContents.capturePage(),name=['','01-overview','02-focus','03-combat'][s];fs.writeFileSync(path.join(out,name+'.png'),im.toPNG());
  if(s===3)fs.writeFileSync(path.join(out,'04-card-detail.png'),(await win.webContents.capturePage({x:20,y:785,width:1880,height:280})).toPNG());
  results.push({...check,name,size:im.getSize(),geometry});
 }
 for(let i=0;i<9;i++){assert.deepEqual(results[0].geometry[i].card,results[2].geometry[i].card);assert.equal(results[0].geometry[i].hp.y,results[2].geometry[i].hp.y);}
 const markerLabels=await run("[...document.querySelectorAll('.marker[data-id^=S] span')].map(e=>e.textContent)");
 assert.deepEqual(markerLabels,['1','2','3']);
 const layers=await run("(()=>{const c=document.querySelector('.card[data-id=S01]');return {portrait:+getComputedStyle(c.querySelector('.portrait')).zIndex,edge:+getComputedStyle(c.querySelector('.edge-effect')).zIndex,inset:getComputedStyle(c.querySelector('.edge-effect')).boxShadow.includes('inset')}})()");
 assert(layers.portrait>layers.edge);assert.equal(layers.inset,false);
 const wideScale=await run('setScene(1);mapCamera.scale');
 await run('setScene(2)');await sleep(1900);
 const closeScale=await run('mapCamera.scale');assert.equal(closeScale,wideScale);await run('MZUI.setMapZoom(true)');assert((await run('mapCamera.scale'))>wideScale);await run('MZUI.setMapZoom(false)');
 await run("setScene(3);document.querySelectorAll('.card').forEach(c=>c.classList.remove('static'))");await sleep(250);
 assert.equal(await run("document.querySelector('[data-id=H01] .edge-effect').getAnimations().length"),0);
 await run("MZUI.applyDamageTick({id:'H01',hp:49,kind:'cardiac'})");await sleep(70);
 const tickDuring=await run("parseFloat(getComputedStyle(document.querySelector('[data-id=H01] .fill')).height)");
 assert(tickDuring>44.1&&tickDuring<51.3,'A damage tick must visibly lower HP with interpolation');
 assert.equal(await run("document.querySelector('[data-id=H01] .hp').textContent"),'49');
 await sleep(650);assert.equal(await run("document.querySelector('[data-id=H01] .edge-effect').getAnimations().length"),0);
 // A dead slot must remain dead while no spawn state arrives.
 await run('MZUI.setMatchClock({halfElapsedMs:1500000,waveElapsedMs:90000})');await sleep(700);assert.equal(await run("document.querySelector('.card[data-id=H05]').classList.contains('dead')"),true);
 await run('setScene(4)');await sleep(120);
 const respawnOpacity=await run("parseFloat(getComputedStyle(document.querySelector('[data-id=H05] .visual')).opacity)");
 assert(respawnOpacity>.27&&respawnOpacity<1,'Respawn must fade, not instantly appear.');
 fs.writeFileSync(path.join(out,'04-wave-refresh.png'),(await win.webContents.capturePage()).toPNG());
 await sleep(500);assert.equal(await run("document.querySelector('.card[data-id=H05]').classList.contains('dead')"),false);
 await run('setScene(1)');await sleep(250);await run('setScene(2)');await sleep(70);
 const during=await run("parseFloat(getComputedStyle(document.querySelector('[data-id=H02] .fill')).height)");
 assert(during>61.2&&during<90,'Health must interpolate, not snap.');await sleep(200);
 const after=await run("parseFloat(getComputedStyle(document.querySelector('[data-id=H02] .fill')).height)");assert(Math.abs(after-61.2)<.1);
 await run("setScene(1);previewMapPlane('LCZ');true");await sleep(65);
 const floorDuring=await run("+getComputedStyle(document.getElementById('radar')).opacity");assert(floorDuring>0&&floorDuring<1);
 await sleep(450);
 assert.equal(await run("document.getElementById('radar').dataset.plane"),'LCZ');
 const lightIds=await run('mapCamera.visibleIds');assert.deepEqual(lightIds,['H01','H02','H03','H04','S01','S02']);
 const labels=await run("[...document.querySelectorAll('.elevator-label')].map(e=>e.textContent)");assert.deepEqual(labels,['A','B']);
 assert.equal(await run("document.querySelectorAll('.elevator-label svg').length"),0);
 assert.equal(await run("getComputedStyle(document.querySelector('.elevator-label')).backgroundColor"),'rgba(0, 0, 0, 0)');
 assert(Math.abs(parseFloat(await run("getComputedStyle(document.querySelector('.marker'),'::before').width"))-7)<.03);
 fs.writeFileSync(path.join(out,'05-light-containment.png'),(await win.webContents.capturePage()).toPNG());
 fs.writeFileSync(path.join(out,'07-elevator-detail.png'),(await win.webContents.capturePage({x:20,y:20,width:490,height:460})).toPNG());
 await run('setScene(6)');await run('uiReady()');await sleep(350);
 const extra=await run(`(()=>{const c=document.querySelector('.card[data-id=H04]');const css=s=>getComputedStyle(c.querySelector(s));return {hp:parseFloat(css('.fill').height),ahp:parseFloat(css('.ahp-fill').height),hs:parseFloat(css('.shield').height),ahpBottom:parseFloat(css('.ahp-fill').bottom),hsBottom:parseFloat(css('.shield').bottom),hpY:c.querySelector('.hp').getBoundingClientRect().y,held:css('.held').visibility,statuses:[...c.querySelectorAll('.status-item')].map(e=>e.dataset.status),specialBottom:c.querySelector('.specials').getBoundingClientRect().bottom,colorTop:c.querySelector('.shield').getBoundingClientRect().top}})()`);
 assert.equal(extra.hp,90);assert.equal(extra.ahp,36);assert.equal(extra.hs,45);assert.equal(extra.ahpBottom,90);assert.equal(extra.hsBottom,126);assert.equal(extra.hpY,results[0].geometry[3].hp.y);assert(extra.specialBottom<extra.colorTop);assert.equal(extra.held,'hidden');assert.deepEqual(extra.statuses,['cola-speed','scp1853']);
 fs.writeFileSync(path.join(out,'06-human-extra-health.png'),(await win.webContents.capturePage()).toPNG());
 fs.writeFileSync(path.join(out,'06-extra-health-detail.png'),(await win.webContents.capturePage({x:20,y:745,width:890,height:320})).toPNG());
 const extraLayout=await run(`(()=>{const c=document.querySelector('.card[data-id=H04]'),a=c.querySelector('.ahp-number'),s=c.querySelector('.hs');const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}};return {a:box(a),s:box(s),hp:box(c.querySelector('.hp')),ahpColor:getComputedStyle(c.querySelector('.ahp-fill')).backgroundColor,hsColor:getComputedStyle(c.querySelector('.shield')).backgroundColor}})()`);
 assert.equal(extraLayout.a.y,extraLayout.s.y);assert(extraLayout.a.right<extraLayout.s.x);assert(extraLayout.s.bottom+6<extraLayout.hp.y);
 assert.equal(extraLayout.ahpColor,'rgb(141, 206, 100)');assert.equal(extraLayout.hsColor,'rgb(129, 122, 255)');
 await run("MZUI.applyPlayers(currentSnapshot.map(p=>p.id==='H04'?{...p,ahp:0}:p))");
 const shieldAfter=await run("(()=>{const r=document.querySelector('.card[data-id=H04] .hs').getBoundingClientRect();return {x:r.x,y:r.y}})()");assert.equal(shieldAfter.x,extraLayout.s.x);assert.equal(shieldAfter.y,extraLayout.s.y);
 await run("MZUI.applyPlayers(currentSnapshot.map(p=>p.id==='H04'?{...p,ahp:0,hs:0,colaSpeed:false,scp1853:false}:p))");await sleep(220);
 assert.equal(await run("document.querySelector('.card[data-id=H04] .effects').children.length"),0);
 assert.equal(await run("getComputedStyle(document.querySelector('.card[data-id=H04] .ahp-number')).display"),'none');
 // Record native renderer frames for reviewable motion examples.
 const frameDir=path.join(out,'motion-frames');fs.mkdirSync(frameDir,{recursive:true});
 await run("setScene(1);MZUI.setMatchClock({halfElapsedMs:258000,waveElapsedMs:78000,paused:true})");await sleep(500);
 for(let i=0;i<70;i++){
   if(i===14)await run("previewMapPlane('LCZ');true");
   if(i===47)await run("previewMapPlane('HCZ_EZ');true");
   fs.writeFileSync(path.join(frameDir,`floor-${String(i).padStart(3,'0')}.png`),(await win.webContents.capturePage({x:20,y:20,width:490,height:460})).toPNG());await sleep(50);
 }
 await run('setScene(3)');await sleep(500);
 for(let i=0;i<60;i++){
   if(i===15||i===35||i===55)await run("MZUI.applyDamageTick({id:'H01',hp:currentSnapshot[0].hp-8,kind:'cardiac'})");
   fs.writeFileSync(path.join(frameDir,`health-${String(i).padStart(3,'0')}.png`),(await win.webContents.capturePage({x:20,y:825,width:160,height:240})).toPNG());await sleep(50);
 }
 await run("setScene(3);document.body.classList.add('transparent');document.querySelectorAll('.card').forEach(c=>c.classList.add('static'))");await sleep(500);
 fs.writeFileSync(path.join(out,'03-combat-transparent.png'),(await win.webContents.capturePage()).toPNG());
 await run("document.body.classList.remove('transparent');MZUI.showScpLineup(['079','3114','939'])");await run('uiReady()');await sleep(650);
 assert.equal(await run("document.querySelector('.card[data-id=S01] .generators').textContent"),'1/3');
 assert.equal(await run("document.querySelector('.card[data-id=S01] .hp').textContent"),'72');
 assert.equal(await run("parseFloat(getComputedStyle(document.querySelector('.card[data-id=S01] .shield')).height)"),0);
 await run("MZUI.previewObservedPlayer('S01')");
 await run("MZUI.applyScp079({id:'S01',level:4,energy:56,maxEnergy:150,camera:{plane:'LCZ'}});true");await sleep(550);
 assert.equal(await run("document.getElementById('radar').dataset.plane"),'LCZ');
 assert.equal(await run("document.querySelector('.card[data-id=S01] .hp').textContent"),'56');
 await run("MZUI.applyScp079({id:'S01',level:4,energy:55,maxEnergy:150,camera:{plane:'Surface'}})");assert.equal(await run("document.getElementById('radar').hidden"),true);
 await run("MZUI.applyScp079({id:'S01',level:4,energy:54,maxEnergy:150,camera:{plane:'LCZ'}})");await sleep(550);assert.equal(await run("document.getElementById('radar').hidden"),false);
 fs.writeFileSync(path.join(out,'08-scp079-camera.png'),(await win.webContents.capturePage()).toPNG());
 await run('showScpGallery()');assert.deepEqual((await run('uiReady()')).missing,[]);await sleep(500);
 assert.equal(await run("document.querySelectorAll('#scp-gallery .card').length"),27);
 assert.equal(await run("document.querySelectorAll('#scp-gallery .card[data-role=\"079\"].flashed').length"),0);
 fs.writeFileSync(path.join(out,'09-all-scp-effects.png'),(await win.webContents.capturePage({x:0,y:0,width:1920,height:900})).toPNG());
 fs.writeFileSync(path.join(out,'render-check.json'),JSON.stringify({passed:true,review:{markerLabels,layers,wideScale,closeScale,tickDuring,deadHeldSourceRemoved:true,eventDrivenPulseEnds:true,floorDuring,lightIds,elevatorLabels:labels,extra},healthAnimation:{during,after,durationMs:160},respawn:{opacityDuringFade:respawnOpacity,durationMs:420,remainsDeadUntilExplicitState:true},scenes:results},null,2));
 fs.rmSync(path.join(out,'render-error.txt'),{force:true});console.log('PASS: fixed slots, HP scaling, shield stacking, fixed numbers, empty states, assets and animated interpolation.');win.destroy();app.quit();
}).catch(e=>{fs.writeFileSync(path.resolve(__dirname,'../output/render-error.txt'),String(e.stack||e));app.exit(1)});

