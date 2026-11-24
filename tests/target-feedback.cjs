const assert=require('node:assert/strict');const {applyFeedback}=require('../desktop/target-feedback.cjs');
for(const role of ['Spectator','Overwatch']){
 const state={epoch:'round',sequence:10,serverTimeMs:1000,observerActorId:'viewer',observerNetworkId:1,observerRole:role,observedActorId:'A',players:[{actorId:'B',lifeId:23,alive:true}]};
 const p={protocol:1,epoch:'round',baseSequence:10,serverTimeMs:1016,observerActorId:'viewer',observerNetworkId:1,observerRole:role,observedActorId:'B',observedLifeId:23};
 assert.equal(applyFeedback(state,p).observedActorId,'B');assert.equal(state.observedActorId,'A');
 for(const patch of [{protocol:2},{epoch:'old'},{baseSequence:9},{baseSequence:11},{serverTimeMs:999},{serverTimeMs:1000},{serverTimeMs:NaN},{observerActorId:'other'},{observerNetworkId:2},{observerRole:'NtfPrivate'},{observedActorId:'X'},{observedLifeId:24}])assert.equal(applyFeedback(state,{...p,...patch}),null);
 assert.equal(applyFeedback({...state,players:[{actorId:'B',lifeId:23,dead:true}]},p),null);
 assert.equal(applyFeedback(applyFeedback(state,p),p),null);
}
console.log('PASS fast feedback identity, epoch, exact baseline, monotonic time, life, death, replay, both roles');
