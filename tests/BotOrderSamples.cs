using System;
using System.IO;
using System.Linq;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NetworkManagerUtils.Dummies;
using LabApi.Events.Arguments.PlayerEvents;
using UnityEngine;
using MzObserver;

public sealed partial class BotRehearsal {
 DummyIdentity[] identities;int identitySeed;string sampleFile,lastOrderSignature;float nextOrderCapture;long sampleIndex;
 string[] humanNames=>identities.Take(6).Select(x=>x.DisplayName).ToArray();
 void RenameBot(int i){bots[i].nicknameSync.MyNick=identities[i].DisplayName;}
 public void JoinUnselected(){
  if(bots.Count!=0)throw new InvalidOperationException("Use mzbots clear before a new join sample.");
  identitySeed=File.Exists("mz-order-identity-seed.txt")?int.Parse(File.ReadAllText("mz-order-identity-seed.txt").Trim()):Guid.NewGuid().GetHashCode();identities=DummyIdentity.Create(identitySeed);
  string dir=Path.Combine("mz-order-samples","native",DateTime.UtcNow.ToString("yyyyMMddTHHmmssfff")+"-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(dir);sampleFile=Path.Combine(dir,"events.jsonl");sampleIndex=0;lastOrderSignature=null;
  for(int i=0;i<9;i++){bots.Add(DummyUtils.SpawnDummy(identities[i].BaseName));CaptureOrder("join-unselected",true);}
  phase="joined without faction; use mzbots select or prepare";CaptureOrder("join-complete",true);
 }
 public void SelectLineup(){
  if(bots.Count!=9)throw new InvalidOperationException("Use mzbots join first.");
  CaptureOrder("before-faction-selection",true);
  for(int i=0;i<9;i++){identities[i].Select(i<6?"NTF":"SCP");RenameBot(i);CaptureOrder("faction-selected:"+i,true);}
  phase="factions selected";CaptureOrder("after-faction-selection",true);
 }
 void OnOrderRoleChanged(PlayerChangedRoleEventArgs e){if(bots.Contains(e.Player.ReferenceHub))CaptureOrder("role-changed:"+e.Player.NetworkId,true);}
 void PollOrderSamples(){if(Time.unscaledTime<nextOrderCapture)return;nextOrderCapture=Time.unscaledTime+.05f;CaptureOrder("roster-or-wave-change",false);}
 void CaptureOrder(string reason,bool force){
  if(sampleFile==null)return;
  try{
   var rows=new JArray(bots.Select((h,i)=>h==null?null:new JObject{["index"]=i,["networkId"]=h.netId,["baseName"]=identities[i].BaseName,["nameCategory"]=identities[i].Category,["selectedFaction"]=identities[i].Faction,["displayName"]=P(i)?.Nickname??h.nicknameSync.MyNick,["role"]=P(i)?.Role.ToString(),["lifeId"]=P(i)?.LifeId,["alive"]=P(i)?.IsAlive}).Where(x=>x!=null));
   var match=MzPlugin.Instance?.Match;
   var snapshot=new JObject{["seed"]=identitySeed,["dummyRoster"]=rows,["matchEpoch"]=match?.Epoch,["wave"]=match?.Wave,["serverCardOrder"]=match==null?new JArray():new JArray(match.Order)};
   string signature=snapshot.ToString(Formatting.None);if(!force&&signature==lastOrderSignature)return;lastOrderSignature=signature;
   var record=new JObject{["schema"]=1,["captureKind"]="native-dummy-server",["eventIndex"]=++sampleIndex,["utc"]=DateTime.UtcNow.ToString("o"),["reason"]=reason,["provenance"]="Native dummy identities and server card order; NOT a complete client spectator list",["snapshot"]=snapshot};
   File.AppendAllText(sampleFile,record.ToString(Formatting.None)+Environment.NewLine,new UTF8Encoding(false));
  }catch(Exception e){LabApi.Features.Console.Logger.Error("Order sample write failed: "+e.Message);sampleFile=null;}
 }
}
