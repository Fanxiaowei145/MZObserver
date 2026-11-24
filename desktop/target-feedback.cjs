// An early target confirmation may extend only its exact full-state baseline.
function applyFeedback(state,packet){
 if(!state||packet.protocol!==1||packet.epoch!==state.epoch||packet.baseSequence!==state.sequence||
 packet.observerActorId!==state.observerActorId||packet.observerNetworkId!==state.observerNetworkId||packet.observerRole!==state.observerRole||
 !['Spectator','Overwatch'].includes(state.observerRole)||!Number.isFinite(packet.serverTimeMs)||packet.serverTimeMs<=state.serverTimeMs)return null;
 const target=state.players?.find(p=>p.actorId===packet.observedActorId&&p.lifeId===packet.observedLifeId&&!p.dead&&p.alive!==false);
 if(!target)return null;
 return {...state,observedActorId:packet.observedActorId,serverTimeMs:packet.serverTimeMs};
}
module.exports={applyFeedback};
