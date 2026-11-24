using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
namespace MzObserver {
public sealed class CombatPerson {
 public string Id,Life,Name,Role,Side;
 public JObject Json()=>new JObject{["name"]=Name,["role"]=Side=="scp"?"scp":Role};
}
// Game-independent attribution rules. Every key includes the victim's life identifier.
public sealed class CombatLedger {
 sealed class Credit {public CombatPerson Source;public string Icon;public double Start,End,Grace;public bool Direct;}
 readonly Dictionary<string,List<Credit>> credits=new Dictionary<string,List<Credit>>();
 readonly Dictionary<string,CombatPerson> captures=new Dictionary<string,CombatPerson>();
 readonly HashSet<string> dead=new HashSet<string>();
 readonly List<JObject> notices=new List<JObject>();long serial;
 public string Epoch {get;private set;}=Guid.NewGuid().ToString("N");
 public void Reset(){credits.Clear();captures.Clear();dead.Clear();notices.Clear();Epoch=Guid.NewGuid().ToString("N");serial=0;}
 List<Credit> For(string life){List<Credit> list;if(!credits.TryGetValue(life,out list))credits[life]=list=new List<Credit>();return list;}
 static bool Enemy(CombatPerson source,CombatPerson target)=>source!=null&&target!=null&&source.Id!=target.Id&&source.Side!=target.Side;
 public void DirectHit(CombatPerson target,CombatPerson source,string icon,double damage,double now){
  if(!Enemy(source,target)||source.Side!="scp"||string.IsNullOrEmpty(icon)||damage<=0||dead.Contains(target.Life))return;
  var list=For(target.Life);if(!list.Any(c=>c.Direct&&c.Source.Life==source.Life&&c.Icon==icon))list.Add(new Credit{Source=source,Icon=icon,Start=now,End=double.PositiveInfinity,Direct=true});
 }
 public void Heal(string life,double hp,double maxHp){if(maxHp>0&&hp>=maxHp){List<Credit> list;if(credits.TryGetValue(life,out list))list.RemoveAll(c=>c.Direct);}}
 public void Effect(CombatPerson target,CombatPerson source,string icon,double ownEnd,double grace,double now,bool append=false){
  if(!Enemy(source,target)||dead.Contains(target.Life)||string.IsNullOrEmpty(icon))return;
  var list=For(target.Life);var existing=list.LastOrDefault(c=>!c.Direct&&c.Source.Life==source.Life&&c.Icon==icon&&c.End>now);
  if(existing==null)list.Add(new Credit{Source=source,Icon=icon,Start=now,End=ownEnd,Grace=grace});
  else {existing.End=append?Math.Max(now,existing.End)+Math.Max(0,ownEnd-now):Math.Max(existing.End,ownEnd);existing.Grace=grace;}
 }
 // Early removal (healing, an ability cancel, etc.) shortens all affected source windows.
 public void EndEffect(string life,string icon,double now){List<Credit> list;if(credits.TryGetValue(life,out list))foreach(var c in list.Where(c=>!c.Direct&&c.Icon==icon&&c.End>now))c.End=now;}
 public void ShortenEffect(string life,string sourceLife,string icon,double end){List<Credit> list;if(credits.TryGetValue(life,out list))foreach(var c in list.Where(c=>!c.Direct&&c.Source.Life==sourceLife&&c.Icon==icon&&c.End>end))c.End=end;}
 public void Capture(CombatPerson target,CombatPerson owner){if(Enemy(owner,target))captures[target.Life]=owner;}
 public CombatPerson Captor(string life){CombatPerson p;return captures.TryGetValue(life,out p)?p:null;}
 public void LeavePocket(string life){captures.Remove(life);}
 public void ClearLife(string life){credits.Remove(life);captures.Remove(life);}
 public JArray Assists(CombatPerson target,CombatPerson killer,double now){
  List<Credit> list;if(!credits.TryGetValue(target.Life,out list))return new JArray();
  var eligible=list.Where(c=>c.Direct||now<=c.End+c.Grace).ToList();
  var burns=eligible.Where(c=>c.Icon=="human-burn").ToList();
  var burn=burns.Where(c=>now<c.End).OrderBy(c=>c.Start).FirstOrDefault()??burns.OrderBy(c=>c.Start).FirstOrDefault();
  eligible.RemoveAll(c=>c.Icon=="human-burn"&&c!=burn);
  var result=new JArray();foreach(var group in eligible.Where(c=>c.Source.Id!=killer?.Id&&c.Source.Id!=target.Id).OrderBy(c=>c.Start).GroupBy(c=>c.Source.Id)){
   var p=group.First().Source.Json();p["icons"]=new JArray(group.Select(c=>c.Icon).Distinct());result.Add(p);
  }return result;
 }
 public JObject Death(CombatPerson target,CombatPerson killer,string icon,bool suicide,double now){
  if(target==null||dead.Contains(target.Life))return null;
  dead.Add(target.Life);
  JObject n=null;if(suicide||killer!=null&&!string.IsNullOrEmpty(icon)){
   n=new JObject{["id"]=++serial,["atMs"]=now*1000,["victim"]=target.Json(),["suicide"]=suicide};
   if(suicide&&icon=="item:SCP207")n["icon"]=icon;
   if(!suicide){n["killer"]=killer.Json();n["icon"]=icon;n["assists"]=Assists(target,killer,now);}notices.Add(n);
  }ClearLife(target.Life);Prune(now);return n;
 }
 public JArray Snapshot(double now){Prune(now);return new JArray(notices.Select(n=>n.DeepClone()));}
 public void Prune(double now){notices.RemoveAll(n=>now*1000-n.Value<double>("atMs")>15000);if(notices.Count>64)notices.RemoveRange(0,notices.Count-64);foreach(var list in credits.Values)list.RemoveAll(c=>!c.Direct&&now>c.End+c.Grace);}
}
}
