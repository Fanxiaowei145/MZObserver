using System;
using System.Linq;
using MzObserver;
using Newtonsoft.Json.Linq;
class CombatTests {
 static int checks;static void Check(bool yes,string label){if(!yes)throw new Exception(label);checks++;}
 static CombatPerson P(string id,string side="human")=>new CombatPerson{Id=id,Life=id+":1",Name=id,Role=side=="scp"?"939":"ntf",Side=side};
 static void Main(){
  CombatPerson a=P("Alpha"),b=P("Bravo"),killer=P("Killer"),scp=P("SCP","scp"),dog=P("Dog","scp"),human=P("Human");var l=new CombatLedger();
  l.Effect(scp,a,"human-burn",8,10,0);l.Effect(scp,b,"human-burn",12,10,4);
  foreach(var x in new[]{Tuple.Create(6d,"Alpha"),Tuple.Create(9d,"Bravo"),Tuple.Create(13d,"Alpha"),Tuple.Create(18d,"Alpha"),Tuple.Create(18.001,"Bravo")})Check(l.Assists(scp,killer,x.Item1)[0].Value<string>("name")==x.Item2,"burn priority at "+x.Item1);
  Check(l.Assists(scp,killer,22.001).Count==0,"burn expired");Check(l.Assists(scp,a,6).Count==0,"do not substitute other burn when winner is killer");
  l.Reset();l.DirectHit(human,dog,"939-claw",40,0);Check(l.Assists(human,scp,10000).Count==1,"direct no timeout");l.Heal(human.Life,99,100);Check(l.Assists(human,scp,10000).Count==1,"partial heal");l.Heal(human.Life,100,100);l.Heal(human.Life,40,100);Check(l.Assists(human,scp,10000).Count==0,"full heal permanent clear");l.DirectHit(human,dog,"939-pounce",20,10001);Check(l.Assists(human,scp,10002).Count==1,"fresh damage");
  l.Reset();l.DirectHit(scp,a,"item:GunE11SR",50,0);Check(l.Assists(scp,killer,1).Count==0,"no human bullet assists");
  foreach(var icon in new[]{"173-puddle","939-gas","049-cardiac","096-concussion","106-decay"}){l.Reset();l.Effect(human,dog,icon,20,3,0);l.EndEffect(human.Life,icon,5);Check(l.Assists(human,scp,8).Count==1,icon+" inclusive grace");Check(l.Assists(human,scp,8.001).Count==0,icon+" expire");}
  foreach(var icon in new[]{"human-flash","item:SCP2176","item:GrenadeHE"}){l.Reset();l.Effect(scp,a,icon,5,10,0);Check(l.Assists(scp,killer,15).Count==1,icon+" grace");Check(l.Assists(scp,killer,15.001).Count==0,icon+" expire");}
  l.Reset();l.Effect(scp,a,"human-burn",8,10,0);l.Effect(scp,a,"human-burn",6,10,4,true);l.Effect(scp,b,"human-burn",20,10,5);Check(l.Assists(scp,killer,9)[0].Value<string>("name")=="Alpha","own extension");Check(l.Assists(scp,killer,11)[0].Value<string>("name")=="Bravo","other source never extends Alpha");
  l.Reset();l.DirectHit(human,dog,"939-claw",10,0);l.DirectHit(human,dog,"939-pounce",10,1);var d=l.Death(human,scp,"049-touch",false,2);Check(((JArray)d["assists"]).Count==1&&((JArray)d["assists"][0]["icons"]).Count==2,"group same assistant icons");Check(l.Death(human,scp,"049-touch",false,2)==null,"death dedup");human.Life="Human:2";Check(l.Assists(human,scp,3).Count==0,"new life clean");Check(l.Snapshot(18).Count==0,"bounded replay retention");
  l.Reset();l.Capture(human,scp);Check(l.Captor(human.Life)==scp,"pocket owner");l.LeavePocket(human.Life);Check(l.Captor(human.Life)==null,"pocket exit");Check(l.Death(human,null,null,true,1).Value<bool>("suicide"),"suicide");
  l.Reset();l.Effect(scp,a,"item:Jailbird",4,5,0);Check(l.Assists(scp,killer,9).Count==1,"Jailbird inclusive 5s grace");Check(l.Assists(scp,killer,9.001).Count==0,"Jailbird expires beyond 5s");
  l.Reset();l.Effect(scp,a,"item:SCP1344",double.PositiveInfinity,10,0);l.Effect(scp,b,"item:SCP1344",double.PositiveInfinity,10,1);l.ShortenEffect(scp.Life,a.Life,"item:SCP1344",4);Check(l.Assists(scp,killer,14).Count==2,"xray grace inclusive");Check(l.Assists(scp,killer,14.001).Count==1,"xray observers end independently");l.EndEffect(scp.Life,"item:SCP1344",20);Check(l.Assists(scp,killer,30.001).Count==0,"all xray expired");
  l.Reset();Check(l.Death(a,a,"item:SCP207",true,0).Value<string>("icon")=="item:SCP207","cola suicide preserves cola icon");
  Console.WriteLine("Combat rules: "+checks+" checks passed");
 }
}
