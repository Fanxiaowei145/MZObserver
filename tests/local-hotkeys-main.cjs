const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{EventEmitter}=require('node:events');
const root=path.resolve(__dirname,'..'),hotkeys=require('../desktop/hotkeys.cjs');
const prefs=path.join(root,'output/tests/local-hotkeys-main');fs.mkdirSync(prefs,{recursive:true});fs.writeFileSync(path.join(prefs,'settings.json'),JSON.stringify({url:'ws://127.0.0.1:28481/mz',allowLan:true,keybindings:{visibility:'F8',zoom:null}}));
const ipc=new Map(),windows=[],writes=[];let lines,ready;
class W extends EventEmitter{constructor(){super();this.visible=false;this.bounds={x:0,y:0,width:1280,height:720};this.messages=[];this.webContents=new EventEmitter();this.webContents.setWindowOpenHandler=()=>{};this.webContents.send=(c,s)=>this.messages.push([c,s]);windows.push(this);}loadFile(){return Promise.resolve();}isDestroyed(){return false;}hide(){this.visible=false;}showInactive(){this.visible=true;}isVisible(){return this.visible;}getBounds(){return this.bounds;}setBounds(b){this.bounds=b;}setIgnoreMouseEvents(){}setAlwaysOnTop(){}}
class Socket extends EventEmitter{constructor(){super();Socket.last=this;}addEventListener(n,f){this.on(n,f);}send(){}close(){}}
const tracker=new EventEmitter();tracker.stdin=new EventEmitter();tracker.stdin.writable=true;tracker.stdin.write=s=>writes.push(s);tracker.stdout={};tracker.kill=()=>{};
const app={getPath:()=>prefs,whenReady:()=>({then:fn=>{ready=fn}}),on(){},quit(){}};
const ctx={URL,require:n=>n==='electron'?{app,BrowserWindow:W,ipcMain:{handle:(n,f)=>ipc.set(n,f)},screen:{screenToDipRect:(_w,b)=>b}}:n==='ws'?Socket:n==='node:child_process'?{spawn:()=>tracker}:n==='node:readline'?{createInterface:()=>({on:(_e,f)=>lines=f})}:n==='./hotkeys.cjs'?hotkeys:n==='./target-feedback.cjs'?require('../desktop/target-feedback.cjs'):n==='./spectator-switch.cjs'?require('../desktop/spectator-switch.cjs'):n==='./order-samples.cjs'?{OrderSamples:class extends require('../desktop/order-samples.cjs').OrderSamples{constructor(root,options){super(root,{...options,kind:'synthetic-main-integration'});}}}:require(n),__dirname:path.join(root,'desktop'),process:{argv:[],env:{}},setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},console};
vm.runInNewContext(fs.readFileSync(path.join(root,'desktop/main.cjs'),'utf8'),ctx);ready();const settings=windows[0],overlay=windows[1],event={sender:settings.webContents};
assert.ok(writes.includes('keys 119 0 0\n')); 
assert.throws(()=>ipc.get('mz:keybindings')(event,{visibility:'F8',zoom:'F8'}));assert.throws(()=>ipc.get('mz:keybindings')({sender:{}},{visibility:null,zoom:null}));
ipc.get('mz:keybindings')(event,{visibility:'KeyG',zoom:'KeyH'});assert.equal(writes.at(-1),'keys 71 72 0\n');
ipc.get('mz:connect')(event,{url:'ws://127.0.0.1:28481/mz',code:'1234',allowLan:true});
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(prefs,'settings.json'))).keybindings,{visibility:'KeyG',zoom:'KeyH'});
lines(JSON.stringify({found:true,foreground:true,x:0,y:0,width:1920,height:1080}));
const state={type:'state',protocol:1,sequence:1,epoch:'test',phase:'live',wave:1,uiVisible:false,zoom:true};Socket.last.emit('message',{data:JSON.stringify(state)});
const packet=()=>overlay.messages.filter(x=>x[0]==='mz:state').at(-1)[1];assert.equal(packet().uiVisible,true);assert.equal(packet().zoom,false);assert.equal(overlay.visible,true);
lines('{"type":"hotkey","action":"visibility"}');assert.equal(overlay.visible,false);assert.equal(packet().type,'local-controls');
state.sequence++;Socket.last.emit('message',{data:JSON.stringify(state)});assert.equal(packet().uiVisible,false);assert.equal(overlay.visible,false);
lines('{"type":"hotkey","action":"visibility"}');assert.equal(overlay.visible,true);
lines('{"type":"hotkey","action":"zoom"}');assert.equal(packet().zoom,true);
state.zoom=false;state.sequence++;Socket.last.emit('message',{data:JSON.stringify(state)});assert.equal(packet().zoom,true);
Socket.last.emit('message',{data:'{"type":"unavailable","reason":"timeout"}'});lines('{"type":"hotkey","action":"visibility"}');lines('{"type":"hotkey","action":"visibility"}');assert.equal(overlay.visible,false);
ipc.get('mz:keybindings')(event,{visibility:null,zoom:null});assert.equal(writes.at(-1),'keys 0 0 0\n');assert.deepEqual(hotkeys.load(JSON.parse(fs.readFileSync(path.join(prefs,'settings.json'))).keybindings),{visibility:null,zoom:null});
console.log('PASS main integration: local overrides, immediate toggles, stale data hidden, persist/reconnect, duplicate rejection, unbind, IPC sender');


