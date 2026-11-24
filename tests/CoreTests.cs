using System;using System.IO;using System.Linq;using System.Collections.Generic;using Newtonsoft.Json.Linq;using MzObserver;
class CoreTests {
 static int checks;static void Check(bool ok,string name){checks++;if(!ok)throw new Exception(name);}
 static JObject Person(int i)=>new JObject{["actorId"]="actor"+i,["lifeId"]=1,["side"]=i<6?"human":"scp",["role"]=i<6?"ntf":"049",["rolePriority"]=i<6?4:10,["spawnOrder"]=i,["alive"]=true,["dead"]=false,["name"]="Player"+i,["hp"]=100,["maxHp"]=100,["hs"]=0,["maxHs"]=0,["plane"]="HCZ_EZ",["x"]=i*3,["y"]=0,["effects"]=new JArray(),["special"]=new JArray()};
 static void Main(string[] args){
  var session=new HudSession();Check(session.Visible&&!session.Zoom,"HUD defaults");session.Key(true,true);session.Key(true,true);Check(!session.Visible,"held V only toggles once");session.Key(false,true);Check(session.Zoom&&!session.Visible,"B independent of V");session.Key(true,false);session.Key(true,true);Check(session.Visible,"second V press restores");session.ReleaseKeys();session.Key(true,true);Check(!session.Visible,"reconnect releases held keys without resetting visibility");
  var codeSet=new HashSet<string>();for(int i=0;i<1000;i++){var code=PairingCode.Create(codeSet.Contains);Check(code.Length==4&&code.All(char.IsDigit)&&codeSet.Add(code),"four digit codes collision safe");}
  Check(!MapProjection.IsOffPlane("Hcz049",-145,-100),"049 below grid is not its upper annex");
  Check(MapProjection.Heading(0)==270&&MapProjection.Heading(90)==0&&MapProjection.Heading(180)==90&&MapProjection.Heading(270)==180,"world compass to screen arrow (LCZ)");
  Check((MapProjection.Heading(0)+180)%360==90&&(MapProjection.Heading(90)+180)%360==180,"180 degree HCZ overview rotation");
  Check(MapProjection.Heading(-90)==180&&MapProjection.Heading(720)==270,"heading wrap at spawn and full turns");
  Check(MapProjection.IsOffPlane("Hcz049",-11,-100)&&MapProjection.IsOffPlane("HczWarhead",-200,-100),"049 upper annex and warhead lower annex hidden");
  Check(!MapProjection.IsOffPlane("Hcz049",-100,-100)&&!MapProjection.IsOffPlane("HczWarhead",-106,-100)&&!MapProjection.IsOffPlane("HczServers",-145,-100),"main floor, nearby steps and other rooms retained");
  Check(MapProjection.IsOffPlane("Hcz049",489,400),"upper floor follows room height, not absolute map coordinates");
  Check(TintPayload.Read(new ArraySegment<byte>(new byte[]{0x12,0xAB,0xEF,255}),new[]{"CustomTintDetail"})=="#12ABEF","custom card RGBA");
  Check(TintPayload.Read(new ArraySegment<byte>(new byte[]{2,0,65,1,0,1,0,0,0,255,0x12,0xAB,0xEF,255}),new[]{"CustomItemNameDetail","CustomPermsDetail","CustomTintDetail"})=="#12ABEF","skip variable name and nullable permission color");
  Check(TintPayload.Read(new ArraySegment<byte>(new byte[]{1,0,0,0x12,0xAB,0xEF,255}),new[]{"CustomPermsDetail","CustomTintDetail"})=="#12ABEF","skip null permission color");
  Check(TintPayload.Read(new ArraySegment<byte>(new byte[]{1,2}),new[]{"CustomTintDetail"})==null,"truncated tint rejected");
  Check(TintPayload.Read(new ArraySegment<byte>(new byte[]{1,2,3,4}),new[]{"UnknownDetail","CustomTintDetail"})==null,"unknown payload cannot guess");
  var players=Enumerable.Range(0,9).Select(Person).ToList();var m=new MatchState();
  m.Tick(players,0,false);Check(m.Phase=="preparing","round gate");
  m.Tick(players.Take(8).ToList(),1000,true);Check(m.Phase=="preparing","6+2 must wait");
  var tutorial=Person(9);tutorial["side"]="none";players.Add(tutorial);m.Tick(players,1000,true);players.Remove(tutorial);
  Check(m.Phase=="live"&&m.Slots.Count==9&&m.Wave==1&&m.HalfMs==0,"start exactly 6+3 ignoring tutorial");
  m.Tick(players,1234,true);Check(m.HalfMs==1234&&m.WaveMs==1234,"clocks");m.Paused=true;m.Tick(players,9000,true);Check(m.HalfMs==1234&&m.WaveMs==1234,"pause both");m.Paused=false;
  var order=string.Join(",",m.Order);m.Death("actor0",1,"human",false);m.Death("actor2",1,"human",false);
  players[0]["alive"]=false;players[2]["alive"]=false;m.Tick(players,100,true);Check(m.ScpScore==0&&m.Order[0]=="H01","no score but retain death tracking");
  Check(m.Slots[0].Value<bool>("dead")&&m.Slots[0]["held"].Type==JTokenType.Null,"dead held cleared");
  players[0]["alive"]=true;players[0]["lifeId"]=2;players[0]["spawnOrder"]=100;m.Tick(players,100,true);
  Check(m.Wave==1&&string.Join(",",m.Order)==order,"partial refill fixed positions");
  players[2]["alive"]=true;players[2]["lifeId"]=2;players[2]["spawnOrder"]=101;m.Tick(players,100,true);
  Check(m.Wave==2&&m.WaveMs==0&&m.HalfMs==1534,"full refill resets wave only");
  Check(string.Join(",",m.Order)=="H02,H04,H05,H06,H01,H03,S01,S02,S03","survivors left newborns behind");
  Check(m.LastSurvivors.Count==7,"survivor history");
  m.Death("actor6",1,"scp");m.Death("actor6",1,"scp");m.Death("actor7",1,"scp");m.Death("actor8",1,"scp");Check(m.HumanScore==12,"dedup plus wipe bonus");
  var snapshot=m.Snapshot();snapshot["observedActorId"]="actor1";snapshot["zoom"]=true;File.WriteAllText(args[0],snapshot.ToString());
  m.Tick(players,1500000,true);Check(m.Phase=="ended"&&m.HalfMs==1500000,"25 minute end");
  var endWaveMs=m.WaveMs;var endHuman=m.HumanScore;var endScp=m.ScpScore;
  players[6]["vigor"]=86;players[6]["hp"]=81;players[6]["x"]=42;players[6]["heading"]=123;players[6]["effects"]=new JArray("burn");
  m.Tick(players,3000,true);var after=m.Slots.Single(p=>p.Value<string>("actorId")=="actor6");
  Check(after.Value<int>("vigor")==86&&after.Value<int>("hp")==81&&after.Value<int>("x")==42&&after.Value<int>("heading")==123&&after["effects"].Count()==1,"ended match keeps vigor health position heading and effects live");
  players[6]["alive"]=false;m.Death("actor6",2,"scp");m.Tick(players,1000,true);
  Check(m.Slots.Single(p=>p.Value<string>("actorId")=="actor6").Value<bool>("dead"),"ended match still marks death");
  players[6]["alive"]=true;players[6]["lifeId"]=3;m.Tick(players,1000,true);
  Check(!m.Slots.Single(p=>p.Value<string>("actorId")=="actor6").Value<bool>("dead"),"ended match still marks respawn");
  Check(m.HalfMs==1500000&&m.WaveMs==endWaveMs&&m.HumanScore==endHuman&&m.ScpScore==endScp,"ended match clocks and scores stay stopped while telemetry changes");
  var old=m.Epoch;m.Reset();Check(m.Epoch!=old&&m.Slots.Count==0&&m.Phase=="preparing","reset");
  Console.WriteLine("PASS "+checks+" production state checks");
 }
}
