// Local-only scripted rehearsal. Never include this assembly in a release package.
using System;
using System.IO;
using System.Reflection;
using Mirror;
using Utils.Networking;
using Footprinting;
using System.Linq;
using System.Collections.Generic;
using CommandSystem;
using LabApi.Loader.Features.Plugins;
using LabApi.Features.Wrappers;
using NetworkManagerUtils.Dummies;
using PlayerRoles;
using InventorySystem.Items.Firearms;
using InventorySystem.Items.Firearms.Modules;
using UnityEngine;
using Newtonsoft.Json.Linq;
using MzObserver;
using Player=LabApi.Features.Wrappers.Player;

public sealed class ScriptedBotsPlugin:Plugin {
 public override string Name=>"MZScriptedBots";
 public override string Description=>"Local-only native dummy action rehearsal";
 public override string Author=>"MZ local tests";
 public override Version Version=>new Version(0,1,0);
 public override Version RequiredApiVersion=>new Version(1,1,7);
 GameObject runner;HarmonyLib.Harmony dummyBridge;
 public override void Enable(){dummyBridge=new HarmonyLib.Harmony("mz.local.dummy-input");dummyBridge.Patch(HarmonyLib.AccessTools.Method(typeof(PlayerRoles.Subroutines.SubroutineBase),"ClientSendCmd"),prefix:new HarmonyLib.HarmonyMethod(typeof(BotRehearsal),nameof(BotRehearsal.RouteDummyCommand)));runner=new GameObject("MZScriptedBots");UnityEngine.Object.DontDestroyOnLoad(runner);runner.AddComponent<BotRehearsal>();}
 public override void Disable(){dummyBridge?.UnpatchAll("mz.local.dummy-input");if(runner!=null)UnityEngine.Object.Destroy(runner);}
}
[CommandHandler(typeof(GameConsoleCommandHandler))]
[CommandHandler(typeof(RemoteAdminCommandHandler))]
public sealed class ScriptedBotsCommand:ICommand {
 public string Command=>"mzbots";public string[] Aliases=>new string[0];public string Description=>"Local rehearsal: join / select / prepare / rotate / play (visible attacks) / stop / status / actions / clear";
 public bool Execute(ArraySegment<string> args,ICommandSender sender,out string response){
  if(!sender.CheckPermission(PlayerPermissions.FacilityManagement,out response))return false;
  try {var r=BotRehearsal.Instance;var cmd=args.Count==0?"status":args.Array[args.Offset].ToLowerInvariant();
   switch(cmd){case "frostcheck":r.FrostChecks();break;case "cooldowncheck":r.CooldownChecks();break;case "signalcheck":r.SignalChecks();break;case "visualcheck":r.VisualChecks();break;case "rotate":r.RotateScps();break;case "join":r.JoinUnselected();break;case "select":r.SelectLineup();break;case "prepare":r.Prepare();break;case "play":r.Show();break;case "more":r.Show();break;case "stop":r.Stop();break;case "clear":r.Clear();break;case "actions":r.Dump();break;case "status":break;default:response=Description;return false;}
   response=r.Status;return true;
  }catch(Exception e){response=e.ToString();return false;}
 }
}
public sealed partial class BotRehearsal:MonoBehaviour {
 public static BotRehearsal Instance;
 readonly List<ReferenceHub> bots=new List<ReferenceHub>();
 readonly List<Tuple<float,string,Action>> timeline=new List<Tuple<float,string,Action>>();
 readonly JArray history=new JArray(),events=new JArray();readonly HashSet<string> eventIds=new HashSet<string>();
 float began,walkNext;int cursor;bool running;bool? oldRoundLock;Vector3 origin,walkStart;float startHealth;int startShots;
 int shots;float fireUntil,fireNext;int fireActor,fireTarget;string phase="idle";public string Status=>"MZ bots: "+phase+", owned bots="+bots.Count+", running="+running;
 readonly List<Vector3> setupSpawns=new List<Vector3>();
 Player P(int i)=>Player.Get(bots[i]);
 void Awake(){Instance=this;LabApi.Events.Handlers.PlayerEvents.ChangedRole+=OnOrderRoleChanged;LabApi.Events.Handlers.PlayerEvents.Hurt+=OnHurt;LabApi.Events.Handlers.PlayerEvents.Hurting+=OnHurting;}
 void OnHurting(LabApi.Events.Arguments.PlayerEvents.PlayerHurtingEventArgs e){if(bots.Contains(e.Player.ReferenceHub)&&e.DamageHandler is PlayerStatsSystem.UniversalDamageHandler d&&d.TranslationId==PlayerStatsSystem.DeathTranslations.Falldown.Id)e.IsAllowed=false;}
 void OnHurt(LabApi.Events.Arguments.PlayerEvents.PlayerHurtEventArgs e){if(running&&bots.Contains(e.Player.ReferenceHub))Record("Damage: "+e.Attacker?.Nickname+" -> "+e.Player.Nickname+" ["+e.DamageHandler.GetType().Name+"] HP="+e.Player.Health);}
 void OnDestroy(){LabApi.Events.Handlers.PlayerEvents.ChangedRole-=OnOrderRoleChanged;Stop();LabApi.Events.Handlers.PlayerEvents.Hurt-=OnHurt;LabApi.Events.Handlers.PlayerEvents.Hurting-=OnHurting;Clear();Instance=null;}
 void Record(string message,bool? pass=null){var e=new JObject{["seconds"]=Math.Round(Time.time-began,2),["message"]=message};if(pass.HasValue)e["pass"]=pass.Value;history.Add(e);LabApi.Features.Console.Logger.Info("[MZ bots] "+message);Save();}
 void Save(){File.WriteAllText("mz-bots-report.json",new JObject{["status"]=Status,["history"]=history.DeepClone(),["killfeed"]=events.DeepClone(),["nativeShots"]=shots,["captureErrors"]=MzPlugin.Instance?.Combat?.Errors??-1}.ToString());}
 public void Prepare(){
  Stop();if(bots.Any(h=>h==null)){Clear();}
  if(bots.Count==0)JoinUnselected();
  oldRoundLock=oldRoundLock??Round.IsLocked;Round.IsLocked=true;if(!Round.IsRoundStarted)Round.Start();
  phase="preparing";timeline.Clear();cursor=0;began=Time.time;running=true;
  At(2,"select factions after joining",()=>SelectLineup());
  At(4,"place roster",()=>{Setup();phase="ready; use mzbots play";Dump();});
 }
 void Setup(){
  if(identities==null||identities.Any(x=>x.Faction==null))throw new InvalidOperationException("Select factions before placing the lineup.");
  CaptureOrder("before-roster-refresh",true);
  var room=Room.List.FirstOrDefault(r=>r.Name.ToString()=="Hcz939")??Room.List.First(r=>r.Name.ToString().StartsWith("Hcz"));
  origin=room.Position+Vector3.up*1.2f;
  setupSpawns.Clear();
  if(File.Exists("mz-bot-safe-spawns.json")){
   var layouts=JObject.Parse(File.ReadAllText("mz-bot-safe-spawns.json"));var ps=layouts[room.GameObject.name.Replace("(Clone)","")] as JArray;
   if(ps!=null)foreach(JArray v in ps)setupSpawns.Add(room.Transform.TransformPoint(new Vector3(v[0].Value<float>(),v[1].Value<float>()+1f,v[2].Value<float>())));
   if(setupSpawns.Count>=9)origin=setupSpawns[0];
  }
  for(int i=0;i<9;i++)ResetBot(i);
  CaptureOrder("after-roster-refresh",true);
  Record("Prepared 6 humans + 939/049/173 in "+room.Name+" at "+origin);
 }
 void ResetBot(int i){
  var p=P(i);p.SetRole(i<6?RoleTypeId.NtfSergeant:i==6?RoleTypeId.Scp939:i==7?RoleTypeId.Scp049:RoleTypeId.Scp173,RoleChangeReason.RemoteAdmin,RoleSpawnFlags.None);
  RenameBot(i);p.IsGodModeEnabled=false;bots[i].playerEffectsController.DisableAllEffects();p.Health=p.MaxHealth;p.HumeShield=0;p.ArtificialHealth=0;
  p.Position=setupSpawns.Count>=9?setupSpawns[i]:origin+new Vector3((i%3)*2.5f,0,12+(i/3)*3);p.LookRotation=new Vector2(0,180);
  if(i<6){p.AddItem(ItemType.ArmorCombat);var gun=(FirearmItem)p.AddItem(ItemType.GunE11SR);p.CurrentItem=gun;p.AddItem(ItemType.GrenadeFlash);p.AddItem(ItemType.GrenadeHE);}
 }
 void Pair(int a,int b,float distance){P(a).Position=origin;P(b).Position=origin+Vector3.forward*distance;Face(a,b);Face(b,a);}
 void Face(int a,int b){var delta=P(b).Camera.position-Vector3.up*.45f-P(a).Camera.position;P(a).LookRotation=new Vector2(Mathf.Atan2(delta.y,new Vector2(delta.x,delta.z).magnitude)*Mathf.Rad2Deg,Mathf.Atan2(delta.x,delta.z)*Mathf.Rad2Deg);}
 bool Act(int i,string name,bool required=true){var a=DummyActionCollector.ServerGetActions(bots[i]).FirstOrDefault(x=>x.Action!=null&&x.Name==name);if(a.Action==null){if(required)throw new Exception("Missing native dummy action "+i+": "+name);return false;}a.Action();return true;}
 void Release(){foreach(var h in bots.Where(h=>h!=null))foreach(var a in DummyActionCollector.ServerGetActions(h).ToArray())if(a.Action!=null&&a.Name.EndsWith("->Release"))a.Action();}
 void At(float second,string name,Action a)=>timeline.Add(Tuple.Create(second,name,a));
 public void Stop(){running=false;fireUntil=0;walkTargets.Clear();Release();timeline.Clear();phase="stopped";if(oldRoundLock.HasValue){Round.IsLocked=oldRoundLock.Value;oldRoundLock=null;}Save();}
 public void Clear(){Stop();CaptureOrder("before-clear",true);foreach(var h in bots)if(h!=null)Mirror.NetworkServer.Destroy(h.gameObject);bots.Clear();sampleFile=null;identities=null;phase="cleared";Save();}
 public void Dump(){File.WriteAllText("mz-bots-actions.json",new JArray(bots.Select((h,i)=>new JObject{["index"]=i,["name"]=P(i).Nickname,["role"]=P(i).Role.ToString(),["position"]=P(i).Position.ToString(),["actions"]=new JArray(DummyActionCollector.ServerGetActions(h).Select(a=>a.Name))})).ToString());Save();}
 public void Play(){
  if(bots.Count!=9)throw new Exception("Run mzbots prepare first; wait 5 seconds.");
  Stop();oldRoundLock=Round.IsLocked;Round.IsLocked=true;Setup();history.Clear();events.Clear();eventIds.Clear();shots=0;began=Time.time;cursor=0;running=true;phase="playing";walkNext=0;
  At(2,"walk and turn",()=>{Pair(0,6,5);walkStart=P(0).Position;startHealth=P(6).Health;startShots=shots;});
  At(4,"load gun",()=>{var gun=(FirearmItem)P(0).CurrentItem;gun.Base.TryGetModule<InventorySystem.Items.Firearms.Modules.IPrimaryAmmoContainerModule>(out var mag);mag.ServerModifyAmmo(mag.AmmoMax-mag.AmmoStored);gun.Base.TryGetModule<InventorySystem.Items.Firearms.Modules.AutomaticActionModule>(out var action);action.ServerCycleAction();});
  At(5,"verify walking; aim",()=>{Record("Native walk changed position",Vector3.Distance(walkStart,P(0).Position)>.2f);Pair(0,6,4);});
  At(7,"server firearm module burst",()=>Burst(0,6,1.5f));
  At(9,"release gun",()=>{fireUntil=0;Record("Native shots and damage",shots>startShots&&P(6).Health<startHealth);});
  At(12,"939 claw setup",()=>{ResetBot(0);P(6).Position=origin+Vector3.forward*1.2f;P(0).Position=origin;Face(6,0);Face(0,6);startHealth=P(0).Health;});
  At(14,"939 native claw",()=>{var role=(PlayerRoles.PlayableScps.Scp939.Scp939Role)bots[6].roleManager.CurrentRole;role.SubroutineModule.TryGetSubroutine<PlayerRoles.PlayableScps.Scp939.Scp939ClawAbility>(out var claw);Face(6,0);Invoke(claw,"ServerPerformAttack");});
  At(16,"verify claw; 049 approach",()=>{Record("939 native claw damaged human",P(0).Health<startHealth);Pair(7,0,1.2f);});
  At(18,"049 first touch",()=>DoctorTouch());
  At(20,"cardiac ticks",()=>{Record("049 native touch caused cardiac arrest",bots[0].playerEffectsController.GetEffect<CustomPlayerEffects.CardiacArrest>().IsEnabled);});
  At(23,"049 second touch",()=>DoctorTouch());
  At(25,"verify death and assist",()=>{Record("049 touch kill",!P(0).IsAlive);var feed=MzPlugin.Instance.Combat.Ledger.Snapshot(MzPlugin.Instance.Combat.Now);Record("049 kill plus 939 damage assist",feed.Any(e=>e.Value<string>("icon")=="049-touch"&&e["assists"].Any(a=>a["icons"].Any(x=>x.ToString()=="939-claw"))));});
  At(32,"respawn dead human",()=>{ResetBot(0);Record("Respawned same bot for next wave");});
  At(35,"flash assist fixture",()=>{ResetBot(6);Pair(0,6,4);P(6).Health=120;P(6).HumeShield=0;});
  At(38,"replay actual flash exposure",()=>{var flash=UnityEngine.Object.Instantiate(Resources.FindObjectsOfTypeAll<InventorySystem.Items.ThrowableProjectiles.FlashbangGrenade>().First());Set(flash,"PreviousOwner",new Footprint(bots[2]));flash.transform.position=P(6).Camera.position+P(6).Camera.forward*2;Invoke(flash,"ProcessPlayer",bots[6]);Record("Flash applied to SCP",bots[6].playerEffectsController.GetEffect<CustomPlayerEffects.Flashed>().IsEnabled);UnityEngine.Object.Destroy(flash.gameObject);});
  At(40,"gun kill after flash",()=>Burst(0,6,3.5f));
  At(46,"verify human item assist",()=>{var feed=MzPlugin.Instance.Combat.Ledger.Snapshot(MzPlugin.Instance.Combat.Now);Record("Gun kill plus random dummy flash assist",feed.Any(e=>e.Value<string>("icon")=="item:GunE11SR"&&e["assists"].Any(a=>a["icons"].Any(x=>x.ToString()=="human-flash"))));});
  At(50,"SCP respawn",()=>ResetBot(6));
  At(53,"finished",()=>{phase="finished; mzbots play to replay";Record("Finished scripted native-action rehearsal");});
 }
 static object Invoke(object obj,string method,params object[] args){for(var t=obj.GetType();t!=null;t=t.BaseType){var m=t.GetMethod(method,BindingFlags.Public|BindingFlags.NonPublic|BindingFlags.Instance|BindingFlags.DeclaredOnly);if(m!=null)return m.Invoke(obj,args);}throw new MissingMethodException(method);}
 static void Set(object obj,string key,object value){for(var t=obj.GetType();t!=null;t=t.BaseType){var f=t.GetField(key,BindingFlags.Public|BindingFlags.NonPublic|BindingFlags.Instance);if(f!=null){f.SetValue(obj,value);return;}var p=t.GetProperty(key,BindingFlags.Public|BindingFlags.NonPublic|BindingFlags.Instance);if(p!=null){p.SetValue(obj,value);return;}}throw new MissingFieldException(key);}
 void DoctorTouch(){Face(7,0);var role=(PlayerRoles.PlayableScps.Scp049.Scp049Role)bots[7].roleManager.CurrentRole;role.SubroutineModule.TryGetSubroutine<PlayerRoles.PlayableScps.Scp049.Scp049AttackAbility>(out var touch);using(var writer=NetworkWriterPool.Get()){writer.WriteReferenceHub(bots[0]);touch.ServerProcessCmd(new NetworkReader(writer.ToArraySegment()));}}
 void Burst(int actor,int target,float duration){fireActor=actor;fireTarget=target;fireUntil=Time.time+duration;fireNext=Time.time;}
 void Shoot(){if(!P(fireTarget).IsAlive){fireUntil=0;return;}Face(fireActor,fireTarget);var gun=(FirearmItem)P(fireActor).CurrentItem;gun.Base.TryGetModule<AutomaticActionModule>(out var action);if(action.AmmoStored==0)return;Invoke(action,"ServerShoot",bots[fireTarget]);shots++;}
 void Update(){PollOrderSamples();
  if(!running)return;
  try{
   var t=Time.time-began;
   MoveActors();
   if(Time.time<fireUntil&&Time.time>=fireNext){Shoot();fireNext=Time.time+.2f;}
   if(phase=="playing"&&t>=2&&t<5&&Time.time>=walkNext){Act(0,"Walk right 0.05m");walkNext=Time.time+.05f;}
   while(cursor<timeline.Count&&t>=timeline[cursor].Item1){var step=timeline[cursor++];phase=phase.StartsWith("preparing")?phase:"playing";Record(step.Item2);step.Item3();}
   if(MzPlugin.Instance?.Combat!=null)foreach(var e in MzPlugin.Instance.Combat.Ledger.Snapshot(MzPlugin.Instance.Combat.Now)){var id=e.ToString(Newtonsoft.Json.Formatting.None);if(eventIds.Add(id))events.Add(e.DeepClone());}
   if(cursor>=timeline.Count){running=false;Release();Save();}
  }catch(Exception e){phase="failed";running=false;Release();Record(e.ToString(),false);}
 }
}
