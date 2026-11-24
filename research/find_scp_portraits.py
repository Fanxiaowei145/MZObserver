import sys,json
from pathlib import Path
sys.path.insert(0,r'C:\Users\86188\Documents\电脑调试\SLUI-Minimap\research\unity-vendor')
import UnityPy
base=Path(r'D:\steam\steamapps\common\SCP Secret Laboratory\SCPSL_Data')
rows=[]
for file in ['resources.assets','sharedassets2.assets']:
 env=UnityPy.load(str(base/file))
 for o in env.objects:
  if o.type.name not in ['Texture2D','Sprite']:continue
  d=o.read();name=d.m_Name
  if not any(s in name.lower() for s in ['939','3114','1507','profile']):continue
  row={'file':file,'id':o.path_id,'type':o.type.name,'name':name}
  if o.type.name=='Texture2D':row['size']=[d.m_Width,d.m_Height]
  rows.append(row)
  if o.type.name=='Texture2D' and ('Profile' in name or name in ['939_Icon','3114_Icon','scp_939_v2','1507_Icon']):d.image.save(Path('assets/official')/(name+'.png'))
Path('research/all-scp-portrait-candidates.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps(rows))


