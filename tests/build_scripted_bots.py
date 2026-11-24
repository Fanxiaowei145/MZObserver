from pathlib import Path
import subprocess
r=Path.cwd();out=r/'output/bot-script-audit';out.mkdir(parents=True,exist_ok=True)
args=['/nologo','/target:library','/langversion:latest','/nostdlib+','/out:'+str(out/'MZScriptedBots.dll')]
args+=['/reference:'+str(p) for p in (r/'research/spectator-audit/server/SCPSL_Data/Managed').glob('*.dll')]
args+=['/reference:'+str(r/'dist/server'/n) for n in ['MZObserver.dll','Newtonsoft.Json.dll','0Harmony.dll']]
args+=[str(r/'tests/ScriptedBots.cs'),str(r/'tests/ScriptedKillfeedCases.cs'),str(r/'tests/VisibleBotCombat.cs'),str(r/'tests/DummyIdentity.cs'),str(r/'tests/BotOrderSamples.cs'),str(r/'tests/BotRotation.cs'),str(r/'tests/BotVisualChecks.cs')]
rsp=out/'scripted-bots.rsp';rsp.write_text('\n'.join('"'+a+'"' for a in args),encoding='utf-8')
subprocess.run(['dotnet',str(r/'research/build-tools/compiler/tasks/netcore/bincore/csc.dll'),'@'+str(rsp)],check=True)
