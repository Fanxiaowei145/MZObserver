// One input per acknowledged target change; never guess the client's list order.
const numberOf=(p,s)=>{const ids=Array.isArray(s?.order)?s.order:null;if(ids&&new Set(ids).size===ids.length&&ids.includes(p.id)){const group=ids.filter(id=>id[0]===p.id[0]);return (p.id[0]==='S'?6:0)+group.indexOf(p.id)+1;}return /^H0[1-6]$/.test(p.id)?Number(p.id.slice(1)):/^S0[1-3]$/.test(p.id)?6+Number(p.id.slice(1)):null;};
const allowed=s=>s&&['Spectator','Overwatch'].includes(s.observerRole)&&['live','ended'].includes(s.phase);
class Switcher {
 constructor({step,report,recover=()=>{},now=()=>Date.now()}){Object.assign(this,{step,report,recover,now});this.job=null;this.serial=0;this.routes=new Map();this.routeKey=null;this.routePeople=new Map();this.routeContext=null;}
 invalidate(){this.routes.clear();this.routeKey=null;this.routePeople=new Map();this.routeContext=null;}
 syncRoute(s){
  const context=JSON.stringify([s.epoch,s.observerRole]);const people=new Map((s.players||[]).filter(p=>!p.dead&&p.alive!==false).map(p=>[p.actorId,JSON.stringify([p.lifeId,p.role])]));
  const key=JSON.stringify([context,[...people].sort()]);if(key===this.routeKey)return;
  if(this.routeContext!==context)this.routes.clear();else{
   const changed=new Set([...this.routePeople.keys(),...people.keys()].filter(id=>this.routePeople.get(id)!==people.get(id)));
   for(const [from,edges] of this.routes){if(changed.has(from)){this.routes.delete(from);continue;}for(const [direction,to] of edges)if(changed.has(to))edges.delete(direction);if(!edges.size)this.routes.delete(from);}
  }
  this.routePeople=people;this.routeContext=context;this.routeKey=key;
 }

 learn(from,to,direction){if(!from||!to||from===to)return;for(const [a,b,d] of [[from,to,direction],[to,from,-direction]]){if(!this.routes.has(a))this.routes.set(a,new Map());this.routes.get(a).set(d,b);}}
 route(from,target){const q=[{actor:from,path:[]}],seen=new Set([from]);while(q.length){const n=q.shift();if(n.actor===target)return n.path;for(const [direction,actor] of this.routes.get(n.actor)||[]){if(!seen.has(actor)){seen.add(actor);q.push({actor,path:[...n.path,{direction,actor}]});}}}return null;}
 cancel(reason){if(!this.job)return;this.job=null;this.report({ok:false,reason});}
 start(number,state){const p=state?.players?.find(p=>numberOf(p,state)===number);
  if(!allowed(state)||!p||p.dead||p.alive===false){this.cancel('目标不可用或当前不是观察者 / OW');return this.report({ok:false,reason:'目标不可用或当前不是观察者 / OW'});}
  if(this.job&&this.job.epoch===state.epoch&&this.job.role===state.observerRole){this.job.actor=p.actorId;this.job.life=p.lifeId;this.job.position=number;this.job.seen.clear();return;}
  this.cancel('已改选目标');this.job={position:number,actor:p.actorId,life:p.lifeId,epoch:state.epoch,role:state.observerRole,started:this.now(),steps:0,seen:new Set(),waiting:false};this.update(state);
 }
 update(s){this.syncRoute(s);const j=this.job;if(!j)return;const t=this.now(),p=s.players?.find(p=>p.actorId===j.actor&&p.lifeId===j.life&&!p.dead&&p.alive!==false);
  const occupant=s.players?.find(p=>numberOf(p,s)===j.position);if(!occupant||occupant.actorId!==j.actor||occupant.lifeId!==j.life)return this.cancel('该屏幕位置的玩家已变化，请重新选择');
  if(!allowed(s)||s.observerRole!==j.role||s.epoch!==j.epoch||!p)return this.cancel('角色、回合或目标已改变');
  if(t-j.started>=8000)return this.cancel('超过 8 秒，已停止');
  if(j.waiting){if(!j.ack)return;if(s.observedActorId===j.before){if(t-j.sent>=1200)this.cancel('切换未得到确认，请检查游戏切换键或菜单');return;}if(s.observedActorId!==j.actor&&t-j.released<20)return;j.waiting=false;
   const changed=j.routeKey!==this.routeKey,mismatch=j.expected&&j.expected!==s.observedActorId;
   if(changed||mismatch){
    // Restart discovery from the confirmed camera target, never from the stale prediction.
    // Keep the original time/step budget and hold one direction until this request finishes.
    this.routes.clear();j.seen.clear();j.searchDirection=j.direction;j.recoveries=(j.recoveries||0)+1;
    this.recover({reason:changed?'roster-changed':'prediction-mismatch',from:j.before,expected:j.expected,actual:s.observedActorId,target:j.actor,position:j.position,steps:j.steps});
   }
   if(!changed)this.learn(j.before,s.observedActorId,j.direction);
  }
  if(s.observedActorId===j.actor){this.job=null;this.report({ok:true,steps:j.steps,elapsedMs:t-j.started,actor:j.actor,recoveries:j.recoveries||0});return;}
  const current=s.observedActorId||'<none>';if(j.seen.has(current))return this.cancel('已循环一圈，目标不可观战');
  if(j.steps>=32)return this.cancel('达到最大切换次数');j.seen.add(current);j.before=s.observedActorId;j.sent=t;j.waiting=true;j.ack=false;j.id=++this.serial;j.steps++;const known=j.searchDirection?null:this.route(current,j.actor);const route=known&&known.length<=Math.floor(s.players.filter(p=>!p.dead&&p.alive!==false).length/2)?known:null;j.direction=j.searchDirection||route?.[0]?.direction||1;j.expected=route?.[0]?.actor||null;j.routeKey=this.routeKey;this.step(j.id,j.direction);
 }
 acknowledge(id,ok){if(this.job?.id!==id||this.job.ack)return;if(!ok)return this.cancel('输入已被安全检查拦截');this.job.ack=true;this.job.released=this.now();}
 tick(){if(this.job&&this.now()-this.job.sent>=1200)this.cancel('输入或观战回传超时');}
}
module.exports={Switcher,numberOf,allowed};
