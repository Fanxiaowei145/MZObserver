using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
class DummyIdentityTests {
 static int checks;
 static void Check(bool value){checks++;if(!value)throw new Exception("Dummy identity assertion failed");}
 static void Main(string[] args){
  for(int seed=0;seed<50;seed++){
   var identities=DummyIdentity.Create(seed);Check(identities.Select(x=>x.BaseName).Distinct().Count()==9);Check(identities.Select(x=>x.Category).Distinct().Count()==4);
   for(int i=0;i<9;i++){var p=identities[i];Check(p.Faction==null&&p.DisplayName==p.BaseName);Check(!p.DisplayName.StartsWith("[NTF]")&&!p.DisplayName.StartsWith("[SCP]"));
    Check(p.Category=="digits"?Regex.IsMatch(p.BaseName,"^[0-9]+$"):p.Category=="english"?Regex.IsMatch(p.BaseName,"^[A-Za-z]+$"):p.Category=="chinese"?Regex.IsMatch(p.BaseName,"^[\\u4e00-\\u9fff]+$"):Regex.IsMatch(p.BaseName,"[^A-Za-z0-9\\u4e00-\\u9fff]"));
    string original=p.BaseName;p.Select(i<6?"NTF":"SCP");Check(p.BaseName==original&&p.DisplayName==(i<6?"[NTF]":"[SCP]")+original);p.Select(i<6?"NTF":"SCP");Check(p.DisplayName==(i<6?"[NTF]":"[SCP]")+original);
   }
  }
  int sampleSeed=Guid.NewGuid().GetHashCode();var rows=DummyIdentity.Create(sampleSeed);
  string folder=Path.Combine(args[0],"synthetic",DateTime.UtcNow.ToString("yyyyMMddTHHmmssfff")+"-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(folder);
  string file=Path.Combine(folder,"identity-events.jsonl");int index=0;
  Action<string> save=stage=>{var e=new JObject{["schema"]=1,["captureKind"]="synthetic-identity-fixture",["eventIndex"]=++index,["utc"]=DateTime.UtcNow.ToString("o"),["seed"]=sampleSeed,["stage"]=stage,["players"]=new JArray(rows.Select((p,i)=>new JObject{["index"]=i,["category"]=p.Category,["baseName"]=p.BaseName,["selectedFaction"]=p.Faction,["name"]=p.DisplayName}))};File.AppendAllText(file,e.ToString(Formatting.None)+Environment.NewLine,new UTF8Encoding(false));};
  save("joined-unselected");for(int i=0;i<9;i++){rows[i].Select(i<6?"NTF":"SCP");save("faction-selected:"+i);}save("selection-complete");
  File.WriteAllText(args[1],folder,new UTF8Encoding(false));Console.WriteLine("PASS "+checks+" identity checks; synthetic samples: "+folder);
 }
}
