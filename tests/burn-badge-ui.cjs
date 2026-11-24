const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/tests');
app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'burn-badge-profile'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{offscreen:true}});
 await w.loadFile(path.join(root,'ui/index.html'),{query:{live:'1'}});
 const run=s=>w.webContents.executeJavaScript(s);await run('uiReady()');
 await run(`window.f=${fs.readFileSync(path.join(out,'state-fixture.json'),'utf8')};f.phase='live';f.sequence=100;f.paused=true;f.players.forEach(p=>{p.dead=false;p.alive=true;p.hp=100;p.effects=[];p.effectDetails=[];});window.subject=f.players.find(p=>p.id==='H01');window.monster=f.players.find(p=>p.id==='S01');monster.role='049';MZLive.accept(f);`);
 const apply=code=>run(`${code};f.sequence++;MZLive.accept(f);`);
 const count=id=>run(`cards.get('${id}').querySelectorAll('[data-status=burn]').length`);
 await apply("subject.effects=['burn'];monster.effects=['burn'];subject.effectDetails=[{name:'Deafened',intensity:1,timeLeft:5}]");
 for(const id of ['H01','S01']){
  assert.equal(await count(id),1);
  assert.equal(await run(`getComputedStyle(cards.get('${id}').querySelector('.edge-effect')).boxShadow`),'none');
  assert.equal(await run(`getComputedStyle(cards.get('${id}'),'::after').boxShadow`),'none');
 }
 assert.equal(await run("cards.get('H01').querySelectorAll('[data-status=deafened]').length"),1);
 await run("document.body.style.background='#141b24'");await new Promise(r=>setTimeout(r,350));
 const box=await run("(()=>{const r=cards.get('H01').getBoundingClientRect();return {x:Math.floor(r.x),y:Math.floor(r.y-45),width:Math.ceil(r.width),height:Math.ceil(r.height+45)}})()");
 fs.writeFileSync(path.join(out,'burn-deafened-card.png'),(await w.webContents.capturePage(box)).toPNG());
 await apply("subject.effects=[]");assert.equal(await count('H01'),0);
 await apply("monster.dead=true;monster.alive=false;monster.hp=0");assert.equal(await count('S01'),0);
 await apply("subject.effects=['burn','cardiac']");assert.equal(await count('H01'),1);
 assert.equal(await run("getComputedStyle(cards.get('H01').querySelector('.edge-effect')).boxShadow"),'none');
 await apply("subject.effects=['cardiac','corroding','burn'];subject.damageKind='cardiac';subject.damageSequence=71;subject.hp=84");
 for(const kind of ['cardiac','corroding','burn','deafened'])assert.equal(await run(`cards.get('H01').querySelectorAll('[data-status=${kind}]').length`),1);
 assert.equal(await run("cards.get('H01').querySelector('.hp').textContent"),'84');
 assert.equal(await run("cards.get('H01').querySelector('.edge-effect').getAnimations().length"),0);
 await new Promise(r=>setTimeout(r,350));
 fs.writeFileSync(path.join(out,'status-badges-card.png'),(await w.webContents.capturePage(box)).toPNG());
 await apply("subject.effects=[];subject.effectDetails=[]");
 assert.equal(await run("cards.get('H01').querySelectorAll('.effects [data-status]').length"),0);
 await apply("subject.effects=['cardiac','corroding'];subject.dead=true;subject.alive=false;subject.hp=0");
 assert.equal(await run("cards.get('H01').querySelectorAll('.effects [data-status]').length"),0);
 fs.writeFileSync(path.join(out,'burn-badge-check.json'),JSON.stringify({passed:true,humanAndScpSupported:true,allThreeGlowsRemoved:true,fourBadgesCoexist:true,clearsOnRemovalAndDeath:true,damageUpdatesHpWithoutEdgeAnimation:true},null,2));
 w.destroy();app.quit();
}).catch(e=>{console.error(e);app.exit(1)});
