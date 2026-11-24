import sys,json,struct
from pathlib import Path
sys.path.insert(0,r'C:\Users\86188\Documents\电脑调试\SLUI-Minimap\research\unity-vendor')
import UnityPy
game=Path(r'D:\steam\steamapps\common\SCP Secret Laboratory\SCPSL_Data')
env=UnityPy.load(*[str(game/f) for f in (sys.argv[1:] or ['resources.assets'])])
scripts={}
rows=[]
for o in env.objects:
 if o.type.name!='MonoBehaviour':continue
 d=o.read(check_read=False)
 key=(d.m_Script.file_id,d.m_Script.path_id)
 if key not in scripts:
  try:scripts[key]=d.m_Script.read().m_ClassName
  except Exception:scripts[key]=''
 name=scripts[key]
 if not any(x in name.lower() for x in ['health','ahp','statbar','hume','statui','statgui','statmodule','hud','interface','statslider','statusbar']):continue
 raw=o.get_raw_data();row={'file':o.assets_file.name,'id':o.path_id,'script':name,'gameObject':d.m_GameObject.path_id,'size':len(raw),'hex':raw.hex()}
 # Only report compact metadata; full evidence remains on disk.
 rows.append(row);print({k:v for k,v in row.items() if k!='hex'})
Path('research/health-color-components.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
Path('research/resource-script-names.json').write_text(json.dumps(sorted(set(scripts.values())),indent=2),encoding='utf-8')

