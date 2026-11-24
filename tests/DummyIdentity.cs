using System;
using System.Linq;
using System.Collections.Generic;
// Shared by native dummy rehearsal and fixture tests. Faction is a user selection,
// not inferred from the current role and never assigned at join time.
public sealed class DummyIdentity {
 public string BaseName,Category,Faction;
 public string DisplayName=>Faction==null?BaseName:"["+Faction+"]"+BaseName;
 public void Select(string faction){if(faction!="NTF"&&faction!="SCP")throw new ArgumentException("Invalid faction");Faction=faction;}
 public static DummyIdentity[] Create(int seed){
  var rng=new Random(seed);var rows=new List<DummyIdentity>();var unique=new HashSet<string>();
  string[] kinds={"digits","english","chinese","special","digits","english","chinese","special","digits"};
  foreach(var kind in kinds){string name;do{string alphabet=kind=="digits"?"0123456789":kind=="english"?"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz":kind=="chinese"?"云月星海风林山川青白红雪雨晨夜光竹兰梅松": "@#!_+-☆Ω[]'\"\\";name=new string(Enumerable.Range(0,rng.Next(4,9)).Select(_=>alphabet[rng.Next(alphabet.Length)]).ToArray());}while(!unique.Add(name));rows.Add(new DummyIdentity{BaseName=name,Category=kind});}
  for(int i=rows.Count-1;i>0;i--){int j=rng.Next(i+1);var a=rows[i];rows[i]=rows[j];rows[j]=a;}return rows.ToArray();
 }
}
