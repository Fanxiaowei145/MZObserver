const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../output'),sleep=ms=>new Promise(r=>setTimeout(r,ms));app.commandLine.appendSwitch('force-device-scale-factor','1');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({width:1920,height:1080,show:false,useContentSize:true,webPreferences:{offscreen:true,backgroundThrottling:false}}),run=async s=>{try{return await win.webContents.executeJavaScript(s)}catch(e){throw Error(s+"\n"+e.message)}},external=[];
 win.webContents.session.webRequest.onBeforeRequest((d,cb)=>{if(/^(https?:|file:)/.test(d.url)&&!d.url.includes('.html'))external.push(d.url);cb({});});
 await win.loadFile(path.join(out,'MZ观战UI_统一预览.html'));assert.deepEqual((await run('uiReady()')).missing,[]);
 await run('showItemGallery()');const assets=await run('uiReady()');assert.deepEqual(assets.missing,[]);assert.equal(await run("document.querySelectorAll('.item-example').length"),69);
 await sleep(1200);fs.writeFileSync(path.join(out,'11-item-icons.png'),(await win.webContents.capturePage()).toPNG());
 await run("document.getElementById('item-gallery').remove();MZUI.previewHeldItem('KeycardScientist');true");
 const key=await run("decodeURIComponent(document.querySelector('[data-id=H01] .held').src.split(',')[1])");assert(key.includes('#fff19e'));assert(key.includes('fill="#fff"'));
 await run("MZUI.previewHeldItem('KeycardCustomTaskForce','#123456')");assert((await run("decodeURIComponent(document.querySelector('[data-id=H01] .held').src.split(',')[1])")).includes('#123456'));
 await run("setScene(3)");assert.equal(await run("document.querySelector('[data-id=H05] .held').getAttribute('src')"),null);
 await run("MZUI.showScpLineup(['079','939','3114'])");
 for(let n=0;n<=3;n++){
 await run(`MZUI.applyScp079({id:'S01',level:3,energy:${n*20},maxEnergy:125,generatorsActivated:${n},levelExperience:${n*50},levelExperienceRequired:150,camera:{plane:'HCZ_EZ'}})`);await sleep(190);
 assert.equal(await run("document.querySelector('[data-id=S01] .generators').textContent"),n+'/3');assert.equal(await run("parseFloat(getComputedStyle(document.querySelector('[data-id=S01] .fill')).height)"),90);assert.equal(await run("getComputedStyle(document.querySelector('[data-id=S01] .fill')).backgroundColor"),'rgb(215, 41, 72)');
 }
 await run("MZUI.applyScp079({id:'S01',level:4,energy:90,maxEnergy:150,levelExperience:75,levelExperienceRequired:150})");await sleep(250);
 assert.equal(await run("document.querySelector('[data-id=S01] .hp').textContent"),'90');
 assert.equal(await run("document.querySelector('[data-id=S01] .xp-track i').style.width"),'50%');
 await run("setScene(1);MZUI.applyPlayers(currentSnapshot.map(p=>p.id==='H01'?{...p,inventory:[{type:'SCP2176',count:3}]}:p))");
 assert.equal(await run("[...document.querySelectorAll('[data-id=H01] .special')].find(e=>e.querySelector('img').alt==='SCP2176').textContent"),'×3');
 await run("MZUI.applyPlayers(currentSnapshot.map(p=>p.id==='H01'?{...p,inventory:[]}:p))");
 assert.equal(await run("[...document.querySelectorAll('[data-id=H01] .special img')].some(e=>e.alt==='SCP2176')"),false);
 await run("MZUI.applyPlayers(currentSnapshot.map(p=>p.id==='H01'?{...p,inventory:[{type:'SCP1576',count:1}],special:[['SCP1576','1576']]}:p))");
 assert.equal(await run("[...document.querySelectorAll('[data-id=H01] .special img')].some(e=>e.alt==='SCP1576')"),false);
 for(const n of [1,2,3,0]){
  await run(`MZUI.applyPlayers(currentSnapshot.map(p=>p.id==='H01'?{...p,colaSpeed:n>0,colaStacks:n}:p))`.replace('n>0',String(n>0)).replace('colaStacks:n','colaStacks:'+n));
  assert.equal(await run("document.querySelector('[data-id=H01] .status-count')?.textContent??''"),n>1?'×'+n:'');
  assert.equal(await run("document.querySelectorAll('[data-id=H01] [data-status=cola-speed]').length"),n>0?1:0);
 }
 await run("MZUI.showScpLineup(['079','939','3114'])");
 const xpLayout=await run("(()=>{const c=document.querySelector('.card[data-id=S01]'),r=s=>c.querySelector(s).getBoundingClientRect();return {hpBottom:r('.hp').bottom,xpTop:r('.xp-readout').top,inNumberColumn:!!c.querySelector('.numbers .xp-readout'),barHeight:r('.xp-track').height,genFont:getComputedStyle(c.querySelector('.generators')).fontSize,levelFont:getComputedStyle(c.querySelector('.ahp-number')).fontSize}})()");
 assert(xpLayout.xpTop>xpLayout.hpBottom);assert(xpLayout.inNumberColumn);assert.equal(xpLayout.barHeight,10);assert.equal(xpLayout.genFont,'21px');assert.equal(xpLayout.levelFont,'20px');
 assert.equal(await run("mapCamera.mapSign"),-1);
 assert((await run("world.style.transform")).includes('scale(-'));
 await run("previewMapPlane('LCZ',{animate:false})");assert.equal(await run('mapCamera.mapSign'),1);assert(!(await run('world.style.transform')).includes('scale(-'));
 await run("setScene(1);MZUI.previewHeldItem('KeycardScientist');document.body.classList.add('export')");await run('uiReady()');await sleep(450);
 fs.writeFileSync(path.join(out,'12-unified-preview.png'),(await win.webContents.capturePage()).toPNG());
 assert.deepEqual(external,[]);fs.writeFileSync(path.join(out,'standalone-check.json'),JSON.stringify({passed:true,itemCount:69,missingImages:[],externalRequests:[],generatorCounts:[0,1,2,3],scp079RedHeight:90,keycardEndColor:true,customCardColor:true,deadHandsEmpty:true,xpRatio:0.5,inventory2176:true,excluded1576:true,colaStacks:[1,2,3,0],xpBelowEnergy:true,xpBarHeight:10,hczRotated180:true,lczUnrotated:true},null,2));fs.rmSync(path.join(out,'standalone-error.txt'),{force:true});win.destroy();app.quit();
}).catch(e=>{fs.writeFileSync(path.join(out,'standalone-error.txt'),e.stack);app.exit(1)});


