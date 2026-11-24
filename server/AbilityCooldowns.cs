using System;
using System.Linq;
using System.Reflection;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using PlayerRoles.Subroutines;
using UnityEngine;
namespace MzObserver {
public static class AbilityCooldowns {
 sealed class Spec { public string Role,Module,Member,Id;public Spec(string r,string m,string f,string id){Role=r;Module=m;Member=f;Id=id;} }
 static readonly Spec[] Specs={
   new Spec("049","Scp049AttackAbility","Cooldown","049-touch"),
   new Spec("049","Scp049CallAbility","Cooldown","049-call"),
   new Spec("049","Scp049SenseAbility","Cooldown","049-sense"),
   new Spec("096","Scp096ChargeAbility","Cooldown","096-charge"),
   new Spec("096","Scp096AttackAbility","_serverAttackCooldown","096-attack"),
   new Spec("106","Scp106SinkholeController","ReadonlyCooldown","106-sinkhole"),
   new Spec("173","Scp173TantrumAbility","Cooldown","173-tantrum"),
   new Spec("173","Scp173BreakneckSpeedsAbility","Cooldown","173-breakneck"),
   new Spec("939","Scp939AmnesticCloudAbility","Cooldown","939-cloud"),
   new Spec("939","Scp939ClawAbility","Cooldown","939-claw"),
   new Spec("079","Scp079BlackoutRoomAbility","RemainingCooldown","079-room"),
   new Spec("079","Scp079BlackoutZoneAbility","_cooldownTimer","079-zone"),
   new Spec("939","EnvironmentalMimicry","Cooldown","939-mimicry"),
   new Spec("3114","Scp3114Strangle","Cooldown","3114-strangle"),
   new Spec("079","Scp079LockdownRoomAbility","RemainingCooldown","079-lockdown"),
   new Spec("079","Scp079TeslaAbility","_nextUseTime","079-tesla")
 };
 static readonly Dictionary<Tuple<Type,string>,MemberInfo> Members=new Dictionary<Tuple<Type,string>,MemberInfo>();
 static object Value(object target,string name){
  if(target==null)return null;var key=Tuple.Create(target.GetType(),name);MemberInfo member;
  if(!Members.TryGetValue(key,out member)){
   for(var type=key.Item1;type!=null&&member==null;type=type.BaseType)
    member=(MemberInfo)type.GetProperty(name,BindingFlags.Instance|BindingFlags.Public|BindingFlags.NonPublic|BindingFlags.DeclaredOnly)??type.GetField(name,BindingFlags.Instance|BindingFlags.Public|BindingFlags.NonPublic|BindingFlags.DeclaredOnly);
   Members[key]=member;
  }
  return member is PropertyInfo p?p.GetValue(target,null):(member as FieldInfo)?.GetValue(target);
 }
 public static JArray Snapshot(string role,IEnumerable<Component> modules){
  var result=new JArray();foreach(var spec in Specs){
   if(spec.Role!=role)continue;var module=modules.FirstOrDefault(c=>c!=null&&c.GetType().Name==spec.Module);if(module==null)continue;
   var value=Value(module,spec.Member);double remaining=0;
   if(value is AbilityCooldown timer){if(timer.IsReady)continue;remaining=timer.Remaining;}
   else if(value is float f)remaining=f;
   else if(spec.Member=="_nextUseTime"&&value is double next)remaining=next-Mirror.NetworkTime.time;
   if(double.IsNaN(remaining)||double.IsInfinity(remaining)||remaining<=0)continue;
   result.Add(new JObject{["id"]=spec.Id,["remaining"]=Math.Round(remaining,3)});
  }return result;
 }
}
}
