const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{},performance};context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/map-camera.js','utf8'),context);
const {createMapCamera,selectMapFocusPlayers,MZ_MAP_VIEW}=context,camera=createMapCamera(),opt={focus:true};
const rooms=[{room_id:'origin',x:0,z:0},{room_id:'near',x:15,z:0},{room_id:'limit',x:30,z:0},{room_id:'beyond',x:45,z:0},{room_id:'diagonal',x:30,z:15}];
const anchor={id:'H01',x:0,y:0,roomId:'origin'};
const players=[anchor,{id:'H02',x:28,y:0,roomId:'near'},{id:'S01',x:73,y:0,roomId:'limit'},{id:'S02',x:76,y:0,roomId:'beyond'},{id:'S03',x:60,y:-30,roomId:'diagonal'}];
assert.deepEqual(Array.from(selectMapFocusPlayers(players,anchor,rooms),p=>p.id),['H01','H02','S01'],'Room membership, not distance from the door or player, determines inclusion; 2 rooms is a hard limit.');
const wide=camera.update([{x:0,y:0},{x:60,y:0}],'HCZ_EZ',0,opt);
const oneRoom=camera.update([{x:0,y:0},{x:14,y:14}],'HCZ_EZ',1,opt);assert(oneRoom.scale>=wide.scale);assert.equal(oneRoom.scale,(Math.min(MZ_MAP_VIEW.width,MZ_MAP_VIEW.height)-48)/90);assert.equal(oneRoom.waitMs,0);
const closer=camera.update([{x:0,y:0},{x:7,y:7}],'HCZ_EZ',2,opt);assert.equal(closer.scale,oneRoom.scale);
const p1={x:closer.tx,y:closer.ty},p2={x:7*closer.scale+closer.tx,y:7*closer.scale+closer.ty};assert(p1.x>24&&p1.y>24);assert(p2.x<MZ_MAP_VIEW.width-24&&p2.y<MZ_MAP_VIEW.height-24);
const singleton=camera.update([{x:1,y:1}],'LCZ',4,opt);assert(Number.isFinite(singleton.scale));assert(singleton.scale>0);
const coLocated=camera.update([{x:1,y:1},{x:1,y:1}],'LCZ',5,opt);assert.equal(singleton.scale,coLocated.scale);
camera.reset();const a=camera.update([{x:-100,y:-100},{x:100,y:100}],'HCZ_EZ',6,opt);for(let i=0;i<30;i++)assert.equal(camera.update([{x:-100+Math.sin(i)*.1,y:-100},{x:100,y:100}],'HCZ_EZ',10+i,opt).scale,a.scale);
console.log('PASS: strict two-room radius; full room membership; actual player bounds; one-room and coincident clusters stop at three-room context; margins; singleton; jitter suppression.');

const contextFrame=context.singlePlayerMapFrame({...anchor,x:12,y:7},rooms);assert.equal(contextFrame[0].x,-45);assert.equal(contextFrame[1].x,45);assert.equal(contextFrame[0].y,-45);assert.equal(contextFrame[1].y,45);
const contextView=camera.update(contextFrame,'HCZ_EZ',100,{focus:true,selectionKey:'single'});assert(contextView.scale<5&&contextView.scale>3);
