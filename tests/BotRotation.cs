using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using NetworkManagerUtils.Dummies;
using PlayerRoles;
using LabApi.Features.Wrappers;
using UnityEngine;

public sealed partial class BotRehearsal {
 public void RotateScps(){
  if(bots.Count!=9&&bots.Count!=12)throw new InvalidOperationException("Prepare the six humans and three SCPs first.");
  if(Enumerable.Range(0,6).Any(i=>!P(i).IsAlive))throw new InvalidOperationException("All six human slots must be alive for this rotation test.");
  Stop();oldRoundLock=Round.IsLocked;Round.IsLocked=true;
  var active=Enumerable.Range(6,bots.Count-6).Where(i=>P(i).IsAlive).ToArray();if(active.Length!=3)throw new InvalidOperationException("Exactly three active SCPs required.");
  CaptureOrder("rotation-before",true);
  if(bots.Count==9){
   int seed=Guid.NewGuid().GetHashCode();var extra=DummyIdentity.Create(seed).Where(x=>!identities.Any(y=>y.BaseName==x.BaseName)).Take(3).ToArray();if(extra.Length!=3)throw new Exception("Cannot create distinct reserve names.");
   identities=identities.Concat(extra).ToArray();
   for(int i=9;i<12;i++){bots.Add(DummyUtils.SpawnDummy(identities[i].BaseName));P(i).SetRole(RoleTypeId.Spectator,RoleChangeReason.RemoteAdmin,RoleSpawnFlags.None);CaptureOrder("reserve-joined-unselected:seed="+seed+":index="+i,true);}
  }
  var next=Enumerable.Range(6,6).Except(active).ToArray();timeline.Clear();cursor=0;began=Time.time;running=true;phase="rotating-scp-reserves";
  At(2,"reserve faction selection",()=>{foreach(int i in next){identities[i].Select("SCP");RenameBot(i);CaptureOrder("reserve-faction-selected:"+i,true);}});
  At(4,"old SCPs die",()=>{foreach(int i in active){P(i).IsGodModeEnabled=false;P(i).Kill("SCP reserve rotation test");}CaptureOrder("rotation-old-scp-dead",true);});
  At(8,"new SCPs replace empty slots",()=>{
   RoleTypeId[] roles={RoleTypeId.Scp939,RoleTypeId.Scp049,RoleTypeId.Scp173};
   for(int j=0;j<3;j++){int i=next[j];P(i).SetRole(roles[j],RoleChangeReason.RemoteAdmin,RoleSpawnFlags.None);RenameBot(i);P(i).Position=setupSpawns.Count>=9?setupSpawns[6+j]:origin+new Vector3(j*3,0,14);P(i).Health=P(i).MaxHealth;P(i).HumeShield=0;CaptureOrder("replacement-spawned:"+i,true);}
   CaptureOrder("rotation-complete-six-humans-six-scp-identities-three-active",true);phase="rotation complete; 12 identities, 9 alive";Dump();
  });
 }
}
