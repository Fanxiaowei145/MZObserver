from pathlib import Path
import subprocess,shutil
r=Path(__file__).resolve().parents[1];out=r/'output/e2e';out.mkdir(parents=True,exist_ok=True)
framework=Path('C:/Windows/Microsoft.NET/Framework64/v4.0.30319')
newton=r/'research/build-tools/newtonsoft/lib/net45/Newtonsoft.Json.dll';ws=r/'research/build-tools/websocketsharp/lib/websocket-sharp.dll'
def build(name,sources,refs):
 args=['/nologo','/target:winexe' if name=='SCPSL.exe' else '/target:exe','/langversion:latest','/optimize+','/nostdlib+','/out:'+str(out/name)]+['/reference:'+str(framework/n) for n in ['mscorlib.dll','System.dll','System.Core.dll']]+['/reference:'+str(p) for p in refs]+[str(r/s) for s in sources]
 rsp=out/(name+'.rsp');rsp.write_text('\n'.join('"'+a+'"' for a in args),encoding='utf-8')
 subprocess.run(['C:/Program Files/dotnet/dotnet.exe',str(r/'research/build-tools/compiler/tasks/netcore/bincore/csc.dll'),'@'+str(rsp)],check=True)
build('SimServer.exe',['server/Transport.cs','server/HudSession.cs','server/MatchState.cs','tests/SimServer.cs'],[newton,ws])
build('SCPSL.exe',['tests/MockGameWindow.cs'],[framework/'System.Windows.Forms.dll',framework/'System.Drawing.dll'])
for p in [newton,ws]:shutil.copy2(p,out/p.name)
