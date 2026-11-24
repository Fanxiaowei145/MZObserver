// Offline/local test helper only. Never ship with the match server plugin.
using System;using System.IO;using System.Linq;using System.Collections;using System.Collections.Generic;
using CommandSystem;using LabApi.Loader.Features.Plugins;using LabApi.Features.Wrappers;
using MapGeneration;using Newtonsoft.Json.Linq;using UnityEngine;
using Interactables.Interobjects.DoorUtils;
public sealed class RoomGeometryPlugin:Plugin {
 public override string Name=>"MZRoomGeometryProbe";public override string Description=>"Local room collision survey";public override string Author=>"MZ local tests";public override Version Version=>new Version(1,0);public override Version RequiredApiVersion=>new Version(1,1,7);
 GameObject go;public override void Enable(){go=new GameObject(Name);UnityEngine.Object.DontDestroyOnLoad(go);go.AddComponent<RoomGeometryProbe>();}public override void Disable(){UnityEngine.Object.Destroy(go);}
}
[CommandHandler(typeof(GameConsoleCommandHandler))]
public sealed class RoomGeometryCommand:ICommand {
 public string Command=>"mzgeometry";public string[] Aliases=>new string[0];public string Description=>"Read actual room collision surfaces";
 public bool Execute(ArraySegment<string> args,ICommandSender sender,out string response){if(args.Count>0&&args.Array[args.Offset]=="verify")RoomGeometryProbe.Instance.StartVerification();else RoomGeometryProbe.Instance.StartSurvey();response="Room calibration job started";return true;}
}
public sealed class RoomGeometryProbe:MonoBehaviour {
 public static RoomGeometryProbe Instance;bool running;readonly RaycastHit[] hits=new RaycastHit[96];readonly Collider[] overlaps=new Collider[96];
 void Awake(){Instance=this;}
 static bool Ignore(Collider c)=>c==null||c.isTrigger||c.GetComponentInParent<DoorVariant>()!=null||c.GetComponentInParent<ReferenceHub>()!=null;
 public void StartSurvey(){if(!running)StartCoroutine(Survey());}
 public void StartVerification(){if(!running)StartCoroutine(Guard(Verify()));}
 IEnumerator Guard(IEnumerator job){while(true){bool more;try{more=job.MoveNext();}catch(Exception e){File.WriteAllText("mz-room-verification-error.txt",e.ToString());LabApi.Features.Console.Logger.Error(e.ToString());running=false;yield break;}if(!more)break;yield return job.Current;}running=false;}
 IEnumerator Verify(){running=true;var rows=JArray.Parse(File.ReadAllText("mz-room-checkpoints.json"));var results=new JArray();var hub=NetworkManagerUtils.Dummies.DummyUtils.SpawnDummy("Map calibration");yield return new WaitForSecondsRealtime(.5f);var p=Player.Get(hub);
  p.SetRole(PlayerRoles.RoleTypeId.NtfSergeant,PlayerRoles.RoleChangeReason.RemoteAdmin,PlayerRoles.RoleSpawnFlags.None);p.IsGodModeEnabled=true;yield return new WaitForSecondsRealtime(.5f);
  foreach(JObject test in rows){var room=Room.List.FirstOrDefault(r=>CollectorId(r)==test.Value<string>("roomId"));if(room==null)continue;
   var expected=room.Transform.TransformPoint(new Vector3(test.Value<float>("x"),test.Value<float>("floorY")+1f,test.Value<float>("z")));p.Position=expected;yield return new WaitForSecondsRealtime(.2f);
   var actual=p.Position;var local=room.Transform.InverseTransformPoint(actual);var telemetry=new MzObserver.Collector().Players(true).FirstOrDefault(x=>x.Value<string>("actorId")==MzObserver.Collector.Actor(p));
   results.Add(new JObject{["prefab"]=test["prefab"],["roomId"]=CollectorId(room),["requested"]=new JArray(expected.x,expected.y,expected.z),["actual"]=new JArray(actual.x,actual.y,actual.z),["local"]=new JArray(local.x,local.y,local.z),["horizontalError"]=Vector2.Distance(new Vector2(actual.x,actual.z),new Vector2(expected.x,expected.z)),["telemetry"]=telemetry});
   if(results.Count%25==0)LabApi.Features.Console.Logger.Info("[MZ geometry] placement "+results.Count+" / "+rows.Count);
  }
  UnityEngine.Object.Destroy(hub.gameObject);
  // Exercise the actual production Tick/Collector after the half has ended.
  var scp=Player.List.FirstOrDefault(x=>x.IsDummy&&x.Role.ToString().StartsWith("Scp"));JObject clock=null;
  if(scp!=null){scp.SetRole(PlayerRoles.RoleTypeId.Scp106,PlayerRoles.RoleChangeReason.RemoteAdmin,PlayerRoles.RoleSpawnFlags.None);yield return new WaitForSecondsRealtime(.4f);
   var vigor=scp.ReferenceHub.playerStats.GetModule<PlayerRoles.PlayableScps.Scp106.VigorStat>();var m=MzObserver.MzPlugin.Instance.Match;m.HalfMs=1500000;vigor.CurValue=.86f;yield return new WaitForSecondsRealtime(.2f);
   var first=m.Slots.FirstOrDefault(x=>x.Value<string>("actorId")==MzObserver.Collector.Actor(scp));var v1=first?.Value<int>("vigor");vigor.CurValue=.24f;yield return new WaitForSecondsRealtime(.2f);
   var second=m.Slots.FirstOrDefault(x=>x.Value<string>("actorId")==MzObserver.Collector.Actor(scp));clock=new JObject{["phase"]=m.Phase,["halfMs"]=m.HalfMs,["vigorFirst"]=v1,["vigorSecond"]=second?.Value<int>("vigor")};
  }
  File.WriteAllText("mz-room-verification.json",new JObject{["checks"]=results,["rooms"]=new MzObserver.Collector().Map(),["endedTelemetry"]=clock}.ToString(Newtonsoft.Json.Formatting.None));running=false;LabApi.Features.Console.Logger.Info("[MZ geometry] Verified "+results.Count+" actual bot placements");
 }
 IEnumerator Survey(){running=true;var result=new JArray();Physics.SyncTransforms();
  foreach(var r in Room.List.Where(r=>r.Zone.ToString()=="HeavyContainment"||r.Zone.ToString()=="Entrance"||r.Zone.ToString()=="LightContainment").OrderBy(r=>r.GameObject.name)){
   var bounds=r.Base.WorldspaceBounds;var lo=new Vector3(1000,0,1000);var hi=-lo;
   foreach(int x in new[]{-1,1})foreach(int z in new[]{-1,1}){var p=r.Transform.InverseTransformPoint(bounds.center+new Vector3(x*bounds.extents.x,0,z*bounds.extents.z));lo=Vector3.Min(lo,p);hi=Vector3.Max(hi,p);}
   const float step=.25f;int x0=Mathf.Max(-180,Mathf.FloorToInt(lo.x/step)),x1=Mathf.Min(180,Mathf.CeilToInt(hi.x/step)),z0=Mathf.Max(-180,Mathf.FloorToInt(lo.z/step)),z1=Mathf.Min(180,Mathf.CeilToInt(hi.z/step));
   var rows=new JArray();var floorSamples=new JArray();bool annex=r.Name.ToString()=="Hcz049"||r.Name.ToString()=="HczWarhead";
   float bottom=annex?-9f:Mathf.Max(-40f,bounds.min.y-r.Position.y-.5f),top=annex?9.5f:Mathf.Min(40f,bounds.max.y-r.Position.y+.5f);
   for(int ix=x0;ix<=x1;ix++){for(int iz=z0;iz<=z1;iz++){
    var start=r.Transform.TransformPoint(new Vector3(ix*step,top,iz*step));int n=Physics.RaycastNonAlloc(start,Vector3.down,hits,top-bottom,~0,QueryTriggerInteraction.Ignore);
    // Unity returns only the first triangle hit per MeshCollider. Some rooms
    // put a doorway ceiling and its floor in the SAME mesh: continue below
    // each hit so that the interior floor is measured instead of disappearing.
    for(int k=0;k<n;k++){
     var h=hits[k];if(h.collider is MeshCollider&&n<hits.Length){RaycastHit next;var from=h.point+Vector3.down*.02f;float distance=from.y-(r.Position.y+bottom);if(distance>0&&h.collider.Raycast(new Ray(from,Vector3.down),out next,distance)&&next.point.y<h.point.y-.01f)hits[n++]=next;}
    }
    for(int k=0;k<n;k++){var hit=hits[k];if(hit.collider==null||hit.collider.isTrigger||hit.collider.GetComponentInParent<ReferenceHub>()!=null||hit.normal.y<.65f)continue;
     var owner=hit.collider.GetComponentInParent<RoomIdentifier>();if(owner!=r.Base&&(owner!=null||!(hit.point+Vector3.up*.5f).TryGetRoom(out var gridRoom)||gridRoom!=r.Base))continue;
     var p=r.Transform.InverseTransformPoint(hit.point);if(annex&&(p.y < -9||p.y>9))continue;
     floorSamples.Add(new JArray(ix,iz,Math.Round(p.y,3)));
     // A human-sized column excludes wall interiors and low ceilings. Doors are
     // deliberately ignored: the floor plan describes both open and closed doors.
     int count=Physics.OverlapCapsuleNonAlloc(hit.point+Vector3.up*.65f,hit.point+Vector3.up*1.5f,.18f,overlaps,~0,QueryTriggerInteraction.Ignore);
     bool blocked=false;for(int j=0;j<count;j++)if(!Ignore(overlaps[j])){blocked=true;break;}
     if(blocked)continue;rows.Add(new JArray(ix,iz,Math.Round(p.y,3)));
    }
   }if((ix-x0)%12==0)yield return null;}
   var diagnostics=new JArray();foreach(float xx in new[]{-5f,0f,5f})foreach(float zz in new[]{-5f,0f,5f}){
    int n=Physics.RaycastNonAlloc(r.Transform.TransformPoint(new Vector3(xx,9.5f,zz)),Vector3.down,hits,19,~0,QueryTriggerInteraction.Ignore);
    for(int k=0;k<n;k++){var h=hits[k];diagnostics.Add(new JObject{["x"]=xx,["z"]=zz,["y"]=r.Transform.InverseTransformPoint(h.point).y,["normalY"]=h.normal.y,["collider"]=h.collider.name,["room"]=h.collider.GetComponentInParent<RoomIdentifier>()?.gameObject.name});}
   }
   var doors=new JArray();foreach(var d in Door.List.Where(d=>d.Rooms.Contains(r))){var p=r.Transform.InverseTransformPoint(d.Position);doors.Add(new JArray(p.x,p.y,p.z));}
   var row=new JObject{["roomId"]=CollectorId(r),["prefab"]=r.GameObject.name.Replace("(Clone)",""),["name"]=r.Name.ToString(),["shape"]=r.Shape.ToString(),["zone"]=r.Zone.ToString(),["step"]=step,["position"]=new JArray(r.Position.x,r.Position.y,r.Position.z),["yaw"]=r.Rotation.eulerAngles.y,["samples"]=rows,["floorSamples"]=floorSamples,["doors"]=doors,["diagnostics"]=diagnostics};result.Add(row);
   File.WriteAllText("mz-room-geometry.json",new JObject{["complete"]=false,["rooms"]=result}.ToString(Newtonsoft.Json.Formatting.None));
   LabApi.Features.Console.Logger.Info("[MZ geometry] "+row.Value<string>("prefab")+": "+rows.Count+" clear floor samples");yield return null;
  }
  File.WriteAllText("mz-room-geometry.json",new JObject{["complete"]=true,["rooms"]=result}.ToString(Newtonsoft.Json.Formatting.None));running=false;
 }
 static string CollectorId(Room r)=>r.Base.GetInstanceID().ToString();
}
