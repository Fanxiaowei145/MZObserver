// Controlled damage/effect replay for the production telemetry chain, not autonomous AI.
using System;
using System.Linq;
using System.Collections.Generic;
using System.Reflection;
using CustomPlayerEffects;
using Footprinting;
using InventorySystem.Items.Firearms;
using InventorySystem.Items.Firearms.Modules;
using InventorySystem.Items.ThrowableProjectiles;
using LabApi.Features.Wrappers;
using MzObserver;
using Newtonsoft.Json.Linq;
using PlayerRoles;
using PlayerRoles.PlayableScps.Scp939;
using PlayerRoles.PlayableScps.Scp096;
using PlayerStatsSystem;
using UnityEngine;

public sealed partial class BotRehearsal {
 int scenarioNumber;float caseBase;long lastCaseId;string caseName;
 readonly List<UnityEngine.Object> caseObjects=new List<UnityEngine.Object>();
 void CleanupCase(){foreach(var obj in caseObjects)if(obj!=null)UnityEngine.Object.Destroy(obj);caseObjects.Clear();}
 void RoleForCase(int i,RoleTypeId role){P(i).SetRole(role,RoleChangeReason.RemoteAdmin,RoleSpawnFlags.None);RenameBot(i);P(i).Position=origin+new Vector3(i*2,0,4);P(i).HumeShield=0;}
 void Damage(int target,DamageHandlerBase handler){if(!bots[target].playerStats.DealDamage(handler))throw new Exception("Damage rejected: "+handler.GetType().Name);}
 void GunHit(int source,int target,float amount=10000){var gun=(Firearm)P(source).AddItem(ItemType.GunE11SR).Base;Damage(target,new FirearmDamageHandler(gun,amount,1,false));}
 void CheckNotice(string icon,int killer,int victim,string assistant=null,string assistIcon=null,bool suicide=false){
  var found=MzPlugin.Instance.Combat.Ledger.Snapshot(MzPlugin.Instance.Combat.Now).OfType<JObject>().Where(e=>e.Value<long>("id")>lastCaseId).ToList();
  var e=found.LastOrDefault();var a=e?["assists"] as JArray;
  bool ok=found.Count==1&&e["victim"].Value<string>("name")==P(victim).Nickname&&e.Value<bool>("suicide")==suicide;
  if(icon!=null)ok=ok&&e?.Value<string>("icon")==icon;
  if(!suicide)ok=ok&&e?["killer"]?.Value<string>("name")==P(killer).Nickname;
  ok=ok&&(suicide||(assistant==null?(a?.Count??0)==0:a!=null&&a.Count==1&&a[0].Value<string>("name")==assistant&&a[0]["icons"].Count()==1&&a[0]["icons"][0].ToString()==assistIcon));
  Record(caseName+" | expected "+icon+(assistant==null?"":" + "+assistant+"/"+assistIcon),ok);
 }
 void Scenario(string name,Action setup,Action kill,string icon,int killer,int victim,string assistant=null,string assistIcon=null,bool suicide=false,Action<float> effects=null){
  int n=++scenarioNumber;float b=caseBase;caseBase+=15;
  At(b,name+" / fixture",()=>{CleanupCase();for(int i=0;i<9;i++)ResetBot(i);setup?.Invoke();lastCaseId=MzPlugin.Instance.Combat.Ledger.Snapshot(MzPlugin.Instance.Combat.Now).Select(e=>e.Value<long>("id")).DefaultIfEmpty(0).Max();caseName=n+". "+name;});
  effects?.Invoke(b);
  At(b+4,name+" / death",()=>kill());
  At(b+4.5f,name+" / verify",()=>CheckNotice(icon,killer,victim,assistant,assistIcon,suicide));
 }
 void Burn(int actor,float seconds){
  var hitbox=((PlayerRoles.FirstPersonControl.IFpcRole)bots[6].roleManager.CurrentRole).FpcModule.CharacterModelInstance.Hitboxes[0];
  var g=UnityEngine.Object.Instantiate(Resources.FindObjectsOfTypeAll<ExplosionGrenade>().First());
  Set(g,"_playerDamageOverDistance",AnimationCurve.Constant(0,100,1));Set(g,"_effectDurationOverDistance",AnimationCurve.Constant(0,100,seconds));
  typeof(ExplosionGrenade).GetMethod("ExplodeDestructible",BindingFlags.Static|BindingFlags.NonPublic).Invoke(null,new object[]{hitbox,new Footprint(bots[actor]),hitbox.CenterOfMass+Vector3.up*.1f,g,ExplosionType.Jailbird});
  UnityEngine.Object.Destroy(g.gameObject);
 }
 public void More(int first=1){
  if(first<1||first>19)throw new ArgumentOutOfRangeException("first","Use 1 through 19");
  if(bots.Count!=9)throw new Exception("mzbots prepare first");
  Stop();CleanupCase();oldRoundLock=Round.IsLocked;Round.IsLocked=true;history.Clear();events.Clear();eventIds.Clear();began=Time.time;cursor=0;shots=0;scenarioNumber=0;caseBase=0;phase="more";
  // Each death is 15 seconds apart, so the 10-second feed clears before the next one.
  Scenario("HE direct kill",null,()=>Damage(6,new ExplosionDamageHandler(new Footprint(bots[0]),P(6).Position,10000,100,ExplosionType.Grenade)),"item:GrenadeHE",0,6);
  Scenario("Cola explosion kill",null,()=>Damage(6,new ExplosionDamageHandler(new Footprint(bots[0]),P(6).Position,10000,100,ExplosionType.Cola)),"item:SCP207",0,6);
  Scenario("Cola self explosion",null,()=>Damage(0,new ExplosionDamageHandler(new Footprint(bots[0]),P(0).Position,10000,100,ExplosionType.Cola)),"item:SCP207",0,0,suicide:true);
  Scenario("SCP127 kill",null,()=>{var gun=(Firearm)P(0).AddItem(ItemType.GunSCP127).Base;gun.TryGetModule<InventorySystem.Items.Firearms.Modules.Scp127.Scp127Hitscan>(out var hit);Damage(6,(DamageHandlerBase)Invoke(hit,"GetHandler",10000f));},"item:GunSCP127",0,6);
  Scenario("939 pounce",null,()=>Damage(0,new Scp939DamageHandler((Scp939Role)bots[6].roleManager.CurrentRole,10000,Scp939DamageType.LungeTarget)),"939-pounce",6,0);
  Scenario("096 slash",()=>RoleForCase(7,RoleTypeId.Scp096),()=>Damage(0,new Scp096DamageHandler((Scp096Role)bots[7].roleManager.CurrentRole,10000,Scp096DamageHandler.AttackType.SlapLeft)),"096-slash",7,0);
  Scenario("096 charge",()=>RoleForCase(7,RoleTypeId.Scp096),()=>Damage(0,new Scp096DamageHandler((Scp096Role)bots[7].roleManager.CurrentRole,10000,Scp096DamageHandler.AttackType.Charge)),"096-charge",7,0);
  Scenario("173 snap",null,()=>Damage(0,new ScpDamageHandler(bots[8],DeathTranslations.Scp173)),"173-snap",8,0);
  Scenario("049 cardiac death",null,()=>Damage(0,new Scp049DamageHandler(bots[7],10000,Scp049DamageHandler.AttackType.CardiacArrest)),"049-cardiac",7,0);
  Scenario("106 decay tick",()=>RoleForCase(7,RoleTypeId.Scp106),()=>{P(0).Health=1;var effect=bots[0].playerEffectsController.GetEffect<Corroding>();effect.AttackerHub=bots[7];Invoke(effect,"OnTick");},"106-decay",7,0);
  Scenario("106 final-human execution handler",()=>RoleForCase(7,RoleTypeId.Scp106),()=>Damage(0,new ScpDamageHandler(bots[7],-1,DeathTranslations.PocketDecay)),"106-execute",7,0);
  Scenario("Jailbird blind assist",null,()=>GunHit(1,6),"item:GunE11SR",1,6,humanNames[0],"item:Jailbird",effects:b=>At(b+2,"Jailbird hit",()=>{var jb=(InventorySystem.Items.Jailbird.JailbirdItem)P(0).AddItem(ItemType.Jailbird).Base;Set(jb,"_charging",true);var hb=((PlayerRoles.FirstPersonControl.IFpcRole)bots[6].roleManager.CurrentRole).FpcModule.CharacterModelInstance.Hitboxes[0];jb.ApplyDamage(bots[0],hb,1,Vector3.forward,true);}));
  Scenario("1344 xray assist",()=>Pair(0,6,4),()=>GunHit(1,6),"item:GunE11SR",1,6,humanNames[0],"item:SCP1344",effects:b=>At(b+2,"Enable real xray observation",()=>{var effect=bots[0].playerEffectsController.GetEffect<Scp1344>();effect.IsEnabled=true;Invoke(effect,"UpdateVision",true);}));
  Scenario("2176 room exposure assist",()=>{var room=Room.List.First(r=>r.Name.ToString()=="Hcz079");P(6).Position=room.Position+Vector3.up;},()=>GunHit(1,6),"item:GunE11SR",1,6,humanNames[0],"item:SCP2176",effects:b=>At(b+2,"Shatter real ghost projectile",()=>{var ghost=UnityEngine.Object.Instantiate(Resources.FindObjectsOfTypeAll<InventorySystem.Items.ThrowableProjectiles.Scp2176Projectile>().First());Set(ghost,"PreviousOwner",new Footprint(bots[0]));ghost.transform.position=P(6).Position;foreach(var light in P(6).Room.Base.LightControllers)light.ServerFlickerLights(0);Invoke(ghost,"ServerShatter");caseObjects.Add(ghost.gameObject);}));
  Scenario("Burn overlap: earliest active",null,()=>GunHit(2,6),"item:GunE11SR",2,6,humanNames[0],"human-burn",effects:b=>{At(b+1,"Alpha burn 8s",()=>Burn(0,8));At(b+2,"Bravo burn 8s",()=>Burn(1,8));});
  Scenario("Burn overlap: later active beats earlier grace",null,()=>GunHit(2,6),"item:GunE11SR",2,6,humanNames[1],"human-burn",effects:b=>{At(b+1,"Alpha burn 1s",()=>Burn(0,1));At(b+2.5f,"Bravo burn 8s",()=>Burn(1,8));});
  Scenario("Burn expired: earliest in grace",null,()=>GunHit(2,6),"item:GunE11SR",2,6,humanNames[0],"human-burn",effects:b=>{At(b+1,"Alpha burn 0.5s",()=>Burn(0,.5f));At(b+2,"Bravo burn 0.5s",()=>Burn(1,.5f));});
  Scenario("Human bullets: no assist",null,()=>GunHit(1,6),"item:GunE11SR",1,6,effects:b=>At(b+2,"Alpha nonfatal bullet",()=>GunHit(0,6,30)));
  Scenario("SCP damage assist cleared by full heal",null,()=>Damage(0,new Scp049DamageHandler(bots[7],-1,Scp049DamageHandler.AttackType.Instakill)),"049-touch",7,0,effects:b=>{At(b+1,"939 nonfatal damage",()=>Damage(0,new Scp939DamageHandler((Scp939Role)bots[6].roleManager.CurrentRole,35,Scp939DamageType.Claw)));At(b+2,"Heal human to actual max",()=>P(0).Health=P(0).MaxHealth);});
  At(caseBase,"more finished",()=>{CleanupCase();phase="more finished";Record("19-case suite complete; inspect pass flags");});
  float skip=(first-1)*15;timeline.RemoveAll(t=>t.Item1<skip);for(int i=0;i<timeline.Count;i++)timeline[i]=Tuple.Create(timeline[i].Item1-skip,timeline[i].Item2,timeline[i].Item3);timeline.Sort((a,b)=>a.Item1.CompareTo(b.Item1));running=true;
 }
}
