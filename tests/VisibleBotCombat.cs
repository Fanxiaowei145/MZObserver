// Visible rehearsal: native movement, skill commands, firearm hit registration and physical projectiles.
// No DealDamage or fabricated ledger events in this sequence. Low starting HP is a fixture only.
using System;
using System.Linq;
using System.Collections.Generic;
using InventorySystem.Items.Firearms;
using InventorySystem.Items.Firearms.Modules;
using LabApi.Features.Wrappers;
using Mirror;
using MzObserver;
using Newtonsoft.Json.Linq;
using PlayerRoles.FirstPersonControl;
using PlayerRoles.Subroutines;
using RelativePositioning;
using UnityEngine;
using ThrowableBase=InventorySystem.Items.ThrowableProjectiles.ThrowableItem;

public sealed partial class BotRehearsal {
 readonly Dictionary<int,Tuple<int,float>> walkTargets=new Dictionary<int,Tuple<int,float>>();
 float moveNext;int thrown;ThrowableBase heldThrow;
 public static bool RouteDummyCommand(SubroutineBase __instance){
  if(Instance==null||!__instance.Role.TryGetOwner(out var owner)||!owner.IsDummy||!Instance.bots.Contains(owner))return true;
  using(var writer=NetworkWriterPool.Get()){__instance.ClientWriteCmd(writer);__instance.ServerProcessCmd(new NetworkReader(writer.ToArraySegment()));}
  return false;
 }
 void MoveActors(){
  if(Time.time<moveNext)return;moveNext=Time.time+.05f;
  foreach(var kv in walkTargets.ToArray()){
   int i=kv.Key,target=kv.Value.Item1;var d=P(target).Position-P(i).Position;d.y=0;
   if(d.magnitude<=kv.Value.Item2){walkTargets.Remove(i);continue;}
   Face(i,target);var motor=((IFpcRole)bots[i].roleManager.CurrentRole).FpcModule.Motor;
   motor.ReceivedPosition=new RelativePosition(P(i).Position+d.normalized*Mathf.Min(.08f,d.magnitude-kv.Value.Item2));
  }
 }
 void LoadGun(int i){var gun=(FirearmItem)P(i).CurrentItem;gun.Base.TryGetModule<IPrimaryAmmoContainerModule>(out var mag);mag.ServerModifyAmmo(mag.AmmoMax-mag.AmmoStored);gun.Base.TryGetModule<AutomaticActionModule>(out var action);action.ServerCycleAction();}
 void TakeThrowable(int actor,ItemType type){heldThrow=(ThrowableBase)P(actor).Items.First(i=>i.Type==type).Base;P(actor).CurrentItem=Item.Get(heldThrow);}
 void BeginThrow(int actor,int target){Face(actor,target);P(actor).LookRotation=new Vector2(-25,P(actor).LookRotation.y);heldThrow.ServerProcessInitiation();Record("Pin pulled: "+heldThrow.ItemTypeId);}
 void ReleaseThrow(int actor){var before=UnityEngine.Object.FindObjectsByType<InventorySystem.Items.ThrowableProjectiles.ThrownProjectile>(FindObjectsSortMode.None).Length;heldThrow.ServerProcessThrowConfirmation(false,P(actor).Camera.position,P(actor).Camera.rotation,Vector3.zero);var after=UnityEngine.Object.FindObjectsByType<InventorySystem.Items.ThrowableProjectiles.ThrownProjectile>(FindObjectsSortMode.None).Length;thrown+=Math.Max(0,after-before);Record("Physical projectile spawned "+heldThrow.ItemTypeId,after>before);}
 public void Show(){
  if(bots.Count!=9)throw new Exception("mzbots prepare first");
  Stop();CleanupCase();oldRoundLock=Round.IsLocked;Round.IsLocked=true;Setup();history.Clear();events.Clear();eventIds.Clear();shots=0;thrown=0;began=Time.time;cursor=0;running=true;phase="visible combat";walkNext=0;
  At(1,"opening formation",()=>{Pair(0,6,4);P(7).Position=origin+Vector3.right*4;Face(7,0);LoadGun(0);walkStart=P(0).Position;startHealth=P(6).Health;startShots=shots;});
  At(5,"rifle burst with muzzle/audio and real hitreg",()=>Burst(0,6,2));
  At(8,"verify rifle",()=>Record("Actual firearm hits",shots>startShots&&P(6).Health<startHealth));
  At(9,"939 walks up to human",()=>{walkTargets[6]=Tuple.Create(0,1.2f);startHealth=P(0).Health;});
  At(12,"939 native attack key and animation",()=>{Face(6,0);Act(6,"Shoot->Click");});
  At(14,"verify 939; 049 walks up",()=>{Record("Native animated 939 claw damage",P(0).Health<startHealth);walkTargets[7]=Tuple.Create(0,1.2f);});
  At(18,"049 native attack key",()=>{Record("049 distance "+Vector3.Distance(P(7).Position,P(0).Position));DoctorTouch();});
  At(20,"verify cardiac",()=>Record("Native 049 attack caused cardiac",bots[0].playerEffectsController.GetEffect<CustomPlayerEffects.CardiacArrest>().IsEnabled));
  At(23,"049 second native attack key",()=>{Record("049 distance "+Vector3.Distance(P(7).Position,P(0).Position));DoctorTouch();});
  At(25,"verify SCP kill and assist",()=>{Record("Native 049 kill",!P(0).IsAlive);var feed=MzPlugin.Instance.Combat.Ledger.Snapshot(MzPlugin.Instance.Combat.Now);Record("Actual attack kill plus 939 assist",feed.Any(e=>e.Value<string>("icon")=="049-touch"&&e["assists"].Any(a=>a["icons"].Any(x=>x.ToString()=="939-claw"))));});
  At(36,"respawn and flash scenario",()=>{ResetBot(0);ResetBot(6);Pair(2,6,3);P(0).Position=origin+Vector3.right*2;P(6).Health=120;P(6).HumeShield=0;TakeThrowable(2,ItemType.GrenadeFlash);});
  At(39,"flash pin",()=>{LoadGun(0);BeginThrow(2,6);});
  At(41,"throw real flash",()=>ReleaseThrow(2));
  At(45,"flash detonation and shooting",()=>{Record("Physical flash affected SCP",bots[6].playerEffectsController.GetEffect<CustomPlayerEffects.Flashed>().IsEnabled);Burst(0,6,5);});
  At(52,"verify real flash assist",()=>{var feed=MzPlugin.Instance.Combat.Ledger.Snapshot(MzPlugin.Instance.Combat.Now);Record("Physical flash plus actual rifle kill",feed.Any(e=>e.Value<string>("icon")=="item:GunE11SR"&&e["assists"].Any(a=>a["icons"].Any(x=>x.ToString()=="human-flash"))));});
  At(63,"HE scenario setup",()=>{ResetBot(8);P(8).Position=origin+Vector3.forward*3;P(8).Health=120;P(8).HumeShield=0;P(0).Position=origin;TakeThrowable(0,ItemType.GrenadeHE);});
  At(65,"HE pin",()=>BeginThrow(0,8));
  At(67,"throw real HE",()=>ReleaseThrow(0));
  At(74,"verify HE explosion",()=>{var feed=MzPlugin.Instance.Combat.Ledger.Snapshot(MzPlugin.Instance.Combat.Now);Record("Physical HE killed SCP",feed.Any(e=>e.Value<string>("icon")=="item:GrenadeHE"&&e["victim"].Value<string>("name")==P(8).Nickname));});
  At(85,"visible rehearsal finished",()=>{phase="finished visible combat";Record("Visible rehearsal finished; physical projectiles="+thrown);});
 }
}
