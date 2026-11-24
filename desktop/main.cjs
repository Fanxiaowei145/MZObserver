const {app,BrowserWindow,ipcMain,screen}=require('electron');
const WebSocket=require('ws');
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),readline=require('node:readline');
const hotkeys=require('./hotkeys.cjs'),controls=new hotkeys.Controls();
const {Switcher,numberOf,allowed}=require('./spectator-switch.cjs');
const {applyFeedback}=require('./target-feedback.cjs');
const {OrderSamples}=require('./order-samples.cjs');let orderSamples=null;
const sampleEvent=(type,data)=>orderSamples?.event(type,data);
let switchOptions={enabled:false,cycle:1,previous:2};
function trackerWrite(line){if(tracker?.stdin?.writable)tracker.stdin.write(line+'\n');}
function switchReport(result){sampleEvent('switch-result',result);trackerWrite('disarm');settingsWindow?.webContents.send('mz:switch-result',result);}
const switcher=new Switcher({recover:data=>sampleEvent('switch-recovery',data),step:(id,direction)=>{sampleEvent('switch-input',{requestId:id,direction,from:latestState?.observedActorId,target:switcher.job?.actor,expected:switcher.job?.expected,sequence:latestState?.sequence});trackerWrite('step '+id+' '+direction);},report:switchReport});
function switchSafe(){return switchOptions.enabled&&game.found&&game.foreground&&Date.now()-lastStateAt<500&&Date.now()>=positionReadyAt&&allowed(latestState);}
function switchPacket(s){return {...controls.apply(s),players:s.players?.map(p=>({...p,shortcutNumber:numberOf(p,s)}))};}
function configureSwitch(value){
 value=value&&{...value,previous:value.previous??(value.cycle===2?1:2)};
 if(!value||typeof value.enabled!=='boolean'||![1,2,...Object.values(hotkeys.keys).map(k=>k.vk)].includes(value.cycle)||value.cycle>=48&&value.cycle<=57||value.cycle>=97&&value.cycle<=105)throw Error('请选择鼠标键或非数字切换键');
 if(value.enabled&&Object.values(bindings).some(k=>/^(Digit|Numpad)[1-9]$/.test(k)))throw Error('主键盘/小键盘 1–9 已被其他 UI 功能占用，请先换绑');
 if(![1,2,...Object.values(hotkeys.keys).map(k=>k.vk)].includes(value.previous)||value.previous>=48&&value.previous<=57||value.previous>=97&&value.previous<=105||value.previous===value.cycle)throw Error('上一位和下一位必须使用不同的非数字键');
 if(value.enabled&&Object.values(bindings).some(k=>[value.cycle,value.previous].includes(hotkeys.keys[k]?.vk)))throw Error('游戏切换键不能与 UI 显示或缩放键重复');
 switcher.cancel('设置已更改');switcher.invalidate();switchOptions={enabled:value.enabled,cycle:value.cycle,previous:value.previous};trackerWrite('switch '+Number(value.enabled)+' '+value.cycle+' '+value.previous);
}
let bindings={...hotkeys.defaults},latestState=null;
const selfTest=process.argv.includes('--self-test');
let settingsWindow,overlay,tracker,ws,retryTimer,healthTimer,switchTimer,positionReadyAt=0,token='',url='',stopped=true,lastStateAt=0,lastSequence=-1,epoch='',hasState=false,game={found:false},generation=0;
const preferences=()=>path.join(app.getPath('userData'),'settings.json');
function readPreferences(){try{return JSON.parse(fs.readFileSync(preferences(),'utf8'));}catch{return {};}}
function savePreferences(patch){fs.mkdirSync(path.dirname(preferences()),{recursive:true});fs.writeFileSync(preferences(),JSON.stringify({...readPreferences(),...patch}));}
function updateTrackerKeys(){if(tracker?.stdin?.writable)tracker.stdin.write(`keys ${hotkeys.keys[bindings.visibility]?.vk||0} ${hotkeys.keys[bindings.zoom]?.vk||0} 0\n`);}
function toggleLocal(action){if(!controls.toggle(action))return;sendState({type:'local-controls',uiVisible:controls.visible,zoom:controls.zoom});hasState=!!latestState&&controls.visible&&['live','ended'].includes(latestState.phase);follow();settingsWindow?.webContents.send('mz:controls',{visible:controls.visible,zoom:controls.zoom});}
function status(message){if(!settingsWindow?.isDestroyed())settingsWindow?.webContents.send('mz:status',message);}
function sendState(s){if(!overlay?.isDestroyed())overlay?.webContents.send('mz:state',s);}
function clear(reason){orderSamples?.reset(reason);switcher.cancel(reason);switcher.invalidate();trackerWrite('disarm');latestState=null;hasState=false;lastStateAt=0;sendState({type:'unavailable',reason});if(overlay&&!overlay.isDestroyed())overlay.hide();}
function follow(){if(!overlay||overlay.isDestroyed())return;if(!game.found||!game.foreground||!hasState){overlay.hide();return;}
 const b=screen.screenToDipRect(null,{x:game.x,y:game.y,width:game.width,height:game.height});
 const old=overlay.getBounds();if(['x','y','width','height'].some(k=>old[k]!==b[k]))overlay.setBounds(b,false);
 if(!overlay.isVisible())overlay.showInactive();
}
function openSocket(code){
 const myGeneration=++generation;lastSequence=-1;epoch='';lastStateAt=0;clear('正在连接服务器');status('正在连接…');
 let socket,terminalReason='';try{socket=new WebSocket(url,{maxPayload:3000000,perMessageDeflate:false});}catch(e){status(e.message);return;}ws=socket;
 socket.addEventListener('open',()=>{if(myGeneration!==generation)return;socket.send(JSON.stringify({...token?{token}:{code},targetFeedbackVersion:1}));});
 socket.addEventListener('message',e=>{if(myGeneration!==generation)return;try{
  if(typeof e.data!=='string'||e.data.length>3000000)throw Error('数据包过大');const s=JSON.parse(e.data);
  if(s.type==='target-feedback'){
   const next=applyFeedback(latestState,s);sampleEvent('target-feedback',{accepted:!!next,baseSequence:s.baseSequence,serverTimeMs:s.serverTimeMs,observedActorId:s.observedActorId,observedLifeId:s.observedLifeId});
   if(next){latestState=next;orderSamples?.state(next);if(switchSafe()){trackerWrite('arm');switcher.update(next);}}return;
  }
  if(s.type==='layout'){sendState(s);return;}
  if(s.type==='authenticated'){token=s.token;status('配对成功，等待比赛状态');return;}
  if(s.type==='error'){terminalReason=s.message;status(terminalReason);stopped=true;token='';socket.close();return;}
  if(s.type==='unavailable'){clear(s.reason);status(s.reason);return;}
  if(s.type!=='state'||s.protocol!==1||!Number.isSafeInteger(s.sequence)||typeof s.epoch!=='string')throw Error('不支持的数据协议');
  if(epoch===s.epoch&&s.sequence<=lastSequence)return;epoch=s.epoch;lastSequence=s.sequence;lastStateAt=Date.now();
  if(latestState?.epoch===s.epoch&&latestState.wave!==s.wave)positionReadyAt=Date.now()+320;latestState=s;orderSamples?.state(s);if(switchSafe()){trackerWrite('arm');switcher.update(s);}else{switcher.cancel('已离开观战状态');trackerWrite('disarm');}sendState(switchPacket(s));hasState=controls.visible&&(s.phase==='live'||s.phase==='ended');follow();
  status(s.phase==='preparing'?'已连接：准备阶段，等待 6 人类 + 3 SCP（教程不计入）':s.phase==='ended'?'半场结束':`已连接 · 第 ${s.wave} 波${s.paused?' · 计时暂停':''}${!controls.visible?' · HUD 已隐藏（本地按键切换）':''}${game.found?'':' · 等待 SCPSL 游戏窗口'}`);
 }catch(e){clear('数据错误');status('数据错误：'+e.message);}});
 socket.addEventListener('error',()=>{if(myGeneration===generation){terminalReason=url.startsWith('wss:')?'连接失败，请检查地址、证书、TCP 端口与服务器插件':'连接失败，请检查服务器 IP、TCP 端口是否开放，以及服务器插件是否启动';status(terminalReason);}});
 socket.addEventListener('close',e=>{if(myGeneration!==generation)return;clear('连接已断开');if(e.code===1008){stopped=true;token='';status('游戏连接结束或配对失效，请进入 OW 获取新配对码');return;}
  if(!stopped&&token){status('连接中断，3 秒后重连…');retryTimer=setTimeout(()=>openSocket(),3000);}else status(terminalReason||'未连接，请输入新的配对码');});
}
function disconnect(){stopped=true;generation++;clearTimeout(retryTimer);token='';ws?.close();ws=null;clear('未连接');status('已断开');}
app.whenReady().then(()=>{
 orderSamples=new OrderSamples(path.join(app.getPath('userData'),'order-samples'),{onError:message=>{console.error(message);settingsWindow?.webContents.send('mz:switch-result',{ok:false,reason:message});}});
 bindings=hotkeys.load(readPreferences().keybindings);
 settingsWindow=new BrowserWindow({width:620,height:920,show:!selfTest,resizable:false,title:'MZ 观战覆盖软件',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 overlay=new BrowserWindow({width:1280,height:720,show:false,transparent:true,frame:false,focusable:false,resizable:false,skipTaskbar:true,hasShadow:false,alwaysOnTop:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 overlay.setIgnoreMouseEvents(true,{forward:true});overlay.setAlwaysOnTop(true,'screen-saver');
 for(const w of [settingsWindow,overlay]){w.webContents.setWindowOpenHandler(()=>({action:'deny'}));w.webContents.on('will-navigate',e=>e.preventDefault());}
 const pagesReady=Promise.all([overlay.loadFile(path.join(__dirname,'ui/index.html'),{query:{live:'1'}}),settingsWindow.loadFile(path.join(__dirname,'settings.html'))]);
 tracker=spawn(path.join(__dirname,'WindowTracker.exe'),[],{windowsHide:true,stdio:['pipe','pipe','ignore']});
 tracker.stdin.on('error',()=>status('本地按键监听已中断，请重开软件'));updateTrackerKeys();
 try{configureSwitch(readPreferences().switchOptions||switchOptions);}catch{configureSwitch({enabled:false,cycle:1,previous:2});}
 readline.createInterface({input:tracker.stdout}).on('line',line=>{try{const message=JSON.parse(line);if(message.type==='select'){sampleEvent('select-request',{number:message.number,permitted:switchSafe(),sequence:latestState?.sequence});if(switchSafe()){trackerWrite('arm');switcher.start(message.number,latestState);}else if(Date.now()<positionReadyAt)settingsWindow?.webContents.send('mz:switch-result',{ok:false,reason:'卡片正在换位，请在动画结束后选择'});return;}if(message.type==='step-result'){sampleEvent('input-release',{requestId:message.id,ok:message.ok});switcher.acknowledge(message.id,message.ok);if(switchSafe())switcher.update(latestState);return;}if(message.type==='switch-cancel'){switcher.cancel('手动操作、菜单或窗口状态变化');return;}if(message.type==='hotkey'){toggleLocal(message.action);return;}game=message;if(!game.foreground||!game.found){switcher.cancel('游戏失去焦点');trackerWrite('disarm');}follow();}catch{}});
 tracker.on('error',e=>status('游戏窗口检测失败：'+e.message));tracker.on('exit',()=>{game={found:false};follow();});
 switchTimer=setInterval(()=>{if(switcher.job&&switchSafe())switcher.update(latestState);},5);
 healthTimer=setInterval(()=>{switcher.tick();if(!switchSafe()){switcher.cancel('观战数据过期或窗口状态变化');trackerWrite('disarm');}if(lastStateAt&&Date.now()-lastStateAt>2500){clear('服务器数据超时');status('数据超时，HUD 已隐藏');}},500);
 ipcMain.handle('mz:settings',()=>({...readPreferences(),keybindings:bindings,switchOptions,orderSampleDirectory:orderSamples?.root}));
 ipcMain.handle('mz:switch-options',(e,value)=>{if(e.sender!==settingsWindow.webContents)throw Error('Invalid sender');configureSwitch(value);savePreferences({switchOptions});return switchOptions;});
 ipcMain.handle('mz:keybindings',(_e,value)=>{if(_e.sender!==settingsWindow.webContents)throw Error('Invalid sender');const next=hotkeys.validate(value);if(switchOptions.enabled&&Object.values(next).some(k=>/^(Digit|Numpad)[1-9]$/.test(k)))throw Error('主键盘/小键盘 1–9 已用于选人');if(switchOptions.enabled&&Object.values(next).some(k=>[switchOptions.cycle,switchOptions.previous].includes(hotkeys.keys[k]?.vk)))throw Error('不能与游戏观战切换键重复');bindings=next;savePreferences({keybindings:bindings});updateTrackerKeys();return bindings;});
 ipcMain.handle('mz:connect',(_e,s)=>{
  if(_e.sender!==settingsWindow.webContents)throw Error('Invalid sender');
  const u=new URL(String(s.url));if(!['wss:','ws:'].includes(u.protocol)||u.username||u.password)throw Error('请输入 ws:// 或 wss:// 地址');
  if(u.protocol==='ws:'&&!['localhost','127.0.0.1','[::1]'].includes(u.hostname)&&!s.allowLan)throw Error('请勾选“允许使用 ws:// 未加密连接”，即可通过服务器 IP 连接');
  if(!/^(?:[0-9]{4}|[0-9a-f]{16})$/i.test(String(s.code).trim()))throw Error('请输入游戏返回的 4 位数字配对码（也兼容旧版 16 位码）');
  disconnect();url=u.href;stopped=false;savePreferences({url,allowLan:!!s.allowLan,keybindings:bindings});openSocket(String(s.code).trim().toUpperCase());return true;
 });
 ipcMain.handle('mz:disconnect',e=>{if(e.sender===settingsWindow.webContents)disconnect();});
 settingsWindow.on('closed',()=>app.quit());
 if(selfTest)pagesReady.then(async()=>{
  const result={webSocket:typeof WebSocket==='function',renderer:await overlay.webContents.executeJavaScript("(async()=>({bridge:!!window.mzHost,live:!!window.MZLive,hidden:document.getElementById('stage').hidden,background:getComputedStyle(document.body).backgroundColor,assets:(await uiReady()).missing}))()"),settings:await settingsWindow.webContents.executeJavaScript('!!window.mzHost')};
  fs.writeFileSync(process.env.MZ_SELF_TEST_OUTPUT||path.join(app.getPath('userData'),'self-test.json'),JSON.stringify(result,null,2));app.quit();
 }).catch(e=>{console.error(e);app.exit(1)});
});
app.on('before-quit',()=>{disconnect();clearInterval(healthTimer);clearInterval(switchTimer);tracker?.kill();});
app.on('window-all-closed',()=>app.quit());
