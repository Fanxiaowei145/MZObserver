from pathlib import Path
import subprocess, shutil
r=Path(__file__).resolve().parents[1];out=r/'output/tests';framework=Path('C:/Windows/Microsoft.NET/Framework64/v4.0.30319');ws=r/'research/build-tools/websocketsharp/lib/websocket-sharp.dll'
def run(name,sources,extra=[]):
 exe=out/(name+'.exe');args=['/nologo','/target:exe','/langversion:latest','/optimize+','/nostdlib+','/out:'+str(exe)]+['/reference:'+str(framework/n) for n in ['mscorlib.dll','System.dll','System.Core.dll']]+['/reference:'+str(p) for p in extra]+[str(r/p) for p in sources]
 rsp=out/(name+'.rsp');rsp.write_text('\n'.join('"'+a+'"' for a in args),encoding='utf-8');subprocess.run(['C:/Program Files/dotnet/dotnet.exe',str(r/'research/build-tools/compiler/tasks/netcore/bincore/csc.dll'),'@'+str(rsp)],check=True)
 result=subprocess.run([str(exe)],capture_output=True,text=True,check=True);print(name+': '+result.stdout.strip());(out/(name+'.log')).write_text(result.stdout,encoding='utf-8')
shutil.copy2(ws,out/ws.name)
run('TargetFeedbackTests',['server/TargetFeedbackGate.cs','tests/TargetFeedbackTests.cs'])
run('TransportTests',['server/Transport.cs','server/HudSession.cs','tests/TransportTests.cs'],[ws])
for tag,source in [('Before','tests/fixtures/transport-preview7.cs'),('After','server/Transport.cs')]:run('TransportLatency'+tag,[source,'server/HudSession.cs','tests/TransportLatencyTests.cs'],[ws])
