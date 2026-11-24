const {app,BrowserWindow}=require('electron'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/room-candidates');
app.setPath('userData',path.join(out,'integration-test-profile'));
app.commandLine.appendSwitch('force-device-scale-factor','1');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({width:1920,height:1080,show:false,useContentSize:true,webPreferences:{offscreen:true}}),errors=[];
 w.webContents.on('console-message',(_e,level,message)=>{if(level>=3)errors.push(message)});
 await w.loadFile(path.join(root,'ui/index.html'));
 const run=s=>w.webContents.executeJavaScript(s);
 const assets=await run('uiReady()');assert.equal(assets.missing.length,0);
 const result=await run(`(async()=>{
  const checks=[];for(const [prefab,s] of Object.entries(MZ_ROOM_SHAPE_DATA))for(const angle of [0,90,180,270]){
   const r={prefab,x:35,z:80,yaw_degrees:angle},before=JSON.stringify(r),im=new Image();im.className='room';
   MZ_ROOM_SHAPES.apply(im,r);world.append(im);await im.decode();
   const style=getComputedStyle(im),[x,y,w,h]=s.bounds;
   checks.push({prefab,angle,loaded:im.naturalWidth>0,originX:parseFloat(im.style.left)+parseFloat(style.transformOrigin.split(' ')[0]),originY:parseFloat(im.style.top)+parseFloat(style.transformOrigin.split(' ')[1]),width:parseFloat(style.width),expectedWidth:w*2,unchanged:before===JSON.stringify(r),filter:style.filter,corners:MZ_ROOM_SHAPES.corners(r)});im.remove();
  }return checks;
 })()`);
 assert.equal(result.length,100);
 for(const c of result){assert(c.loaded&&c.unchanged);assert(Math.abs(c.originX-70)<.001);assert(Math.abs(c.originY+160)<.001);assert(Math.abs(c.width-c.expectedWidth)<.02);assert.equal(c.filter,'none');assert.equal(c.corners.length,4)}
 assert.equal(await run("MZ_ROOM_SHAPES.get({prefab:'HCZ_Curve'})===undefined"),true);
 assert.equal(await run("MZ_ROOM_SHAPES.get({prefab:'EZ_HCZ_Checkpoint Part'})===undefined"),true);
 // Live layout packet uses the same exact-prefab path as the review renderer.
 await w.loadFile(path.join(root,'ui/index.html'),{query:{live:'1'}});
 await run('uiReady()');
 await run(`MZLive.accept({type:'layout',epoch:'room-integration',rooms:[...mapRoomSets.HCZ_EZ,...mapRoomSets.LCZ].map(r=>({...r,plane:r.zone==='LightContainment'?'LCZ':'HCZ_EZ'}))})`);
 const liveCount=await run("document.querySelectorAll('.room[data-reviewed]').length");assert(liveCount>0);
 assert.equal(errors.length,0,errors.join('\n'));
 await w.loadFile(path.join(root,'ui/index.html'));await run('uiReady()');await run("document.body.classList.add('export');setScene(1)");await new Promise(r=>setTimeout(r,350));
 fs.writeFileSync(path.join(out,'接入后地图预览.png'),(await w.webContents.capturePage()).toPNG());
 fs.writeFileSync(path.join(out,'integration-check.json'),JSON.stringify({passed:true,shapes:25,rotatedCases:result.length,liveReviewedRooms:liveCount,errors,playerCoordinatesChanged:false},null,2));
 w.destroy();app.quit();
}).catch(e=>{console.error(e);app.exit(1)});
