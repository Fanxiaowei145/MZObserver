const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/tests');
app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'079-live-motion-profile'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({width:1200,height:800,show:false,webPreferences:{offscreen:true}});
 await w.loadFile(path.join(root,'ui/index.html'),{query:{live:'1'}});
 const run=s=>w.webContents.executeJavaScript('(()=>{try{return eval('+JSON.stringify(s)+')}catch(e){return {testError:e.stack}}})()').then(v=>{if(v?.testError)throw Error(v.testError);return v;});await run('uiReady()');
 await run(`window.f=${fs.readFileSync(path.join(out,'state-fixture.json'),'utf8')};f.phase='live';f.sequence=100;f.paused=true;f.zoom=false;f.uiVisible=true;f.players.forEach(p=>{p.dead=false;p.alive=true;p.hp=100;p.mapMarkerHidden=false;});
 f.rooms=Object.entries(mapRoomSets).flatMap(([plane,rooms])=>rooms.map(r=>({...r,plane})));window.cam=f.players[8];cam.role='079';const room=f.rooms.find(r=>r.plane==='HCZ_EZ');window.origin={x:room.x*2,y:-room.z*2};
 f.players.forEach(p=>{p.plane='HCZ_EZ';p.x=origin.x;p.y=origin.y;p.roomId=room.room_id;});
 cam.camera={x:origin.x+10,y:origin.y+10,plane:'HCZ_EZ',roomId:room.room_id,mapMarkerHidden:false};
 f.observedActorId=f.players[0].actorId;MZLive.accept(f);
 window.samples=[];window.capture=false;const originalFit=window.fitMapPlayers;window.fitMapPlayers=function(points,plane){originalFit(points,plane);if(!capture)return;const p=points.find(p=>p.id===cam.id);const marker=document.querySelector('.marker[data-id="'+cam.id+'"]');const world=new DOMMatrixReadOnly(getComputedStyle(document.querySelector('#map-world')).transform),m=new DOMMatrixReadOnly(getComputedStyle(marker).transform);samples.push({x:p.x,y:p.y,humanX:points[0].x,error:Math.hypot(m.e+11-(world.a*p.x+world.c*p.y+world.e),m.f+11-(world.b*p.x+world.d*p.y+world.f)),screenX:m.e,scale:world.a,tx:world.e,rotation:getComputedStyle(marker.querySelector('svg')).transform,display:getComputedStyle(marker).display});};void 0;`);
 const wait=ms=>new Promise(r=>setTimeout(r,ms));await wait(350);
 // Receive a camera switch and human movement together, using the actual live RAF adapter.
 await run("capture=true;samples=[];cam.camera.x+=20;f.players[0].x+=12;f.sequence++;MZLive.accept(f)");await wait(140);
 let switchSamples=await run('samples');const destination=await run('cam.camera.x');assert(switchSamples.length>=2);assert(switchSamples.every(s=>s.x===destination),'079 must never pass through interpolated world coordinates');assert(switchSamples.every(s=>s.rotation==='none'));assert(switchSamples.every(s=>s.display!=='none'));
 // Keep 079 stationary while a human is observed and the zoomed map pans.
 await run('capture=false;f.zoom=true;f.players[0].x=origin.x;f.sequence++;MZLive.accept(f)');await wait(350);
 await run('samples=[];capture=true;f.players[0].x+=18;f.sequence++;MZLive.accept(f)');await wait(500);
 let panSamples=await run('samples');assert(panSamples.length>=5);assert(panSamples.every(s=>s.x===destination));assert(Math.max(...panSamples.map(s=>s.error))<0.02,'079 must track the rendered map, not jump to its destination');assert(new Set(panSamples.map(s=>s.screenX.toFixed(2))).size>3,'map pan must yield intermediate screen positions');
 // Same-room camera switch while zoomed must still have no world-space interpolation.
 await run('samples=[];cam.camera.y+=8;f.sequence++;MZLive.accept(f)');await wait(120);
 let zoomSwitch=await run('samples'),y=await run('cam.camera.y');assert(zoomSwitch.length>=2);assert(zoomSwitch.every(s=>s.y===y));assert(Math.max(...zoomSwitch.map(s=>s.error))<0.02);
 fs.writeFileSync(path.join(out,'079-live-motion-check.json'),JSON.stringify({passed:true,checks:['live camera switches immediately without 55ms interpolation','same-room camera switches immediately','stationary camera tracks rendered pan/zoom when observing human','fixed icon orientation'],switchFrames:switchSamples.length,panFrames:panSamples.length,maxPanProjectionError:Math.max(...panSamples.map(s=>s.error))},null,2));
 w.destroy();app.quit();
}).catch(e=>{console.error(e);app.exit(1)});
