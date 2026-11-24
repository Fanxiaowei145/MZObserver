using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace MzObserver {
// No Unity dependencies: the exact production state machine is also exercised by CoreTests.
public sealed class MatchState {
 public string Epoch {get;private set;}=Guid.NewGuid().ToString("N");
 public string Phase {get;private set;}="preparing";
 public bool Paused; public double HalfMs,WaveMs; public int Wave,HumanScore,ScpScore;
 public long Revision; public readonly List<JObject> Slots=new List<JObject>();
 public List<string> Order=new List<string>();
 public List<string> LastSurvivors=new List<string>();
 private HashSet<string> survivors=new HashSet<string>(); private bool vacancy;
 private readonly HashSet<string> deaths=new HashSet<string>();
 public void Reset(){Epoch=Guid.NewGuid().ToString("N");Phase="preparing";Paused=false;HalfMs=WaveMs=0;Wave=HumanScore=ScpScore=0;Slots.Clear();Order.Clear();LastSurvivors.Clear();survivors.Clear();deaths.Clear();vacancy=false;Revision++;}
 static bool Alive(JObject p)=>p.Value<bool?>("alive")==true;
 static string Side(JObject p)=>p.Value<string>("side");
 static string Identity(JObject p)=>p.Value<string>("actorId");
 static IEnumerable<JObject> Sorted(IEnumerable<JObject> p)=>p.OrderBy(x=>x.Value<int>("rolePriority")).ThenBy(x=>x.Value<long>("spawnOrder"));
 public void End(){if(Phase=="live")Phase="ended";}
 public void Tick(IList<JObject> observed,double deltaMs,bool roundLive){
  Revision++;
  var eligible=observed.Where(p=>Alive(p)&&(Side(p)=="human"||Side(p)=="scp")).ToList();
  if(Phase=="preparing"){
   if(!roundLive||eligible.Count(p=>Side(p)=="human")!=6||eligible.Count(p=>Side(p)=="scp")!=3)return;
   foreach(var side in new[]{"human","scp"}){int i=1;foreach(var p in Sorted(eligible.Where(x=>Side(x)==side))){var c=(JObject)p.DeepClone();c["id"]=(side=="human"?"H":"S")+(i++).ToString("00");c["dead"]=false;Slots.Add(c);}}
   Order=Slots.Select(p=>p.Value<string>("id")).ToList();survivors=new HashSet<string>(Order);Phase="live";HalfMs=WaveMs=0;Wave=1;return;
  }
  if(Phase!="live"&&Phase!="ended")return;
  // Match clocks/scoring end at 25 minutes. Telemetry must remain live so the
  // observer can still see health, vigor, movement, deaths and role changes.
  if(Phase=="live"&&!Paused){var d=Math.Min(Math.Max(0,deltaMs),Math.Max(0,1500000-HalfMs));HalfMs+=d;WaveMs+=d;}
  if(HalfMs>=1500000)End();
  var byId=observed.ToDictionary(Identity);
  for(int i=0;i<Slots.Count;i++){
   var old=Slots[i];string slot=old.Value<string>("id");JObject now;
   if(byId.TryGetValue(Identity(old),out now)&&Alive(now)&&Side(now)==Side(old)){
    var c=(JObject)now.DeepClone();c["id"]=slot;c["dead"]=false;Slots[i]=c;
   }else{old["alive"]=false;old["dead"]=true;old["hp"]=0;old["hs"]=0;old["ahp"]=0;old["held"]=null;old["ammo"]=null;old["effects"]=new JArray();old["special"]=new JArray();old["inventory"]=new JArray();survivors.Remove(slot);vacancy=true;}
  }
  // New SCP queue members can take an empty display slot. Never duplicate an actor.
  foreach(var p in Sorted(eligible)){
   if(Slots.Any(x=>Identity(x)==Identity(p)&&!x.Value<bool>("dead")))continue;
   var empty=Slots.FirstOrDefault(x=>x.Value<bool>("dead")&&Side(x)==Side(p));if(empty==null)continue;
   int i=Slots.IndexOf(empty);var c=(JObject)p.DeepClone();c["id"]=empty["id"].DeepClone();c["dead"]=false;survivors.Remove(c.Value<string>("id"));vacancy=true;Slots[i]=c;
  }
  if(vacancy&&Slots.All(x=>!x.Value<bool>("dead"))){
   var next=new List<string>();foreach(string side in new[]{"human","scp"}){
    next.AddRange(Order.Where(id=>survivors.Contains(id)&&Slots.Any(p=>p.Value<string>("id")==id&&Side(p)==side)));
    next.AddRange(Sorted(Slots.Where(p=>Side(p)==side&&!survivors.Contains(p.Value<string>("id")))).Select(p=>p.Value<string>("id")));
   }
   LastSurvivors=survivors.ToList();Order=next;Wave++;if(Phase=="live")WaveMs=0;vacancy=false;survivors=new HashSet<string>(Order);
  }
 }
 public void Death(string actor,int life,string side,bool countScore=true){
  if(Phase!="live"||!deaths.Add(actor+":"+life)||!Slots.Any(p=>Identity(p)==actor))return;
  if(countScore){if(side=="human")ScpScore++;else if(side=="scp")HumanScore+=3;}
  var s=Slots.First(p=>Identity(p)==actor);s["dead"]=true;s["alive"]=false;survivors.Remove(s.Value<string>("id"));vacancy=true;
  // Only the last transition to no living members grants the wipe bonus.
  if(countScore&&Slots.Where(p=>Side(p)==side).All(p=>p.Value<bool>("dead"))){if(side=="human")ScpScore+=3;else HumanScore+=3;}
 }
 public JObject Snapshot()=>new JObject{["protocol"]=1,["type"]="state",["epoch"]=Epoch,["sequence"]=Revision,["phase"]=Phase,["paused"]=Paused,["halfElapsedMs"]=HalfMs,["waveElapsedMs"]=WaveMs,["wave"]=Wave,["humanScore"]=HumanScore,["scpScore"]=ScpScore,["players"]=new JArray(Slots.Select(x=>x.DeepClone())),["order"]=new JArray(Order),["survivorIds"]=new JArray(LastSurvivors)};
}
}
