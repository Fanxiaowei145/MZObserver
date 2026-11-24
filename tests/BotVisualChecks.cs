using System;using System.Reflection;using Mirror;using System.IO;using System.Linq;using LabApi.Features.Wrappers;using InventorySystem.Items.Firearms.Modules;using Newtonsoft.Json.Linq;using UnityEngine;using MzObserver;
public sealed partial class BotRehearsal {
 public void VisualChecks(){
  if(bots.Count<9)throw new Exception("Prepare bots first");Stop();var result=new JArray();var player=P(0);var lights=player.Room.AllLightControllers.ToArray();var enabled=lights.Select(l=>l.LightsEnabled).ToArray();
  Func<JObject> snapshot=()=>MzPlugin.Instance.Collector.Players(true).First(p=>p.Value<uint>("networkId")==player.NetworkId);
  Action<string,bool> check=(name,passed)=>{result.Add(new JObject{["check"]=name,["passed"]=passed});File.WriteAllText("mz-visual-check.json",result.ToString());if(!passed)throw new Exception(name);};
  timeline.Clear();cursor=0;began=Time.time;running=true;phase="visual-check";
  At(0,"native blackout",()=>{foreach(var l in lights)l.LightsEnabled=false;check("room blackout human dark",snapshot()["effects"].Values<string>().Contains("dark-room"));});
  At(.2f,"restore room",()=>{for(int i=0;i<lights.Length;i++)lights[i].LightsEnabled=enabled[i];check("light restores portrait",!snapshot()["effects"].Values<string>().Contains("dark-room"));});
  At(.4f,"native timed blackout",()=>{foreach(var l in lights)l.FlickerLights(.2f);check("timed outage dark",snapshot()["effects"].Values<string>().Contains("dark-room"));});
  At(.75f,"outage recovery",()=>check("timed outage restores",!snapshot()["effects"].Values<string>().Contains("dark-room")));
  At(.8f,"gas debuff",()=>{player.EnableEffect<CustomPlayerEffects.AmnesiaVision>(1,5);check("939 AmnesiaVision badge",snapshot()["effects"].Values<string>().Contains("amnestic"));});
  At(1f,"gas cleared",()=>{player.DisableEffect<CustomPlayerEffects.AmnesiaVision>();check("gas badge clears",!snapshot()["effects"].Values<string>().Contains("amnestic"));});
  At(1.1f,"load native firearm",()=>{var gun=(FirearmItem)player.CurrentItem;gun.Base.TryGetModule<IPrimaryAmmoContainerModule>(out var mag);mag.ServerModifyAmmo(mag.AmmoMax-mag.AmmoStored);gun.Base.TryGetModule<AutomaticActionModule>(out var action);action.ServerCycleAction();});
  At(1.5f,"native shot request",()=>{Face(0,1);var gun=(FirearmItem)player.CurrentItem;gun.Base.TryGetModule<AutomaticActionModule>(out var action);var type=typeof(AutomaticActionModule).GetNestedType("ShotRequest",BindingFlags.NonPublic);var request=Activator.CreateInstance(type,new object[]{action});using(var writer=NetworkWriterPool.Get()){type.GetMethod("Write").Invoke(request,new object[]{writer});action.ServerProcessCmd(new NetworkReader(writer.ToArraySegment()));}});
  At(1.8f,"shot telemetry",()=>{var data=snapshot();check("actual firearm event increments sequence",data.Value<long?>("shotSequence")>0);check("shot age is fresh",data.Value<float?>("shotAgeMs")<350);});
 }
 public void SignalChecks(){
  if(bots.Count<9)throw new Exception("Prepare bots first");Stop();var rows=new JArray();
  Action<string,bool> check=(name,passed)=>{rows.Add(new JObject{["check"]=name,["passed"]=passed});File.WriteAllText("mz-079-static-check.json",rows.ToString());if(!passed)throw new Exception(name);};
  Action shatter=()=>{var r=(PlayerRoles.PlayableScps.Scp079.Scp079Role)P(6).RoleBase;r.SubroutineModule.TryGetSubroutine<PlayerRoles.PlayableScps.Scp079.Cameras.Scp079CurrentCameraSync>(out var sync);var cam=sync.CurrentCamera;var ghost=UnityEngine.Object.Instantiate(Resources.FindObjectsOfTypeAll<InventorySystem.Items.ThrowableProjectiles.Scp2176Projectile>().First());ghost.transform.position=cam.Room.transform.position+Vector3.up;Invoke(ghost,"ServerShatter");UnityEngine.Object.Destroy(ghost.gameObject);};
  Func<bool> lost=()=>MzPlugin.Instance.Collector.Players(true).First(p=>p.Value<uint>("networkId")==P(6).NetworkId).Value<bool>("signalLost");
  timeline.Clear();cursor=0;began=Time.time;running=true;phase="signal-check";
  At(0,"079 setup",()=>{P(6).SetRole(PlayerRoles.RoleTypeId.Scp079);P(6).IsGodModeEnabled=false;});
  At(.7f,"ghostlight hits camera room",()=>{check("079 initially connected",!lost());shatter();check("actual ghostlight disables 079",lost());});
  At(1f,"second ghostlight restores signal",()=>{shatter();check("actual ghostlight clears signal loss",!lost());});
 }


