// One input per acknowledged target change; never guess the client's list order.
const numberOf=p=>/^H0[1-6]$/.test(p.id)?Number(p.id.slice(1)):/^S0[1-3]$/.test(p.id)?6+Number(p.id.slice(1)):null;
const allowed=s=>s&&['Spectator','Overwatch'].includes(s.observerRole)&&['live','ended'].includes(s.phase);
class Switcher {
 constructor({step,report,now=()=>Date.now()}){Object.assign(this,{step,report,now});this.job=null;this.serial=0;}
 cancel(reason){if(!this.job)return;this.job=null;this.report({ok:false,reason});}
 start(number,state){this.cancel('已改选目标');const p=state?.players?.find(p=>numberOf(p)===number);
  if(!allowed(state)||!p||p.dead||p.alive===false)return this.report({ok:false,reason:'目标不可用或当前不是观察者 / OW'});
  this.job={actor:p.actorId,life:p.lifeId,epoch:state.epoch,role:state.observerRole,started:this.now(),steps:0,seen:new Set(),waiting:false};this.update(state);
 }
 update(s){const j=this.job;if(!j)return;const t=this.now(),p=s.players?.find(p=>p.actorId===j.actor&&p.lifeId===j.life&&!p.dead&&p.alive!==false);
  if(!allowed(s)||s.observerRole!==j.role||s.epoch!==j.epoch||!p)return this.cancel('角色、回合或目标已改变');
  if(s.observedActorId===j.actor){this.job=null;this.report({ok:true,steps:j.steps,elapsedMs:t-j.started,actor:j.actor});return;}
  if(t-j.started>=8000)return this.cancel('超过 8 秒，已停止');
  if(j.waiting){if(!j.ack)return;if(s.observedActorId===j.before){if(t-j.sent>=1200)this.cancel('切换未得到确认，请检查游戏切换键或菜单');return;}if(t-j.sent<160)return;j.waiting=false;}
  const current=s.observedActorId||'<none>';if(j.seen.has(current))return this.cancel('已循环一圈，目标不可观战');
  if(j.steps>=32)return this.cancel('达到最大切换次数');j.seen.add(current);j.before=s.observedActorId;j.sent=t;j.waiting=true;j.ack=false;j.id=++this.serial;j.steps++;this.step(j.id);
 }
 acknowledge(id,ok){if(this.job?.id!==id)return;if(!ok)return this.cancel('输入已被安全检查拦截');this.job.ack=true;}
 tick(){if(this.job&&this.now()-this.job.sent>=1200)this.cancel('输入或观战回传超时');}
}
module.exports={Switcher,numberOf,allowed};
