using System;using System.IO;using System.Linq;using System.Net;using System.Net.Sockets;using System.Collections.Generic;using System.Collections.Concurrent;using System.Diagnostics;using System.Threading;using System.Threading.Tasks;using System.Security.Cryptography;
using Newtonsoft.Json;using Newtonsoft.Json.Linq;using WebSocketSharp.Server;using MzObserver;
class SimServer {
 static readonly ConcurrentQueue<Action> jobs=new ConcurrentQueue<Action>();static MatchState match=new MatchState();static List<JObject> players;static JArray rooms;static WebSocketServer server;static bool running=true,live=false,silent=false,ow=true,zoom=false,uiVisible=true;static string observed="actor1";static int connections,codeUses,resumes,rejections;static string token=Random(32);
 static Dictionary<string,DateTime> codes=new Dictionary<string,DateTime>();
 static string Random(int n){var b=new byte[n];using(var rng=RandomNumberGenerator.Create())rng.GetBytes(b);return BitConverter.ToString(b).Replace("-","");}
 static void Write(JObject o){Console.WriteLine(o.ToString(Formatting.None));}
 static void Main(string[] args){
  var fixture=JObject.Parse(File.ReadAllText(args[0]));rooms=(JArray)fixture["rooms"];players=((JArray)fixture["players"]).Cast<JObject>().ToList();
  var probe=new TcpListener(IPAddress.Loopback,0);probe.Start();int port=((IPEndPoint)probe.LocalEndpoint).Port;probe.Stop();
  server=new WebSocketServer(IPAddress.Loopback,port);server.AddWebSocketService<Feed>("/mz");Feed.Receive=(f,s)=>jobs.Enqueue(()=>Auth(f,s));server.Start();
  Write(new JObject{["ready"]=true,["url"]="ws://127.0.0.1:"+port+"/mz"});
  Task.Run(()=>{string line;while((line=Console.ReadLine())!=null){var text=line;jobs.Enqueue(()=>Command(JObject.Parse(text)));}jobs.Enqueue(()=>running=false);});
  var clock=Stopwatch.StartNew();double prior=0;while(running){Action action;while(jobs.TryDequeue(out action))action();double now=clock.Elapsed.TotalMilliseconds;match.Tick(players,now-prior,live);prior=now;
   if(!silent)foreach(var f in Feed.Clients.Values.Where(f=>f.Observer!=null)){if(f.MapRevision<0){f.Control(new JObject{["type"]="layout",["epoch"]=match.Epoch,["rooms"]=rooms.DeepClone()}.ToString(Formatting.None));f.MapRevision=0;}var s=match.Snapshot();s["observedActorId"]=observed;s["zoom"]=zoom;s["uiVisible"]=uiVisible;f.Publish(s.ToString(Formatting.None));}
   Thread.Sleep(50);
  }foreach(var f in Feed.Clients.Values)f.Revoke();server.Stop();
 }
 static void Auth(Feed f,string text){var j=JObject.Parse(text);string code=j.Value<string>("code"),t=j.Value<string>("token");DateTime expires;
  if(!ow&&t!=token){f.Revoke();return;}if(t==token){resumes++;}else if(code!=null&&codes.TryGetValue(code,out expires)&&expires>DateTime.UtcNow){codes.Remove(code);codeUses++;}else{rejections++;f.Control("{\"type\":\"error\",\"message\":\"配对码无效或已过期\"}");return;}
  f.Observer="simulated-ow";connections++;f.Control(new JObject{["type"]="authenticated",["token"]=token}.ToString(Formatting.None));
 }
 static void Command(JObject j){string op=j.Value<string>("op");var result=new JObject{["reply"]=j["id"]};try{
  switch(op){
   case "pair":var code=PairingCode.Create(codes.ContainsKey);codes[code]=DateTime.UtcNow.AddSeconds(j.Value<int?>("ttl")??120);result["code"]=code;break;
   case "start":live=true;break;
   case "patch":var p=players.First(p=>p.Value<string>("actorId")==j.Value<string>("actor"));foreach(var kv in (JObject)j["values"])p[kv.Key]=kv.Value.DeepClone();break;
   case "target":observed=j.Value<string>("actor");break;
   case "zoom":zoom=j.Value<bool>("value");break;
   case "pause":match.Paused=j.Value<bool>("value");break;
   case "silence":silent=j.Value<bool>("value");break;
   case "drop":foreach(var id in Feed.Clients.Keys.ToArray())server.WebSocketServices["/mz"].Sessions.CloseSession(id);break;
   case "revoke":ow=false;codes.Clear();token=Random(32);foreach(var f in Feed.Clients.Values)f.Revoke();break;
   case "ow":ow=true;break;
   case "leave-ow":ow=false;break;
   case "visibility":uiVisible=j.Value<bool>("value");break;
   case "snapshot":result["state"]=match.Snapshot();break;
   case "stats":result["connections"]=connections;result["codeUses"]=codeUses;result["resumes"]=resumes;result["rejections"]=rejections;break;
   case "quit":running=false;break;
   default:throw new Exception("Unknown command "+op);
  }
  Write(result);
 }catch(Exception e){result["error"]=e.Message;Write(result);}}
}
