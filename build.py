from pathlib import Path
import subprocess,shutil,sys,json
root=Path(__file__).resolve().parent
refs=root/'research/spectator-audit/server/SCPSL_Data/Managed'
dotnet=Path('C:/Program Files/dotnet/dotnet.exe')
compiler=root/'research/build-tools/compiler/tasks/netcore/bincore/csc.dll'
out=root/'dist/server';out.mkdir(parents=True,exist_ok=True)
deps=[root/'research/build-tools/harmony/lib/net472/0Harmony.dll',root/'research/build-tools/newtonsoft/lib/net45/Newtonsoft.Json.dll',root/'research/build-tools/websocketsharp/lib/websocket-sharp.dll']
args=['/nologo','/target:library','/langversion:latest','/optimize+','/nostdlib+','/out:'+str(out/'MZObserver.dll')]
args+=['/reference:'+str(p) for p in refs.glob('*.dll')]+['/reference:'+str(p) for p in deps]
args += [str(p) for p in (root/'server').glob('*.cs')]
rsp=root/'research/build-tools/plugin.rsp';rsp.write_text('\n'.join('"'+s+'"' for s in args),encoding='utf-8')
p=subprocess.run([str(dotnet),str(compiler),'@'+str(rsp)],capture_output=True,text=True,encoding='utf-8',errors='replace')
(root/'output/plugin-build.log').write_text(p.stdout+p.stderr,encoding='utf-8')
print(p.stdout+p.stderr)
if p.returncode:sys.exit(p.returncode)
for d in deps:shutil.copy2(d,out/d.name)
shutil.copy2(root/'server/config.example.yml',out/'config.example.yml')
shutil.copy2(root/'research/build-tools/harmony/LICENSE',out/'Harmony-LICENSE.txt')
print('Built',out/'MZObserver.dll')