 public void CooldownChecks(){
  if(bots.Count<9)throw new Exception("Prepare bots first");Stop();var rows=new JArray();
  Action<string,bool> check=(name,passed)=>{rows.Add(new JObject{["check"]=name,["passed"]=passed});File.WriteAllText("mz-cooldown-check.json",rows.ToString());if(!passed)throw new Exception(name);};
  var specs=JArray.Parse(File.ReadAllText("mz-ability-specs.json"));timeline.Clear();cursor=0;began=Time.time;running=true;phase="cooldown-check";float time=0;
  foreach(var group in specs.GroupBy(x=>x.Value<string>("role"))){var role=group.Key;var cases=group.ToArray();
   At(time,"role "+role,()=>P(6).SetRole((PlayerRoles.RoleTypeId)Enum.Parse(typeof(PlayerRoles.RoleTypeId),role=="1507"?"Flamingo":"Scp"+role)));
   At(time+1,"timers "+role,()=>{
    var player=P(6);var modules=player.RoleBase.GetComponentsInChildren<Component>(true);
    foreach(var spec in cases){var member=spec.Value<string>("member");
     if(spec.Value<string>("id")=="079-lockdown"||spec.Value<string>("id")=="079-tesla"){
      var m=modules.First(c=>c!=null&&c.GetType().Name==spec.Value<string>("module"));Set(m,"_nextUseTime",Mirror.NetworkTime.time+12.5);
      var read=MzPlugin.Instance.Collector.Players(true).First(x=>x.Value<uint>("networkId")==player.NetworkId)["cooldowns"].FirstOrDefault(x=>x.Value<string>("id")==spec.Value<string>("id"));
      check(spec.Value<string>("id")+" native deadline",read!=null&&Math.Abs(read.Value<double>("remaining")-12.5)<.1);Set(m,"_nextUseTime",0d);
      check(spec.Value<string>("id")+" ready omitted",!MzPlugin.Instance.Collector.Players(true).First(x=>x.Value<uint>("networkId")==player.NetworkId)["cooldowns"].Any(x=>x.Value<string>("id")==spec.Value<string>("id")));continue;
     }
     if(member=="RemainingCooldown"){
      var roomModule=modules.First(c=>c!=null&&c.GetType().Name==spec.Value<string>("module"));Invoke(roomModule,"RefreshCurrentController");
      var controller=(RoomLightController)Collector.Read(roomModule,"_roomController");
      var timers=(System.Collections.Generic.Dictionary<uint,double>)Collector.Read(roomModule,"_blackoutCooldowns");timers[controller.netId]=Mirror.NetworkTime.time+12.5;
      var roomCd=MzPlugin.Instance.Collector.Players(true).First(x=>x.Value<uint>("networkId")==player.NetworkId)["cooldowns"].FirstOrDefault(x=>x.Value<string>("id")==spec.Value<string>("id"));
      check("079 current room native cooldown",roomCd!=null&&Math.Abs(roomCd.Value<double>("remaining")-12.5)<.1);timers.Clear();continue;
     }
     var module=modules.FirstOrDefault(c=>c!=null&&c.GetType().Name==spec.Value<string>("module"));check(spec.Value<string>("id")+" native module",module!=null);
     var value=Collector.Read(module,member);check(spec.Value<string>("id")+" native timer",value is PlayerRoles.Subroutines.AbilityCooldown);
     var timer=(PlayerRoles.Subroutines.AbilityCooldown)value;timer.Trigger(12.5);
     var data=MzPlugin.Instance.Collector.Players(true).First(x=>x.Value<uint>("networkId")==player.NetworkId);
     var cd=data["cooldowns"].FirstOrDefault(x=>x.Value<string>("id")==spec.Value<string>("id"));
     check(spec.Value<string>("id")+" exact native remaining",cd!=null&&Math.Abs(cd.Value<double>("remaining")-timer.Remaining)<.05);
     timer.Clear();data=MzPlugin.Instance.Collector.Players(true).First(x=>x.Value<uint>("networkId")==player.NetworkId);
     check(spec.Value<string>("id")+" ready omitted",!data["cooldowns"].Any(x=>x.Value<string>("id")==spec.Value<string>("id")));
    }
   });time+=2;
  }
 }

