from pathlib import Path
import subprocess,shutil
r=Path(__file__).resolve().parents[1]
dotnet='C:/Program Files/dotnet/dotnet.exe';csc=r/'research/build-tools/compiler/tasks/netcore/bincore/csc.dll'
framework=Path('C:/Windows/Microsoft.NET/Framework64/v4.0.30319')
out=r/'output/tests';out.mkdir(parents=True,exist_ok=True)
newton=r/'research/build-tools/newtonsoft/lib/net45/Newtonsoft.Json.dll'
ws=r/'research/build-tools/websocketsharp/lib/websocket-sharp.dll'
def compile(name,sources,extra=[]):
 args=['/nologo','/target:exe','/langversion:latest','/optimize+','/nostdlib+','/out:'+str(name)]
 args+=['/reference:'+str(framework/n) for n in ['mscorlib.dll','System.dll','System.Core.dll']]
 args+=['/reference:'+str(p) for p in extra]+[str(r/p) for p in sources]
 rsp=out/(name.stem+'.rsp');rsp.write_text('\n'.join('"'+a+'"' for a in args),encoding='utf-8')
 subprocess.run([dotnet,str(csc),'@'+str(rsp)],check=True)
compile(out/'CoreTests.exe',['server/MatchState.cs','server/TintPayload.cs','server/MapProjection.cs','server/HudSession.cs','tests/CoreTests.cs'],[newton])
shutil.copy2(newton,out/newton.name)
compile(out/'CombatTests.exe',['server/CombatLedger.cs','tests/CombatTests.cs'],[newton])
subprocess.run([str(out/'CombatTests.exe')],check=True)
subprocess.run([str(out/'CoreTests.exe'),str(out/'state-fixture.json')],check=True)
compile(out/'TransportTests.exe',['server/Transport.cs','server/HudSession.cs','tests/TransportTests.cs'],[ws])
shutil.copy2(ws,out/ws.name)
subprocess.run([str(out/'TransportTests.exe')],check=True)
compile(r/'desktop/WindowTracker.exe',['desktop/WindowTracker.cs'])
p=subprocess.Popen([str(r/'desktop/WindowTracker.exe')],stdout=subprocess.PIPE,text=True)
try:print('Tracker:',p.stdout.readline().strip())
finally:p.terminate();p.wait()

compile(out/'DummyIdentityTests.exe',['tests/DummyIdentity.cs','tests/DummyIdentityTests.cs'],[newton])
subprocess.run([str(out/'DummyIdentityTests.exe'),str(r/'samples/spectator-order'),str(out/'latest-order-sample.txt')],check=True)
