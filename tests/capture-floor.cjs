// Read-only diagnostic client. Pair through a fresh authorized OW code on stdin.
// Never save the pairing code, session token, Steam IDs or player nicknames.
const fs=require('node:fs'),path=require('node:path'),readline=require('node:readline');
const WebSocket=require('../desktop/node_modules/ws');
const dir=path.resolve(__dirname,'../output/floor-diagnostic');fs.mkdirSync(dir,{recursive:true});
const input=readline.createInterface({input:process.stdin});
input.once('line',line=>{
 input.close();const code=line.trim();if(!/^(?:[0-9]{4}|[0-9a-f]{16})$/i.test(code))throw Error('Expected a fresh 4-digit code (legacy 16-character code also accepted)');
 const ws=new WebSocket('ws://127.0.0.1:28481/mz');let rooms=[],samples=[],last=0,done=false;
 const finish=()=>{if(done)return;done=true;clearTimeout(timer);ws.close();const file=path.join(dir,'capture-'+Date.now()+'.json');fs.writeFileSync(file,JSON.stringify({rooms,samples},null,2));console.log(JSON.stringify({file,samples:samples.length,last:samples.at(-1)},null,2));};
 const timer=setTimeout(finish,20000);
 ws.on('open',()=>ws.send(JSON.stringify({code})));
 ws.on('message',raw=>{const s=JSON.parse(String(raw));if(s.type==='layout'){rooms=s.rooms;return;}if(s.type==='error'){console.log(s.message);finish();return;}
  if(s.type!=='state'||Date.now()-last<500)return;last=Date.now();
  const players=s.players.map(p=>({id:p.id,observed:p.actorId===s.observedActorId,role:p.role,alive:p.alive,dead:p.dead,x:p.x,y:p.y,roomId:p.roomId,plane:p.plane,mapMarkerHidden:p.mapMarkerHidden,camera:p.camera,room:rooms.find(r=>r.room_id===p.roomId)?.name}));
  samples.push({time:Date.now(),phase:s.phase,keys:Object.keys(s.players[0]||{}),players});
 });
 ws.on('error',e=>{console.log(e.message);finish();});ws.on('close',finish);
});
