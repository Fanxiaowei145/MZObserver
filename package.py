"""Rebuild and package the existing approved renderer with the Windows overlay runtime."""
from pathlib import Path
import subprocess,shutil,zipfile,json,hashlib,sys
r=Path(__file__).resolve().parent
if '--skip-checks' not in sys.argv:
 subprocess.run(['python',str(r/'build.py')],check=True)
 subprocess.run(['python',str(r/'tests/build_checks.py')],check=True)
 subprocess.run(['python',str(r/'research/build_standalone.py')],check=True)
runtime=Path('C:/Users/86188/Documents/电脑调试/SLUI-Minimap/node_modules/electron/dist')
staging=next((a.split('=',1)[1] for a in sys.argv if a.startswith('--staging-dir=')),None)
out=(r/staging/'MZOverlay') if staging else r/'dist/MZOverlay';out.mkdir(parents=True,exist_ok=True)
shutil.copytree(runtime,out,dirs_exist_ok=True)
shutil.copy2(out/'electron.exe',out/'MZOverlay.exe');(out/'electron.exe').unlink()
target=out/'resources/app';target.mkdir(parents=True,exist_ok=True)
shutil.copytree(r/'desktop/node_modules',target/'node_modules',dirs_exist_ok=True)
for p in (r/'desktop').iterdir():
 if p.suffix in ['.cjs','.html','.json','.exe']:shutil.copy2(p,target/p.name)
shutil.copytree(r/'assets',target/'assets',dirs_exist_ok=True)
shutil.copytree(r/'ui',target/'ui',dirs_exist_ok=True,ignore=shutil.ignore_patterns('verify-*','check-*','layout-review*'))
default=out/'resources/default_app.asar'
if default.is_file():default.unlink()
for name in ['安装与使用.md','实现与验证说明.md','给服主的安装说明.txt']:
 if (r/name).exists():shutil.copy2(r/name,r/'dist'/name)
desktop_version=json.loads((r/'desktop/package.json').read_text(encoding='utf-8'))['version']
for folder,label in [(r/'dist/server',f'MZObserver-{desktop_version}-server.zip'),(out,f'MZOverlay-{desktop_version}-win-x64.zip')]:
 with zipfile.ZipFile(r/'dist'/label,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for p in folder.rglob('*'):
   if p.is_file():z.write(p,p.relative_to(folder.parent))
  for name in ['安装与使用.md','实现与验证说明.md','给服主的安装说明.txt']:
   if (r/name).exists():z.write(r/name,name)
manifest={p.name:{'bytes':p.stat().st_size,'sha256':hashlib.file_digest(p.open('rb'),'sha256').hexdigest()} for p in (r/'dist').glob('*.zip')}
(r/'dist/checksums.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps(manifest,indent=2))
