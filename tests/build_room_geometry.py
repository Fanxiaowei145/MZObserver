from pathlib import Path
import subprocess
r=Path(__file__).resolve().parents[1];out=r/'output/room-calibration';out.mkdir(exist_ok=True)
args=['/nologo','/target:library','/langversion:latest','/nostdlib+','/out:'+str(out/'MZRoomGeometryProbe.dll')]
args+=['/reference:'+str(p) for p in (r/'research/spectator-audit/server/SCPSL_Data/Managed').glob('*.dll')]
args+=['/reference:'+str(r/'dist/server/Newtonsoft.Json.dll'),'/reference:'+str(r/'dist/server/MZObserver.dll'),str(r/'tests/RoomGeometryProbe.cs')]
rsp=out/'probe.rsp';rsp.write_text('\n'.join('"'+a+'"' for a in args),encoding='utf-8')
subprocess.run(['dotnet',str(r/'research/build-tools/compiler/tasks/netcore/bincore/csc.dll'),'@'+str(rsp)],check=True)