const optionHandler=ipc.get('mz:switch-options');
assert.throws(()=>optionHandler({sender:{}},{enabled:true,cycle:1}));
assert.throws(()=>optionHandler(event,{enabled:true,cycle:49}));
optionHandler(event,{enabled:true,cycle:1});
assert.throws(()=>ipc.get('mz:keybindings')(event,{visibility:'Digit1',zoom:'KeyB'}));
lines(JSON.stringify({found:true,foreground:true,x:0,y:0,width:1280,height:720}));
for(const role of ['Spectator','Overwatch']){
 const live={...state,sequence:state.sequence+10,observerRole:role,observedActorId:'A',players:[{id:'H01',actorId:'A',lifeId:1,alive:true},{id:'H02',actorId:'B',lifeId:1,alive:true}]};
 Socket.last.emit('message',{data:JSON.stringify(live)});lines('{"type":"select","number":2}');
 const step=writes.filter(x=>x.startsWith('step ')).at(-1);assert.ok(step);const id=Number(step.trim().split(' ')[1]);
 lines(JSON.stringify({type:'step-result',id,ok:true}));live.sequence++;live.observedActorId='B';Socket.last.emit('message',{data:JSON.stringify(live)});
 assert.equal(settings.messages.filter(x=>x[0]==='mz:switch-result').at(-1)[1].ok,true);
 assert.equal(packet().players[1].shortcutNumber,2);state.sequence=live.sequence;
}
console.log('PASS switch main IPC/telemetry integration for Spectator and Overwatch');

assert.throws(()=>optionHandler(event,{enabled:true,cycle:1,previous:1}));
assert.throws(()=>optionHandler(event,{enabled:true,cycle:1,previous:49}));
const backState={...state,sequence:state.sequence+20,observerRole:'Overwatch',observedActorId:'B',players:[{id:'H01',actorId:'A',lifeId:1,alive:true},{id:'H02',actorId:'B',lifeId:1,alive:true}]};
Socket.last.emit('message',{data:JSON.stringify(backState)});lines('{"type":"select","number":1}');
assert.match(writes.filter(x=>x.startsWith('step ')).at(-1),/ -1\n$/);
console.log('PASS reverse command dispatch and conflicting navigation binding rejection');

// Fast confirmations bypass the full-state cadence but never its identity binding.
for(const role of ['Spectator','Overwatch']){
 const live={...state,sequence:state.sequence+100,serverTimeMs:1000,observerActorId:'viewer',observerNetworkId:42,observerRole:role,observedActorId:'A',players:[{id:'H01',actorId:'A',lifeId:1,alive:true},{id:'H02',actorId:'B',lifeId:2,alive:true}]};
 Socket.last.emit('message',{data:JSON.stringify(live)});lines('{"type":"select","number":2}');
 const id=Number(writes.filter(x=>x.startsWith('step ')).at(-1).trim().split(' ')[1]);
 const feedback={type:'target-feedback',protocol:1,epoch:live.epoch,baseSequence:live.sequence,serverTimeMs:1016,observerActorId:'viewer',observerNetworkId:42,observerRole:role,observedActorId:'B',observedLifeId:2};
 const count=()=>settings.messages.filter(x=>x[0]==='mz:switch-result').length;const before=count();
 Socket.last.emit('message',{data:JSON.stringify({...feedback,observedLifeId:1})});assert.equal(count(),before);
 Socket.last.emit('message',{data:JSON.stringify(feedback)});assert.equal(count(),before,'must await key release');
 lines(JSON.stringify({type:'step-result',id,ok:true}));assert.equal(count(),before+1);assert.equal(settings.messages.filter(x=>x[0]==='mz:switch-result').at(-1)[1].ok,true);
 state.sequence=live.sequence;
}
console.log('PASS fast feedback integration: both observer roles, life check, no success before input release');

for(let n=1;n<=9;n++){
 assert.throws(()=>ipc.get('mz:keybindings')(event,{visibility:'Numpad'+n,zoom:'KeyB'}));
 assert.throws(()=>optionHandler(event,{enabled:true,cycle:96+n,previous:2}));
 assert.throws(()=>optionHandler(event,{enabled:true,cycle:1,previous:96+n}));
}
optionHandler(event,{enabled:false,cycle:1,previous:2});ipc.get('mz:keybindings')(event,{visibility:'Numpad1',zoom:'KeyB'});assert.throws(()=>optionHandler(event,{enabled:true,cycle:1,previous:2}));
console.log('PASS numpad 1-9 conflicts for local hotkeys, cycle/previous bindings, enable-time checks');

assert.equal(hotkeys.Controls.prototype.toggle.call(new hotkeys.Controls(),'rotate'),false);assert.equal(hotkeys.load({visibility:'KeyV',zoom:'KeyB',rotate:'KeyC'}).rotate,undefined);console.log('PASS removed rotation and legacy preference migration');
