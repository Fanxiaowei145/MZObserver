const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/tests');
app.disableHardwareAcceleration();
app.setPath('userData',path.join(out,'deafened-profile'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({width:1920,height:1080,show:false,webPreferences:{offscreen:true}});
 await w.loadFile(path.join(root,'ui/index.html'),{query:{live:'1'}});
 const run=s=>w.webContents.executeJavaScript(s);await run('uiReady()');
 await run(`window.f=${fs.readFileSync(path.join(out,'state-fixture.json'),'utf8')};f.phase='live';f.sequence=100;f.paused=true;f.players.forEach(p=>{p.dead=false;p.alive=true;p.hp=100;p.effectDetails=[];});window.subject=f.players[0];MZLive.accept(f);`);
 const count=()=>run("cards.get(subject.id).querySelectorAll('[data-status=deafened]').length");
 const apply=code=>run(`${code};f.sequence++;MZLive.accept(f);`);
 assert.equal(await count(),0);
 // Only raw effect details change; hp, inventory and other card fields stay fixed.
 await apply("subject.effectDetails=[{name:'Deafened',intensity:1,timeLeft:5}]");assert.equal(await count(),1);
 await apply("subject.effectDetails[0].timeLeft=4");assert.equal(await count(),1);
 await run("document.body.style.background='#141b24'");
 await new Promise(r=>setTimeout(r,350));
 const box=await run("(()=>{const r=cards.get(subject.id).getBoundingClientRect();return {x:Math.floor(r.x),y:Math.floor(r.y-45),width:Math.ceil(r.width),height:Math.ceil(r.height+45)}})()");
 fs.writeFileSync(path.join(out,'deafened-card.png'),(await w.webContents.capturePage(box)).toPNG());
 await apply("subject.effectDetails=[]");assert.equal(await count(),0);
 await apply("subject.effectDetails=[{name:'Deafened',intensity:1,timeLeft:0}]");assert.equal(await count(),1);
 await apply("subject.dead=true;subject.alive=false;subject.hp=0");assert.equal(await count(),0);
 await apply("subject.dead=false;subject.alive=true;subject.hp=100;subject.effectDetails=[{name:'Deafened',intensity:0,timeLeft:5}]");assert.equal(await count(),0);
 await apply("delete subject.effectDetails");assert.equal(await count(),0);
 fs.writeFileSync(path.join(out,'deafened-check.json'),JSON.stringify({passed:true,effectOnlyUpdates:true,removedOnExpiry:true,hiddenOnDeath:true,zeroIntensityHidden:true,missingDetailsHidden:true,permanentEffectSupported:true},null,2));
 w.destroy();app.quit();
}).catch(e=>{console.error(e);app.exit(1)});
