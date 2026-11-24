const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {numberOf}=require('./spectator-switch.cjs');
// Preserve evidence, not an inferred full client list. Never serialize credentials.
class OrderSamples {
 constructor(root,{kind='live-telemetry',onError=()=>{}}={}){this.root=root;this.kind=kind;this.onError=onError;this.session=null;this.previous=null;this.index=0;}
 open(){if(this.session)return;this.session=path.join(this.root,new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID());fs.mkdirSync(this.session,{recursive:true});this.file=path.join(this.session,'events.jsonl');}
 write(type,data){try{this.open();fs.appendFileSync(this.file,JSON.stringify({schema:1,captureKind:this.kind,eventIndex:++this.index,utc:new Date().toISOString(),type,...data})+'\n','utf8');}catch(e){this.onError('顺序样本写入失败：'+e.message);}}
 event(type,data={}){this.write(type,data);}
 state(s){
  const frame={epoch:s.epoch,sequence:s.sequence,serverTimeMs:s.serverTimeMs,wave:s.wave,phase:s.phase,observerActorId:s.observerActorId,observerNetworkId:s.observerNetworkId,observerRole:s.observerRole,observedActorId:s.observedActorId,
   serverCardOrder:[...(s.order||[])],players:(s.players||[]).map(p=>({slot:p.id,screenPosition:numberOf(p,s),actorId:p.actorId,networkId:p.networkId,lifeId:p.lifeId,name:p.name,role:p.role,rolePriority:p.rolePriority,spawnOrder:p.spawnOrder,alive:p.alive,dead:p.dead}))};
  const old=this.previous,changes=[];
  if(!old)changes.push('initial');else{
   for(const key of ['epoch','wave','phase','observerActorId','observerRole'])if(old[key]!==frame[key])changes.push(key);
   if(JSON.stringify(old.serverCardOrder)!==JSON.stringify(frame.serverCardOrder))changes.push('server-card-order');
   if(JSON.stringify(old.players)!==JSON.stringify(frame.players))changes.push('roster-name-role-life');
  }
  if(changes.length)this.write('snapshot',{changes,provenance:'server telemetry; serverCardOrder is NOT the native client list',previousSequence:old?.sequence,frame});
  if(old&&old.epoch===frame.epoch&&old.observedActorId!==frame.observedActorId)this.write('observed-transition',{provenance:'server-reported client target; partial observation, not complete list',from:old.observedActorId,to:frame.observedActorId,previousSequence:old.sequence,frame});
  this.previous=frame;
 }
 reset(reason){if(this.session)this.write('connection-boundary',{reason});this.previous=null;}
}
module.exports={OrderSamples};