 public void FrostChecks(){
  if(bots.Count<9)throw new Exception("Prepare bots first");Stop();var rows=new JArray();var player=P(0);bots[0].playerEffectsController.DisableAllEffects();
  Action<string,bool> check=(name,passed)=>{rows.Add(new JObject{["check"]=name,["passed"]=passed});File.WriteAllText("mz-frost-check.json",rows.ToString());if(!passed)throw new Exception(name);};
  Func<JObject> snapshot=()=>MzPlugin.Instance.Collector.Players(true).First(x=>x.Value<uint>("networkId")==player.NetworkId);
  InventorySystem.Items.Usables.Scp244.Scp244DeployablePickup jar=null;
  timeline.Clear();cursor=0;began=Time.time;running=true;phase="frost-check";
  At(0,"no fog",()=>{check("no fog has no frost",!snapshot()["effects"].Values<string>().Contains("frost"));jar=(InventorySystem.Items.Usables.Scp244.Scp244DeployablePickup)Pickup.Create(ItemType.SCP244a,player.Camera.position).Base;jar.GetComponent<Rigidbody>().isKinematic=true;jar.State=InventorySystem.Items.Usables.Scp244.Scp244State.Active;Set(jar,"CurrentSizePercent",1f);});
  At(3,"actual ice fog",()=>{check("real jar exposes player",jar.FogPercentForPoint(player.Camera.position)>0);check("native hypothermia produces frost",snapshot()["effects"].Values<string>().Contains("frost"));jar.transform.position+=Vector3.up*200;});
  At(3.5f,"outside fog",()=>{check("outside fog clears frost",!snapshot()["effects"].Values<string>().Contains("frost"));Mirror.NetworkServer.Destroy(jar.gameObject);player.EnableEffect<CustomPlayerEffects.AntiScp207>(1,3);});
  At(4,"anti cola",()=>{check("native anti cola status",snapshot().Value<bool>("antiCola"));player.DisableEffect<CustomPlayerEffects.AntiScp207>();check("anti cola clears",!snapshot().Value<bool>("antiCola"));});
 }
}


