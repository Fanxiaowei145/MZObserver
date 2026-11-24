const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
app.commandLine.appendSwitch('force-device-scale-factor','1');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({width:1920,height:1080,useContentSize:true,show:false,webPreferences:{offscreen:true,backgroundThrottling:false},backgroundColor:'#141b24'});
 const run=s=>win.webContents.executeJavaScript(s),out=path.resolve(__dirname,'../output');
 win.webContents.on('console-message',(_e,l,m)=>{if(l===3)fs.appendFileSync(path.join(out,'layout-errors.log'),m+'\n')});
 await win.loadFile(path.join(__dirname,'index.html'),{query:{export:'1'}});await run('uiReady()');
 await run('setScene(6)');await run('uiReady()');await sleep(450);
 fs.writeFileSync(path.join(out,'10-layout-human.png'),(await win.webContents.capturePage({x:20,y:745,width:890,height:320})).toPNG());
 await run('showItemGallery()');await run('uiReady()');await sleep(700);fs.writeFileSync(path.join(out,'11-item-icons.png'),(await win.webContents.capturePage()).toPNG());await run("document.getElementById('item-gallery').remove()");
 await run('showScpGallery()');await run('uiReady()');await sleep(700);
 fs.writeFileSync(path.join(out,'10-layout-scp.png'),(await win.webContents.capturePage({x:242,y:80,width:1436,height:790})).toPNG());
 win.destroy();app.quit();
}).catch(e=>{fs.writeFileSync(path.resolve(__dirname,'../output/layout-errors.log'),e.stack);app.exit(1)});
