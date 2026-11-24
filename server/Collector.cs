using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using LabApi.Features.Wrappers;
using Newtonsoft.Json.Linq;
using PlayerRoles;
using PlayerRoles.PlayableScps.Scp106;
using PlayerRoles.PlayableScps.Scp079;
using PlayerRoles.PlayableScps.Scp079.Cameras;
using PlayerRoles.PlayableScps.Scp096;
using UnityEngine;
using Player=LabApi.Features.Wrappers.Player;

namespace MzObserver {
public sealed class Collector {
 readonly Dictionary<string,Tuple<int,long>> births=new Dictionary<string,Tuple<int,long>>();
 readonly Dictionary<uint,Tuple<int,Component[]>> components=new Dictionary<uint,Tuple<int,Component[]>>();
 long nextBirth;long nextShot;
 readonly Dictionary<uint,Tuple<int,long,float>> shots=new Dictionary<uint,Tuple<int,long,float>>();
 public void Shot(Player p){if(p!=null&&!p.IsSCP)shots[p.NetworkId]=Tuple.Create(p.LifeId,++nextShot,Time.unscaledTime);}
 public readonly Dictionary<uint,HashSet<uint>> Looked=new Dictionary<uint,HashSet<uint>>();
 public readonly Dictionary<uint,Tuple<long,string>> Damage=new Dictionary<uint,Tuple<long,string>>();
 public void Reset(){births.Clear();components.Clear();shots.Clear();Looked.Clear();Damage.Clear();nextBirth=0;}
 public static string Actor(Player p)=>p.IsDummy||string.IsNullOrEmpty(p.UserId)?"net:"+p.NetworkId:p.UserId;
 public static string RoleName(RoleTypeId role){var s=role.ToString();if(s=="Scientist")return "scientist";if(s=="FacilityGuard")return "guard";if(s.StartsWith("Ntf"))return "ntf";if(s.StartsWith("Scp")){var n=s.Substring(3);if(new[]{"049","0492","079","096","106","173","939","3114","1507"}.Contains(n))return n;}return null;}
 public static string Plane(Room r){if(r==null)return "Unknown";if(r.Name.ToString().IndexOf("Pocket",StringComparison.OrdinalIgnoreCase)>=0)return "Pocket";var z=r.Zone.ToString();return z=="LightContainment"?"LCZ":z=="HeavyContainment"||z=="Entrance"?"HCZ_EZ":z=="Surface"?"Surface":"Unknown";}
 public static string RoomId(Room r)=>r==null?null:r.Base.GetInstanceID().ToString();
 static Room MapRoom(Vector3 position,Room room){
  if(room!=null&&MapProjection.IsOffPlane(room.Name.ToString(),position.y,room.Position.y))return room;
  // Large off-plane annexes can extend outside their main floor's grid cell.
  return Room.List.FirstOrDefault(r=>MapProjection.IsOffPlane(r.Name.ToString(),position.y,r.Position.y)&&r.Base.WorldspaceBounds.Contains(position))??room;
 }
 static void MapPosition(JObject data,Vector3 position,Room room){
  room=MapRoom(position,room);
  bool hidden=Plane(room)=="Pocket"||(room!=null&&MapProjection.IsOffPlane(room.Name.ToString(),position.y,room.Position.y));
  var anchor=hidden?room.Position:position;
  data["x"]=anchor.x*2;data["y"]=-anchor.z*2;data["plane"]=Plane(room);data["roomId"]=RoomId(room);
  data["mapMarkerHidden"]=hidden;
 }
 T Module<T>(Player p) where T:Component {
  Tuple<int,Component[]> c;if(!components.TryGetValue(p.NetworkId,out c)||c.Item1!=p.LifeId){c=Tuple.Create(p.LifeId,p.RoleBase.GetComponentsInChildren<Component>(true));components[p.NetworkId]=c;}return c.Item2.OfType<T>().FirstOrDefault();
 }
 public static object Read(object o,string name){if(o==null)return null;var t=o.GetType();return t.GetProperty(name,BindingFlags.Instance|BindingFlags.Public|BindingFlags.NonPublic)?.GetValue(o,null)??t.GetField(name,BindingFlags.Instance|BindingFlags.Public|BindingFlags.NonPublic)?.GetValue(o);}
 public IList<JObject> Players(bool includeDummyPlayers=false){
  var list=new List<JObject>();foreach(var p in Player.List){
   if(p.IsHost||(p.IsDummy&&!includeDummyPlayers)||!p.IsAlive)continue;var role=RoleName(p.Role);if(role==null)continue; // excludes Tutorial, OW and spectators
   var actor=Actor(p);Tuple<int,long> birth;if(!births.TryGetValue(actor,out birth)||birth.Item1!=p.LifeId){birth=Tuple.Create(p.LifeId,++nextBirth);births[actor]=birth;}
   bool scp=p.IsSCP;var pos=p.Position;var room=p.Room;
   var effects=p.ActiveEffects.ToList();Func<string,bool> has=n=>effects.Any(e=>e.GetType().Name==n);
   var inventory=p.Items.GroupBy(i=>i.Type.ToString()).Select(g=>new JObject{["type"]=g.Key,["count"]=g.Count()}).ToList();
   var special=new JArray();foreach(var v in inventory){string n=v.Value<string>("type");if(new[]{"MicroHID","Jailbird","ParticleDisruptor","GunSCP127","SCP268","SCP500","SCP1344","SCP2176"}.Contains(n))special.Add(new JArray(n,v.Value<int>("count")>1?"脳"+v.Value<int>("count"):""));}
   var held=p.CurrentItem;var firearm=held as FirearmItem;object ammo=firearm==null?null:(object)firearm.StoredAmmo;object capacity=firearm==null?null:(object)firearm.MaxAmmo;
   if(held?.Type==ItemType.MicroHID){var energy=held.GameObject.GetComponentInChildren<InventorySystem.Items.MicroHID.Modules.EnergyManagerModule>(true);if(energy!=null)ammo=Math.Round(energy.Energy*100)+"%";}
   var fx=new JArray();var cold=effects.FirstOrDefault(e=>e.GetType().Name=="Hypothermia");if(cold!=null&&Convert.ToSingle(Read(cold,"_curExposure")??0f)>0f)fx.Add("frost");if(!scp&&RoomLightController.IsInDarkenedRoom(pos))fx.Add("dark-room");if(!scp&&has("AmnesiaVision"))fx.Add("amnestic");if(has("Burned"))fx.Add("burn");if(has("Flashed"))fx.Add("flashed");if(has("CardiacArrest"))fx.Add("cardiac");if(has("Corroding")||has("PocketCorroding"))fx.Add("corroding");if(has("Invisible"))fx.Add("invisible");
   bool eye=false;foreach(var s in Player.List.Where(x=>x.Role==RoleTypeId.Scp096)){
    HashSet<uint> looked;if(!Looked.TryGetValue(s.NetworkId,out looked)||!looked.Contains(p.NetworkId))continue;
    var tr=Module<Scp096TargetsTracker>(s);
    bool activeTarget=tr!=null&&tr.Targets.Contains(p.ReferenceHub);
    eye|=activeTarget; // A face-triggered target is marked during wind-up too.
    if(tr!=null&&!activeTarget)looked.Remove(p.NetworkId);
   }
   var pfx=new JArray(effects.Select(e=>new JObject{["name"]=e.GetType().Name,["intensity"]=e.Intensity,["timeLeft"]=e.TimeLeft}));
   var data=new JObject{["actorId"]=actor,["networkId"]=p.NetworkId,["lifeId"]=p.LifeId,["spawnOrder"]=birth.Item2,["rolePriority"]=(int)p.Role,["side"]=scp?"scp":"human",["name"]=p.Nickname,["role"]=role,["alive"]=true,["dead"]=false,["hp"]=Math.Max(0,(int)Math.Ceiling(p.Health)),["maxHp"]=Math.Max(1,p.MaxHealth),["ahp"]=Math.Max(0,p.ArtificialHealth),["hs"]=Math.Max(0,(int)Math.Ceiling(p.HumeShield)),["maxHs"]=Math.Max(0,p.MaxHumeShield),["armor"]=p.Items.FirstOrDefault(i=>i.Type.ToString().StartsWith("Armor"))?.Type.ToString(),["held"]=held?.Type.ToString(),["ammo"]=ammo==null?JValue.CreateNull():JToken.FromObject(ammo),["magazineCapacity"]=capacity==null?JValue.CreateNull():JToken.FromObject(capacity),["inventory"]=new JArray(inventory),["special"]=special,["effects"]=fx,["effectDetails"]=pfx,["dizzy"]=has("Concussed"),["eye"]=eye,["colaStacks"]=effects.FirstOrDefault(e=>e.GetType().Name=="Scp207")?.Intensity??0,["antiCola"]=has("AntiScp207"),["scp1853"]=has("Scp1853"),["x"]=pos.x*2,["y"]=-pos.z*2,["plane"]=Plane(room),["roomId"]=RoomId(room)};
   data["weaponFiring"]=held?.Type==ItemType.MicroHID&&InventorySystem.Items.MicroHID.Modules.CycleSyncModule.GetPhase(held.Serial).ToString()=="Firing";
   Tuple<int,long,float> shot;if(shots.TryGetValue(p.NetworkId,out shot)&&shot.Item1==p.LifeId){data["shotSequence"]=shot.Item2;data["shotAgeMs"]=Math.Max(0,(Time.unscaledTime-shot.Item3)*1000);}
   data["heldColor"]=KeycardTint.Get(held as KeycardItem);
   Tuple<long,string> damage;if(Damage.TryGetValue(p.NetworkId,out damage)){data["damageSequence"]=damage.Item1;data["damageKind"]=damage.Item2;}
   data["heading"]=MapProjection.Heading(p.LookRotation.y);
   MapPosition(data,pos,room);
   if(has("PocketCorroding")){data["plane"]="Pocket";data["mapMarkerHidden"]=true;}
   if(role=="106"){var v=p.ReferenceHub.playerStats.GetModule<VigorStat>();data["vigor"]=v.MaxValue>0?(int)Math.Round(100*v.CurValue/v.MaxValue):0;}
   if(role=="079"){
    data["signalLost"]=Module<Scp079LostSignalHandler>(p)?.Lost??false;
    var aux=Module<Scp079AuxManager>(p);var tier=Module<Scp079TierManager>(p);var cam=Module<Scp079CurrentCameraSync>(p)?.CurrentCamera;
    if(aux==null||tier==null)throw new InvalidOperationException("079 modules not ready");
    data["energy"]=aux.CurrentAux;data["maxEnergy"]=Math.Max(1,aux.MaxAux);data["level"]=tier.AccessTierLevel;data["levelExperience"]=tier.RelativeExp;data["levelExperienceRequired"]=Math.Max(0,tier.NextLevelThreshold);data["maxLevel"]=tier.NextLevelThreshold<0;data["generatorsActivated"]=Generator.List.Count(g=>g.Engaged);
    if(cam!=null){var camera=new JObject();MapPosition(camera,cam.Position,Room.Get(cam.Room));camera["heading"]=MapProjection.Heading(cam.CameraAnchor.rotation.eulerAngles.y);data["camera"]=camera;}
   }
   if(scp){Module<Component>(p);data["cooldowns"]=AbilityCooldowns.Snapshot(role,components[p.NetworkId].Item2);}
   list.Add(data);
  }return list;
 }
 public JArray Map(){var rows=new JArray();foreach(var r in Room.List){if(Plane(r)!="HCZ_EZ"&&Plane(r)!="LCZ")continue;var pos=r.Position;
  var row=new JObject{["room_id"]=RoomId(r),["name"]=r.Name.ToString(),["prefab"]=r.GameObject.name.Replace("(Clone)",""),["shape"]=r.Shape.ToString(),["zone"]=r.Zone.ToString(),["plane"]=Plane(r),["x"]=pos.x,["z"]=pos.z,["yaw_degrees"]=r.Rotation.eulerAngles.y};
  foreach(var door in ElevatorDoor.List.Where(d=>d.Rooms.Contains(r))){var g=door.Group.ToString();string tag=g.IndexOf("LczA",StringComparison.OrdinalIgnoreCase)>=0?"a":g.IndexOf("LczB",StringComparison.OrdinalIgnoreCase)>=0?"b":null;if(tag==null)continue;var local=r.Transform.InverseTransformPoint(door.Position);row["mapAnchors"]=new JObject{["elevator-"+tag]=new JObject{["localX"]=local.x*2,["localY"]=-local.z*2,["normalAngle"]=door.Rotation.eulerAngles.y-r.Rotation.eulerAngles.y}};}
  rows.Add(row);
 }return rows;}
}
}
