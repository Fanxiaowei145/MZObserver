using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using CustomPlayerEffects;
using Footprinting;
using HarmonyLib;
using InventorySystem.Items.ThrowableProjectiles;
using InventorySystem.Items.Usables.Scp1344;
using LabApi.Events.Arguments.Scp173Events;
using LabApi.Events.Arguments.Scp106Events;
using LabApi.Events.Arguments.Scp079Events;
using LabApi.Events.Handlers;
using MapGeneration;
using Newtonsoft.Json.Linq;
using PlayerRoles;
using PlayerRoles.PlayableScps.Scp939;
using PlayerStatsSystem;
using UnityEngine;
using Player=LabApi.Features.Wrappers.Player;
using Logger=LabApi.Features.Console.Logger;
namespace MzObserver {
// Observation-only hooks: no original arguments, return values, health or effects are changed.
public sealed class CombatCapture : IDisposable {
 public readonly CombatLedger Ledger=new CombatLedger();
 public static CombatCapture Instance;readonly Func<double> time;readonly Harmony harmony=new Harmony("mz.observer.combat.v1");
 public int HookCount {get;private set;}public int Errors {get;private set;}
 readonly Dictionary<int,CombatPerson> puddles=new Dictionary<int,CombatPerson>();
 sealed class Burst {public CombatPerson Owner;public double At;}
 readonly Dictionary<TeslaGate,Burst> bursts=new Dictionary<TeslaGate,Burst>();
 sealed class Ghost {public CombatPerson Owner;public RoomIdentifier Room;public double End;public HashSet<string> Exposed=new HashSet<string>();}
 readonly List<Ghost> ghosts=new List<Ghost>();
 readonly Dictionary<uint,string> lives=new Dictionary<uint,string>();
 readonly Dictionary<string,Dictionary<string,CombatPerson>> xrayObservers=new Dictionary<string,Dictionary<string,CombatPerson>>();
 public sealed class Context {public Context Previous;public CombatPerson Source;public string Kind;public ReferenceHub Victim;public TeslaGate Gate;public GhostScope Ghost;}
 public sealed class GhostScope {public CombatPerson Owner;public RoomIdentifier Room;public double End;}
 [ThreadStatic]static Context current;
 public CombatCapture(Func<double> seconds){time=seconds;}
 public double Now=>time();
 public static object Read(object value,string name){if(value==null)return null;for(var t=value.GetType();t!=null;t=t.BaseType){var f=t.GetField(name,BindingFlags.Instance|BindingFlags.Public|BindingFlags.NonPublic|BindingFlags.DeclaredOnly);if(f!=null)return f.GetValue(value);var p=t.GetProperty(name,BindingFlags.Instance|BindingFlags.Public|BindingFlags.NonPublic|BindingFlags.DeclaredOnly);if(p!=null)return p.GetValue(value,null);}return null;}
 static ReferenceHub Owner(object instance){var hub=Read(instance,"Owner") as ReferenceHub;if(hub!=null)return hub;if(instance is PlayerRoleBase role&&role.TryGetOwner(out hub))return hub;return null;}
 public static CombatPerson Person(ReferenceHub hub)=>hub==null?null:Person(new Footprint(hub));
 public static CombatPerson Person(Footprint f){var role=Collector.RoleName(f.Role);if(!f.IsSet||role==null)return null;return new CombatPerson{Id=f.NetId.ToString(),Life=f.NetId+":"+f.LifeIdentifier,Name=f.Nickname,Role=role,Side=f.Role.ToString().StartsWith("Scp")?"scp":"human"};}
 static string EffectIcon(string name){switch(name){case "Burned":return "human-burn";case "Flashed":return "human-flash";case "CardiacArrest":return "049-cardiac";case "Corroding":return "106-decay";case "Concussed":return "096-concussion";case "Stained":return "173-puddle";case "AmnesiaVision":return "939-gas";default:return null;}}
 public void Start(){
  Instance=this;
  Scope("InventorySystem.Items.Firearms.Modules.A7BurnEffectModule","OnFired");
  Scope("InventorySystem.Items.Jailbird.JailbirdItem","ApplyDamage");
  Hook(AccessTools.Method(typeof(Scp1344Detected),"UpdateStatus"),null,nameof(XrayPost));
  Scope("InventorySystem.Items.ThrowableProjectiles.FlashbangGrenade","ProcessPlayer");
  Scope("InventorySystem.Items.ThrowableProjectiles.ExplosionGrenade","ExplodeDestructible");
  Scope("PlayerRoles.PlayableScps.Scp173.Scp173SnapAbility","ServerProcessCmd");Scope("PlayerRoles.PlayableScps.Scp173.Scp173TeleportAbility","ServerProcessCmd");
  Scope("PlayerRoles.PlayableScps.Scp049.Scp049AttackAbility","ServerProcessCmd");Scope("PlayerRoles.PlayableScps.Scp106.Scp106Attack","ServerProcessCmd");
  Scope("CustomPlayerEffects.Corroding","OnTick");
  Scope("PlayerRoles.PlayableScps.Scp096.Scp096HitHandler","ProcessHits");
  Scope("PlayerRoles.PlayableScps.Scp939.Scp939AmnesticCloudInstance","OnStay");
  Scope("Hazards.TantrumEnvironmentalHazard","OnEnter");Scope("Hazards.TantrumEnvironmentalHazard","OnStay");Scope("Hazards.TantrumEnvironmentalHazard","OnExit");
  Scope("PlayerRoles.PlayableScps.Scp079.Rewards.TerminationRewards","GainReward");
  Scope("PlayerRoles.PlayableScps.Scp079.Scp079TeslaAbility","ServerProcessCmd");
  Scope("TeslaGateController","ServerReceiveMessage");Scope("InventorySystem.Items.ThrowableProjectiles.Scp2176Projectile","ServerShatter");
  Hook(typeof(StatusEffectBase).GetMethod("ServerChangeDuration"),null,nameof(DurationPost));
  Hook(AccessTools.PropertySetter(typeof(SyncedStatBase),"CurValue"),null,nameof(HealthPost));
  Hook(AccessTools.Method(typeof(PlayerStats),"KillPlayer"),nameof(KillPrefix),null);
  Hook(AccessTools.Method(typeof(TeslaGate),"RpcInstantBurst"),nameof(BurstPrefix),null);
  Hook(AccessTools.Method(typeof(TeslaGate),"ServerSideCode"),nameof(NaturalTeslaPrefix),null);
  Hook(AccessTools.Method(typeof(RoomLightController),"ServerFlickerLights"),null,nameof(GhostLightPost));
  Hook(AccessTools.Method(typeof(Interactables.Interobjects.DoorUtils.DoorScheduledUnlocker),"UnlockLater"),null,nameof(GhostDoorPost));
  PlayerStats.OnAnyPlayerDamaged+=Damaged;StatusEffectBase.OnDisabled+=Disabled;
  Scp173Events.CreatedTantrum+=Puddle;Scp106Events.TeleportedPlayer+=Captured;Scp079Events.GainedExperience+=Experience;
  Logger.Raw("[INFO] [MZObserver] Combat capture ready: "+HookCount+" observation hooks",ConsoleColor.White);
 }
 void Hook(MethodBase method,string prefix,string postfix,bool scope=false){if(method==null)throw new MissingMethodException("Required combat hook missing after hook #"+HookCount);harmony.Patch(method,prefix:prefix==null?null:new HarmonyMethod(typeof(CombatCapture),prefix),postfix:postfix==null?null:new HarmonyMethod(typeof(CombatCapture),postfix),finalizer:scope?new HarmonyMethod(typeof(CombatCapture),nameof(ScopeFinally)):null);HookCount++;}
 void Scope(string type,string method){var t=AccessTools.TypeByName(type);if(t==null)throw new TypeLoadException(type);Hook(AccessTools.Method(t,method),nameof(ScopePrefix),null,true);}
 static void Safe(Action action){try{action();}catch(Exception e){var i=Instance;if(i!=null){i.Errors++;if(i.Errors<=5)Logger.Raw("[ERROR] [MZObserver] Combat observer: "+e,ConsoleColor.Red);}}}
 public void Dispose(){PlayerStats.OnAnyPlayerDamaged-=Damaged;StatusEffectBase.OnDisabled-=Disabled;Scp173Events.CreatedTantrum-=Puddle;Scp106Events.TeleportedPlayer-=Captured;Scp079Events.GainedExperience-=Experience;try{if(HookCount>0)harmony.UnpatchAll(harmony.Id);}finally{Instance=null;current=null;}}
 public void Reset(){Ledger.Reset();puddles.Clear();bursts.Clear();ghosts.Clear();lives.Clear();xrayObservers.Clear();}
 public void Tick(){
  var now=Now;ghosts.RemoveAll(g=>now>g.End);foreach(var p in Player.List){var who=Person(p.ReferenceHub);if(who==null)continue;string old;if(lives.TryGetValue(p.NetworkId,out old)&&old!=who.Life)Ledger.ClearLife(old);lives[p.NetworkId]=who.Life;Ledger.Heal(who.Life,p.Health,p.MaxHealth);
   if(!p.IsAlive)continue;var room=p.Room?.Base;
   foreach(var g in ghosts)if(g.Room==room){Ledger.Effect(who,g.Owner,"item:SCP2176",g.End,10,now);g.Exposed.Add(who.Life);}
   if(!p.ReferenceHub.playerEffectsController.GetEffect<PocketCorroding>().IsEnabled)Ledger.LeavePocket(who.Life);
  }Ledger.Prune(now);
 }
 void Puddle(Scp173CreatedTantrumEventArgs e){puddles[e.Tantrum.Base.GetInstanceID()]=Person(e.Player.ReferenceHub);}
 void Captured(Scp106TeleportedPlayerEvent e){Ledger.Capture(Person(e.Target.ReferenceHub),Person(e.Player.ReferenceHub));}
 void Experience(Scp079GainedExperienceEventArgs e){Safe(()=>{if(current?.Kind!="reward"||current.Victim==null||e.Amount<=0)return;if(e.Reason.ToString()!="ExpGainTerminationDirect"&&e.Reason.ToString()!="ExpGainTerminationAssist")return;var victim=Player.Get(current.Victim);if(victim==null||victim.Health>0)return;Ledger.Effect(Person(current.Victim),Person(e.Player.ReferenceHub),"079-assist",Now,1,Now);});}
 void Disabled(StatusEffectBase effect){Safe(()=>{var p=Person(effect.Hub);var icon=EffectIcon(effect.GetType().Name);if(p!=null&&icon!=null)Ledger.EndEffect(p.Life,icon,Now);if(p!=null&&effect is Flashed)Ledger.EndEffect(p.Life,"item:Jailbird",Now);if(p!=null&&effect is Scp1344Detected){Ledger.EndEffect(p.Life,"item:SCP1344",Now);xrayObservers.Remove(p.Life);}});}
 public static void XrayPost(Scp1344Detected __instance){Safe(()=>{
  var i=Instance;if(i==null)return;var victim=Person(__instance.Hub);if(victim==null)return;
  var validated=Read(__instance,"_seenBy") as List<Scp1344HumanXrayProvider>;if(validated==null)return;
  var next=new Dictionary<string,CombatPerson>();foreach(var observer in validated){if(observer==null)continue;var source=Person(observer.Hub);if(source==null||source.Side!="human"||source.Side==victim.Side)continue;next[source.Life]=source;i.Ledger.Effect(victim,source,"item:SCP1344",double.PositiveInfinity,10,i.Now);}
  if(i.xrayObservers.TryGetValue(victim.Life,out var previous))foreach(var source in previous.Keys.Where(k=>!next.ContainsKey(k)))i.Ledger.ShortenEffect(victim.Life,source,"item:SCP1344",i.Now);
  if(next.Count==0)i.xrayObservers.Remove(victim.Life);else i.xrayObservers[victim.Life]=next;
 });}
 public static void ScopePrefix(object __instance,MethodBase __originalMethod,object[] __args,out Context __state){
  __state=new Context{Previous=current};current=__state;var state=__state;Safe(()=>{
   var i=Instance;if(i==null)return;string t=__originalMethod.DeclaringType.Name;state.Source=Person(Owner(__instance));
   switch(t){
    case "A7BurnEffectModule":state.Source=Person(Read(Read(__instance,"Firearm"),"Owner") as ReferenceHub);state.Kind="burn";break;
    case "JailbirdItem":state.Source=Person(__args[0] as ReferenceHub);state.Kind="jailbird";break;
    case "FlashbangGrenade":state.Source=Person(((FlashbangGrenade)__instance).PreviousOwner);state.Kind="flash";break;
    case "ExplosionGrenade":state.Source=Person((Footprint)__args[1]);state.Kind="explosion";break;
    case "Scp173SnapAbility":state.Kind="173-snap";break;
    case "Scp173TeleportAbility":state.Kind="173-blink-snap";break;
    case "Scp049AttackAbility":state.Kind="049";break;
    case "Scp106Attack":state.Kind="106-touch";break;
    case "Corroding":state.Source=Person(((Corroding)__instance).AttackerHub);state.Kind="106-decay";break;
    case "Scp096HitHandler":state.Source=Person(Owner(Read(__instance,"_scpRole")));state.Kind=Read(__instance,"_damageType")?.ToString()=="Charge"?"096-charge":"096-slash";break;
    case "Scp939AmnesticCloudInstance":state.Kind="939-gas";break;
    case "TantrumEnvironmentalHazard":i.puddles.TryGetValue(((Component)__instance).GetInstanceID(),out state.Source);state.Kind="173-puddle";break;
    case "TerminationRewards":state.Source=Person(Owner(__args[0]));state.Victim=__args[1] as ReferenceHub;state.Kind="reward";break;
    case "Scp079TeslaAbility":state.Kind="079-tesla";break;
    case "TeslaGateController":state.Gate=Read(__args[1],"Gate") as TeslaGate;Burst burst;if(state.Gate!=null&&i.bursts.TryGetValue(state.Gate,out burst)&&i.Now-burst.At<=1){state.Source=burst.Owner;state.Kind="079-tesla-hit";}break;
    case "Scp2176Projectile":var g=(Scp2176Projectile)__instance;state.Source=Person(g.PreviousOwner);state.Kind="ghost";g.transform.position.TryGetRoom(out var room);state.Ghost=new GhostScope{Owner=state.Source,Room=room,End=i.Now};break;
   }
  });
 }
 public static void ScopeFinally(Context __state){Safe(()=>{var i=Instance;if(i!=null&&__state?.Ghost!=null&&__state.Ghost.Room!=null&&__state.Ghost.Owner!=null&&__state.Ghost.End>i.Now){var g=__state.Ghost;
  // A second ghostlight can restore power/open the locked doors after 0.1 s.
  if(g.End-i.Now<=.11)foreach(var old in i.ghosts.Where(x=>x.Room==g.Room&&x.End>g.End)){old.End=g.End;foreach(var life in old.Exposed)i.Ledger.ShortenEffect(life,old.Owner.Life,"item:SCP2176",g.End);}
  var active=new Ghost{Owner=g.Owner,Room=g.Room,End=g.End};i.ghosts.Add(active);foreach(var p in Player.List.Where(p=>p.IsAlive&&p.Room?.Base==g.Room)){var who=Person(p.ReferenceHub);if(who==null)continue;i.Ledger.Effect(who,g.Owner,"item:SCP2176",g.End,10,i.Now);active.Exposed.Add(who.Life);}
 }});current=__state?.Previous;}
 public static void DurationPost(StatusEffectBase __instance,float duration,bool addDuration){Safe(()=>{
  var i=Instance;if(i==null||!__instance.IsEnabled||current?.Source==null)return;var icon=EffectIcon(__instance.GetType().Name);if(icon==null)return;
  if(__instance is Flashed&&current.Kind=="jailbird"){i.Ledger.Effect(Person(__instance.Hub),current.Source,"item:Jailbird",duration<=0?double.PositiveInfinity:i.Now+duration,5,i.Now,addDuration);return;}
  bool matches=icon=="human-burn"&&(current.Kind=="burn"||current.Kind=="explosion")||icon=="human-flash"&&current.Kind=="flash"||icon=="049-cardiac"&&current.Kind=="049"||icon=="106-decay"&&current.Kind=="106-touch"||icon=="096-concussion"&&current.Kind=="096-charge"||icon==current.Kind;
  if(!matches)return;double end=duration<=0?double.PositiveInfinity:i.Now+duration;i.Ledger.Effect(Person(__instance.Hub),current.Source,icon,end,icon.StartsWith("human-")?10:3,i.Now,addDuration);
 });}
 public static void HealthPost(SyncedStatBase __instance){Safe(()=>{if(Instance!=null&&__instance is HealthStat h&&h.Hub!=null){var p=Person(h.Hub);if(p!=null)Instance.Ledger.Heal(p.Life,h.CurValue,h.MaxValue);}});}
 public static void BurstPrefix(TeslaGate __instance){Safe(()=>{var i=Instance;if(i==null)return;if(current?.Kind=="079-tesla"&&current.Source!=null)i.bursts[__instance]=new Burst{Owner=current.Source,At=i.Now};else i.bursts.Remove(__instance);});}
 public static void NaturalTeslaPrefix(TeslaGate __instance){Safe(()=>{if(!__instance.InProgress)Instance?.bursts.Remove(__instance);});}
 public static void GhostLightPost(float dur){Safe(()=>{if(current?.Ghost!=null&&dur>0)current.Ghost.End=Math.Max(current.Ghost.End,Instance.Now+dur);});}
 public static void GhostDoorPost(object[] __args){if(current?.Ghost==null)return;if(__args.Length>2&&__args[2].ToString()=="Lockdown2176"){var duration=Convert.ToDouble(__args[1]);if(duration>0)current.Ghost.End=Math.Max(current.Ghost.End,Instance.Now+duration);}}
 string Method(DamageHandlerBase h){
  if(h is FirearmDamageHandler gun)return "item:"+gun.WeaponType;
  if(h is ExplosionDamageHandler grenade){switch(grenade.ExplosionType){case ExplosionType.Grenade:return "item:GrenadeHE";case ExplosionType.SCP018:return "item:SCP018";case ExplosionType.Disruptor:return "item:ParticleDisruptor";case ExplosionType.Jailbird:return "item:Jailbird";case ExplosionType.Cola:return "item:SCP207";default:return null;}}
  if(h is Scp939DamageHandler dog)return dog.Scp939DamageType.ToString().IndexOf("Lunge",StringComparison.OrdinalIgnoreCase)>=0?"939-pounce":"939-claw";
  if(h is Scp049DamageHandler doctor)return doctor.DamageSubType==Scp049DamageHandler.AttackType.CardiacArrest?"049-cardiac":doctor.DamageSubType==Scp049DamageHandler.AttackType.Instakill?"049-touch":null;
  if(h is Scp096DamageHandler)return Read(h,"_attackType")?.ToString()=="Charge"?"096-charge":"096-slash";
  switch(h.GetType().Name){case "MicroHidDamageHandler":return "item:MicroHID";case "DisruptorDamageHandler":return "item:ParticleDisruptor";case "JailbirdDamageHandler":return "item:Jailbird";case "Scp018DamageHandler":return "item:SCP018";case "Scp1509DamageHandler":return "item:SCP1509";}
  if(h is ScpDamageHandler scp){var id=Read(scp,"_translationId");if(Equals(id,DeathTranslations.Scp173.Id))return current?.Kind=="173-blink-snap"?"173-blink-snap":"173-snap";if(Equals(id,DeathTranslations.PocketDecay.Id))return current?.Kind=="106-decay"?"106-decay":scp.Damage<0?"106-execute":"106-decay";if(Equals(id,DeathTranslations.Scp1509.Id))return "item:SCP1509";}
  return null;
 }
 void Damaged(ReferenceHub hub,DamageHandlerBase handler){Safe(()=>{
  var victim=Person(hub);var source=handler is AttackerDamageHandler a?Person(a.Attacker):null;if(victim==null||source==null)return;string icon=Method(handler);var standard=handler as StandardDamageHandler;double damage=standard?.Damage??0;if(damage<=0)return;
  if(source.Side=="scp"&&icon!=null&&icon!="049-cardiac"&&!(icon=="106-decay"&&current?.Kind=="106-decay"))Ledger.DirectHit(victim,source,icon,damage,Now);
  if(icon=="item:GrenadeHE")Ledger.Effect(victim,source,icon,Now,10,Now);
 });}
 public static void KillPrefix(PlayerStats __instance,DamageHandlerBase handler){Safe(()=>Instance?.Killed(Read(__instance,"_hub") as ReferenceHub,handler));}
 void Killed(ReferenceHub hub,DamageHandlerBase handler){
  var victim=Person(hub);if(victim==null)return;CombatPerson killer=handler is AttackerDamageHandler a?Person(a.Attacker):null;string icon=Method(handler);
  if(handler is UniversalDamageHandler universal){if(universal.TranslationId==DeathTranslations.PocketDecay.Id){killer=Ledger.Captor(victim.Life);icon="106-pocket";}else if(universal.TranslationId==DeathTranslations.Tesla.Id&&current?.Kind=="079-tesla-hit"){killer=current.Source;icon="079-tesla";}}
  bool suicide=killer?.Id==victim.Id;
  if(killer==null&&handler is UniversalDamageHandler u&&(u.TranslationId==DeathTranslations.Falldown.Id||u.TranslationId==DeathTranslations.Scp207.Id||u.TranslationId==DeathTranslations.SeveredHands.Id))suicide=true;
  Ledger.Death(victim,killer,icon,suicide,Now);xrayObservers.Remove(victim.Life);
 }
 public JObject Diagnostics()=>new JObject{["hooks"]=HookCount,["errors"]=Errors,["epoch"]=Ledger.Epoch,["recent"]=Ledger.Snapshot(Now)};
}
}

