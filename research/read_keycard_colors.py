import sys,json,struct,re
from pathlib import Path
sys.path.insert(0,r'C:\Users\86188\Documents\电脑调试\SLUI-Minimap\research\unity-vendor')
import UnityPy
env=UnityPy.load(r'D:\steam\steamapps\common\SCP Secret Laboratory\SCPSL_Data\resources.assets')
cache={};rows=[]
for o in env.objects:
 if o.type.name!='MonoBehaviour':continue
 d=o.read(check_read=False);key=(d.m_Script.file_id,d.m_Script.path_id)
 if key not in cache:
  try:cache[key]=d.m_Script.read().m_ClassName
  except Exception:cache[key]=''
 if 'Keycard' not in cache[key]:continue
 raw=o.get_raw_data();go=d.m_GameObject.read().m_Name if d.m_GameObject.path_id else d.m_Name
 row={'id':o.path_id,'class':cache[key],'go':go,'raw':raw.hex(),'strings':[s.decode() for s in re.findall(rb'[A-Za-z][A-Za-z0-9 _.-]{5,}',raw)]}
 rows.append(row)
 print({k:v for k,v in row.items() if k!='raw'})
Path('research/keycard-serialized.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')

