from pathlib import Path
import subprocess
r=Path(__file__).resolve().parents[1]
args=['/nologo','/target:library','/langversion:latest','/nostdlib+','/out:'+str(r/'output/tests/MZLocalCombatProbe.dll')]
args+=['/reference:'+str(p) for p in (r/'research/spectator-audit/server/SCPSL_Data/Managed').glob('*.dll')]
args+=['/reference:'+str(r/'dist/server'/n) for n in ['MZObserver.dll','Newtonsoft.Json.dll','0Harmony.dll']]
args+=[str(r/'tests/DedicatedCombatProbe.cs')]
rsp=r/'output/tests/probe.rsp';rsp.write_text('\n'.join('"'+a+'"' for a in args),encoding='utf-8')
subprocess.run(['dotnet',str(r/'research/build-tools/compiler/tasks/netcore/bincore/csc.dll'),'@'+str(rsp)],check=True)
