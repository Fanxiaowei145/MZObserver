using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Security.Authentication;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using CommandSystem;
using LabApi.Features.Wrappers;
using LabApi.Features.Console;
using LabApi.Loader.Features.Plugins;
using LabApi.Events.Handlers;
using LabApi.Events.Arguments.PlayerEvents;
using LabApi.Events.Arguments.Scp096Events;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using PlayerRoles;
using UnityEngine;

using WebSocketSharp.Server;
using Player=LabApi.Features.Wrappers.Player;
using Logger=LabApi.Features.Console.Logger;

namespace MzObserver {
public sealed class MzPlugin:Plugin<Config> {
 public override string Name=>"MZObserver";public override string Description=>"MZ observer telemetry for the desktop overlay";public override string Author=>"MZ UI project";public override Version Version=>new Version(0,1,10);public override Version RequiredApiVersion=>new Version(1,1,7);
 public static MzPlugin Instance;
 public CombatCapture Combat;
 public readonly MatchState Match=new MatchState();public readonly Collector Collector=new Collector();
 readonly Stopwatch clock=Stopwatch.StartNew();double previous,nextTick,nextMap;long damageSerial;
 readonly Dictionary<Feed,TargetFeedbackGate> targetFeedback=new Dictionary<Feed,TargetFeedbackGate>();
 readonly ConcurrentQueue<Action> requests=new ConcurrentQueue<Action>();
 sealed class Permit {public string Actor;public uint Net;public double Expires;public HudSession Hud=new HudSession();}
 readonly Dictionary<string,Permit> codes=new Dictionary<string,Permit>(),tokens=new Dictionary<string,Permit>();
 readonly HashSet<int> generators=new HashSet<int>();
 WebSocketServer server;GameObject loop;
 readonly Dictionary<string,Tuple<double,int>> authAttempts=new Dictionary<string,Tuple<double,int>>();JArray map=new JArray();string mapEpoch="";double nextError;int mapRevision;
 public override void Enable(){
  try{EnableCore();}catch{Disable();throw;}
 }
 void EnableCore(){
  if(!Config.Enabled)return;Instance=this;
  server=new WebSocketServer(IPAddress.Parse(Config.ListenAddress),Config.Port,!string.IsNullOrEmpty(Config.CertificatePath));
  if(!string.IsNullOrEmpty(Config.CertificatePath)){server.SslConfiguration.ServerCertificate=new X509Certificate2(Config.CertificatePath,Config.CertificatePassword);server.SslConfiguration.EnabledSslProtocols=SslProtocols.Tls12;}
  Feed.Receive=(f,s)=>requests.Enqueue(()=>Authenticate(f,s));server.AddWebSocketService<Feed>("/mz");server.Start();
  ServerEvents.WaitingForPlayers+=Reset;ServerEvents.RoundRestarted+=Reset;
  PlayerEvents.ShotWeapon+=Shot;PlayerEvents.Death+=Death;PlayerEvents.Escaped+=Escaped;PlayerEvents.Hurt+=Hurt;PlayerEvents.ChangedRole+=Changed;
  Scp096Events.AddedTarget+=Looked;
  Combat=new CombatCapture(()=>clock.Elapsed.TotalSeconds);Combat.Start();
  previous=clock.Elapsed.TotalMilliseconds;loop=new GameObject("MZObserverLoop");UnityEngine.Object.DontDestroyOnLoad(loop);loop.AddComponent<MzLoop>();
  Logger.Raw("[INFO] [MZObserver] MZObserver 0.1.10-preview.14 listening on "+Config.ListenAddress+":"+Config.Port+"/mz",ConsoleColor.White);
 }
 public override void Disable(){
  Combat?.Dispose();Combat=null;
  ServerEvents.WaitingForPlayers-=Reset;ServerEvents.RoundRestarted-=Reset;PlayerEvents.ShotWeapon-=Shot;PlayerEvents.Death-=Death;PlayerEvents.Escaped-=Escaped;PlayerEvents.Hurt-=Hurt;PlayerEvents.ChangedRole-=Changed;Scp096Events.AddedTarget-=Looked;
  foreach(var f in Feed.Clients.Values)f.Revoke();server?.Stop();Feed.Receive=null;if(loop!=null)UnityEngine.Object.Destroy(loop);tokens.Clear();codes.Clear();authAttempts.Clear();Instance=null;
 }
 void Reset(){targetFeedback.Clear();Combat?.Reset();Match.Reset();Collector.Reset();generators.Clear();map=new JArray();mapEpoch="";nextMap=0;previous=clock.Elapsed.TotalMilliseconds;}
 void Changed(PlayerChangedRoleEventArgs e){foreach(var set in Collector.Looked.Values)set.Remove(e.Player.NetworkId);Collector.Looked.Remove(e.Player.NetworkId);}
 void Looked(Scp096AddedTargetEventArgs e){if(!e.WasLooking){HashSet<uint> old;if(Collector.Looked.TryGetValue(e.Player.NetworkId,out old))old.Remove(e.Target.NetworkId);return;}HashSet<uint> s;if(!Collector.Looked.TryGetValue(e.Player.NetworkId,out s))Collector.Looked[e.Player.NetworkId]=s=new HashSet<uint>();s.Add(e.Target.NetworkId);}
 void Shot(PlayerShotWeaponEventArgs e){Collector.Shot(e.Player);}
 void Death(PlayerDeathEventArgs e){string r=Collector.RoleName(e.OldRole);if(r==null)return;var side=e.OldRole.ToString().StartsWith("Scp")?"scp":"human";Match.Death(Collector.Actor(e.Player),e.Player.LifeId,side,Config.AutomaticScores);}
 void Escaped(PlayerEscapedEventArgs e){if(Config.AutomaticScores&&Match.Phase=="live"&&e.OldRole==RoleTypeId.Scientist&&Match.Slots.Any(p=>p.Value<string>("actorId")==Collector.Actor(e.Player)))Match.HumanScore+=5;}
 void Hurt(PlayerHurtEventArgs e){var handler=e.DamageHandler;string kind=null;var type=handler.GetType().Name;
  if(handler is PlayerStatsSystem.Scp049DamageHandler cardiac && cardiac.DamageSubType==PlayerStatsSystem.Scp049DamageHandler.AttackType.CardiacArrest)kind="cardiac";
  if(type=="ScpDamageHandler"&&Equals(Collector.Read(handler,"_translationId"),PlayerStatsSystem.DeathTranslations.PocketDecay.Id))kind="corroding";
  if(kind!=null)Collector.Damage[e.Player.NetworkId]=Tuple.Create(++damageSerial,kind);
 }
 string RosterStamp()=>new JArray(Player.List.OrderBy(p=>p.NetworkId).Select(p=>new JArray(Collector.Actor(p),p.NetworkId,p.LifeId,p.Role.ToString(),p.IsAlive))).ToString(Formatting.None);
 void FastTargets(double now){
  if(targetFeedback.Count==0)return;
  var roster=RosterStamp();
  foreach(var pair in targetFeedback.ToArray()){
   var f=pair.Key;var gate=pair.Value;if(!Feed.Clients.Values.Contains(f)||f.Observer==null){targetFeedback.Remove(f);continue;}
   var observer=Player.List.FirstOrDefault(p=>p.NetworkId==f.ObserverNetId&&Collector.Actor(p)==f.Observer);
   if(observer==null){targetFeedback.Remove(f);f.Revoke();continue;}
   var role=observer.Role.ToString();if(role!="Spectator"&&role!="Overwatch")continue;
   var target=observer.CurrentlySpectating;if(target==null||!target.IsAlive)continue;
   var actor=Collector.Actor(target);
   if(!gate.Change(Match.Epoch,roster,role,actor,now))continue;
   f.Feedback(new JObject{["type"]="target-feedback",["protocol"]=1,["epoch"]=gate.Epoch,["baseSequence"]=gate.Sequence,["serverTimeMs"]=now,["observerActorId"]=f.Observer,["observerNetworkId"]=f.ObserverNetId,["observerRole"]=role,["observedActorId"]=actor,["observedLifeId"]=target.LifeId}.ToString(Formatting.None));
  }
 }
 internal void Tick(){
  var now=clock.Elapsed.TotalMilliseconds;if(now<nextTick){try{FastTargets(now);}catch(Exception e){if(now>nextError){Logger.Raw("[ERROR] [MZObserver] Target feedback: "+e,ConsoleColor.Red);nextError=now+5000;}}return;}nextTick=now+1000.0/Math.Max(1,Math.Min(30,Config.UpdatesPerSecond));var delta=now-previous;previous=now;
  try{
   Action action;for(int i=0;i<32&&requests.TryDequeue(out action);i++)action();
   foreach(var key in codes.Where(x=>x.Value.Expires<now).Select(x=>x.Key).ToArray())codes.Remove(key);
   Combat?.Tick();
   var players=Collector.Players(Config.IncludeDummyPlayers);Match.Tick(players,delta,Round.IsRoundInProgress);
   if(Match.Phase=="live"&&Round.IsRoundEnded)Match.End();
   if(mapEpoch!=Match.Epoch||now>nextMap){map=Collector.Map();mapEpoch=Match.Epoch;nextMap=now+10000;mapRevision++;}
   bool computer=players.Any(p=>p.Value<string>("role")=="079"),mobile=players.Any(p=>p.Value<string>("side")=="scp"&&p.Value<string>("role")!="079");
   foreach(var g in Generator.List.Where(g=>g.Engaged)){if(generators.Add(g.Base.GetInstanceID())&&Config.AutomaticScores&&Match.Phase=="live"&&computer&&mobile)Match.HumanScore+=3;}
   foreach(var token in tokens.Where(x=>!Valid(x.Value)).Select(x=>x.Key).ToArray())tokens.Remove(token);
   var rosterStamp=RosterStamp();var common=Match.Snapshot();common["serverTimeMs"]=now;common["killfeedEpoch"]=Combat.Ledger.Epoch;common["killfeed"]=Combat.Ledger.Snapshot(clock.Elapsed.TotalSeconds);
   foreach(var f in Feed.Clients.Values){if(f.Observer==null)continue;var observer=Player.List.FirstOrDefault(p=>p.NetworkId==f.ObserverNetId&&Collector.Actor(p)==f.Observer);if(observer==null){f.Revoke();continue;}
    var s=(JObject)common.DeepClone();var target=observer.CurrentlySpectating;
    if(target==null&&observer.IsAlive)target=observer;
    s["observerActorId"]=f.Observer;s["observerNetworkId"]=f.ObserverNetId;s["observerRole"]=observer.Role.ToString();s["observedActorId"]=target==null?null:Collector.Actor(target);s["zoom"]=f.Hud.Zoom;s["uiVisible"]=f.Hud.Visible;
    // Full map on pairing/reconnect and periodic resync, not every positional tick.
    if(f.MapRevision!=mapRevision){f.Control(new JObject{["type"]="layout",["epoch"]=Match.Epoch,["rooms"]=map.DeepClone()}.ToString(Formatting.None));f.MapRevision=mapRevision;}f.Publish(s.ToString(Formatting.None));
    if(f.TargetFeedbackEnabled){TargetFeedbackGate gate;if(!targetFeedback.TryGetValue(f,out gate))targetFeedback[f]=gate=new TargetFeedbackGate();gate.Commit(Match.Epoch,s.Value<long>("sequence"),rosterStamp,observer.Role.ToString(),target==null?null:Collector.Actor(target),now);}
   }
  }catch(Exception e){if(now>nextError){Logger.Raw("[ERROR] [MZObserver] MZ telemetry: "+e,ConsoleColor.Red);nextError=now+5000;}foreach(var f in Feed.Clients.Values.Where(f=>f.Observer!=null))f.Publish("{\"type\":\"unavailable\",\"reason\":\"服务器数据暂不可用\"}");}
 }
 bool Valid(Permit p)=>Player.List.Any(x=>x.NetworkId==p.Net&&Collector.Actor(x)==p.Actor);
 static string RandomToken(int length){var b=new byte[length];using(var rng=RandomNumberGenerator.Create())rng.GetBytes(b);return BitConverter.ToString(b).Replace("-","");}
 public string Pair(Player p){if(p==null||!p.IsOverwatchEnabled)throw new InvalidOperationException("请先进入 OW 监管模式");foreach(var old in codes.Where(x=>x.Value.Actor==Collector.Actor(p)).Select(x=>x.Key).ToArray())codes.Remove(old);var c=PairingCode.Create(code=>codes.ContainsKey(code));codes[c]=new Permit{Actor=Collector.Actor(p),Net=p.NetworkId,Expires=clock.Elapsed.TotalMilliseconds+120000};return c;}
 void Authenticate(Feed f,string text){try{var j=JObject.Parse(text);var key=(j.Value<string>("code")??j.Value<string>("token")??"").Trim();
  if(j["token"]==null){var now=clock.Elapsed.TotalMilliseconds;foreach(var old in authAttempts.Where(a=>a.Value.Item1+60000<now).Select(a=>a.Key).ToArray())authAttempts.Remove(old);Tuple<double,int> attempts;authAttempts.TryGetValue(f.RemoteAddress,out attempts);if(attempts!=null&&attempts.Item2>=10){f.Control("{\"type\":\"error\",\"message\":\"配对尝试过于频繁，请一分钟后重试\"}");return;}authAttempts[f.RemoteAddress]=Tuple.Create(attempts?.Item1??now,(attempts?.Item2??0)+1);}
  Permit permit;bool fresh=codes.TryGetValue(key,out permit);if(!fresh&&!tokens.TryGetValue(key,out permit)){f.Control("{\"type\":\"error\",\"message\":\"配对码无效或已过期\"}");return;}if(!Valid(permit)||(fresh&&(permit.Expires<clock.Elapsed.TotalMilliseconds||!Player.List.Any(p=>p.NetworkId==permit.Net&&Collector.Actor(p)==permit.Actor&&p.IsOverwatchEnabled)))){f.Revoke();return;}
  if(fresh)codes.Remove(key);var token=fresh?RandomToken(32):key;tokens[token]=permit;
  f.TargetFeedbackEnabled=j.Value<int?>("targetFeedbackVersion")==1;f.Hud=permit.Hud;permit.Hud.ReleaseKeys();f.Observer=permit.Actor;f.ObserverNetId=permit.Net;f.Control(new JObject{["type"]="authenticated",["token"]=token}.ToString(Formatting.None));
 }catch{f.Control("{\"type\":\"error\",\"message\":\"请求格式错误\"}");}}
 public bool Admin(ArraySegment<string> args,out string response){response="mzuiadmin pause | resume | reset | score <人类> <SCP> | status";if(args.Count==0)return false;var a=args.ToArray();switch(a[0].ToLowerInvariant()){
  case "pause":Match.Paused=true;response="HUD 比赛计时已暂停；游戏本身的暂停仍由赛事管理执行。";return true;
  case "resume":Match.Paused=false;response="HUD 计时已继续。";return true;
  case "reset":Reset();response="已回到准备阶段，将在 6+3 到齐后自动开始。";return true;
  case "score":int h,s;if(a.Length!=3||!int.TryParse(a[1],out h)||!int.TryParse(a[2],out s)||h<0||s<0)return false;Match.HumanScore=h;Match.ScpScore=s;response="比分已更新。";return true;
  case "status":response=Match.Phase+" wave="+Match.Wave+" half="+(int)(Match.HalfMs/1000)+"s connections="+Feed.Clients.Count+" combat_hooks="+(Combat?.HookCount??0)+" combat_errors="+(Combat?.Errors??0);return true;
 }return false;}
}
public sealed class MzLoop:MonoBehaviour {void Update(){MzPlugin.Instance?.Tick();}}
[CommandHandler(typeof(ClientCommandHandler))]
public sealed class PairCommand:ICommand {public string Command=>"mzui";public string[] Aliases=>new string[0];public string Description=>"配对 MZ 观战覆盖软件（OW）";public bool Execute(ArraySegment<string> a,ICommandSender s,out string r){try{if(MzPlugin.Instance==null)throw new Exception("插件未启用");r="MZ 配对码（120 秒有效）："+MzPlugin.Instance.Pair(Player.Get(s));return true;}catch(Exception e){r=e.Message;return false;}}}
[CommandHandler(typeof(RemoteAdminCommandHandler))][CommandHandler(typeof(GameConsoleCommandHandler))]
public sealed class AdminCommand:ICommand {public string Command=>"mzuiadmin";public string[] Aliases=>new string[0];public string Description=>"MZ HUD 计时与比分管理";public bool Execute(ArraySegment<string> a,ICommandSender s,out string r){r="需要 FacilityManagement 权限";if(!s.CheckPermission(PlayerPermissions.FacilityManagement))return false;if(MzPlugin.Instance==null){r="插件未启用";return false;}return MzPlugin.Instance.Admin(a,out r);}}
}
