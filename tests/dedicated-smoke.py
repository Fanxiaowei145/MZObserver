"""Launch the real official Windows dedicated server with an isolated local MZ install."""
from pathlib import Path
import subprocess,shutil,json,time,threading,queue,socket,sys
r=Path(__file__).resolve().parents[1]
server=Path('C:/MZLocalTest') if Path('C:/MZLocalTest/SCPSL.exe').exists() else r/'research/spectator-audit/server'
def option(key,default):return next((a.split('=',1)[1] for a in sys.argv if a.startswith(key+'=')),default)
out=r/option('--output-dir','output/dedicated');out.mkdir(parents=True,exist_ok=True)
game_port=int(option('--game-port','17777'));data_port=int(option('--data-port','28481'))
for port,kind in [(game_port,socket.SOCK_DGRAM),(data_port,socket.SOCK_STREAM)]:
 with socket.socket(socket.AF_INET,kind) as probe:probe.bind(('127.0.0.1',port))
(server/'hoster_policy.txt').write_text('gamedir_for_configs: true\n',encoding='utf-8')
data=server/'AppData';game_config=data/'config'/str(game_port);game_config.mkdir(parents=True,exist_ok=True)
text=(server/'ConfigTemplates/config_gameplay.template.txt').read_text(encoding='utf-8-sig')
for old,new in [('server_name: My Server Name','server_name: MZ Local Plugin Startup Test'),('ipv4_bind_ip: 0.0.0.0','ipv4_bind_ip: 127.0.0.1'),('ipv6_bind_ip: ::','ipv6_bind_ip: ::1'),('server_ip: auto','server_ip: 127.0.0.1')]:text=text.replace(old,new)
if not (game_config/'config_gameplay.txt').exists():(game_config/'config_gameplay.txt').write_text(text,encoding='utf-8')
lab=data/'SCP Secret Laboratory/LabAPI'
for folder in ['plugins','dependencies']:(lab/folder/str(game_port)).mkdir(parents=True,exist_ok=True)
shutil.copy2(r/'dist/server/MZObserver.dll',lab/'plugins'/str(game_port)/'MZObserver.dll')
for name in ['Newtonsoft.Json.dll','websocket-sharp.dll','0Harmony.dll']:shutil.copy2(r/'dist/server'/name,lab/'dependencies'/str(game_port)/name)
cfg=lab/'configs'/str(game_port)/'MZObserver';cfg.mkdir(parents=True,exist_ok=True)
config=(r/'server/config.example.yml').read_text(encoding='utf-8').replace("'0.0.0.0'","'127.0.0.1'").replace('port: 28480','port: '+str(data_port))
if '--bots' in sys.argv:config=config.replace('include_dummy_players: false','include_dummy_players: true')
if not (cfg/'config.yml').exists():(cfg/'config.yml').write_text(config,encoding='utf-8')
args=[str(server/'LocalAdmin.exe'),str(game_port),'--config',str(out/'config_localadmin.txt'),'--logs',str(out/'localadmin-logs'),'--useDefault','--skipHomeCheck','--noSetCursor','--noTerminalTitle','--acceptEULA','--restartsLimit','0','--','-appdatapath',str(data),'-configpath',str(game_config)]
(out/'launch.json').write_text(json.dumps({'cwd':str(server),'argv':args,'gamePort':game_port,'dataPort':data_port},ensure_ascii=False,indent=2),encoding='utf-8')
if '--interactive' in sys.argv:
 p=subprocess.Popen(args,cwd=server,creationflags=subprocess.CREATE_NEW_CONSOLE)
 (out/'active-process.json').write_text(json.dumps({'pid':p.pid}),encoding='utf-8')
 print('Interactive LocalAdmin started:',p.pid,'; type exit in its console to stop.')
 sys.exit(0)
p=subprocess.Popen(args,cwd=server,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
(out/'active-process.json').write_text(json.dumps({'pid':p.pid}),encoding='utf-8')
log=(out/'startup.log').open('w',encoding='utf-8');lines=[]
def read():
 for raw in iter(p.stdout.readline,b''):
  try:line=raw.decode('utf-8')
  except UnicodeDecodeError:line=raw.decode('gb18030',errors='replace')
  lines.append(line);log.write(line);log.flush()
threading.Thread(target=read,daemon=True).start()
control=out/'commands.txt';control.write_text('',encoding='utf-8');pos=0
try:
 started=time.monotonic()
 while p.poll() is None and time.monotonic()-started<int(next((a.split('=')[1] for a in sys.argv if a.startswith('--duration=')),'240')):
  text=control.read_text(encoding='utf-8');new=text[pos:];pos=len(text)
  for cmd in new.splitlines():
   if cmd.strip():p.stdin.write((cmd.strip()+'\n').encode('utf-8'));p.stdin.flush()
  time.sleep(.2)
 if p.poll() is None:
  p.stdin.write(b'exit\n');p.stdin.flush()
  try:p.wait(timeout=15)
  except subprocess.TimeoutExpired:p.terminate();p.wait(timeout=10)
finally:
 if p.poll() is None:p.terminate();p.wait(timeout=10)
 time.sleep(.3);log.close()
print('LocalAdmin exit:',p.returncode)
