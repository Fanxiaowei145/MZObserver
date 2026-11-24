import sys,json,struct
from pathlib import Path
sys.path.insert(0,r'C:\Users\86188\Documents\电脑调试\SLUI-Minimap\research\unity-vendor')
import UnityPy
env=UnityPy.load(r'D:\steam\steamapps\common\SCP Secret Laboratory\SCPSL_Data\level2')
objs={o.path_id:o for o in env.objects if o.assets_file.name=='level2'}
rows=[]
def visit(gid,path='',depth=0):
 if depth>6:return
 go=objs[gid].read();path+='/'+go.m_Name
 for c in go.m_Component:
  o=c.component.deref();tree=o.read_typetree(check_read=False)
  if o.type.name=='MonoBehaviour':
   d=o.read(check_read=False);name=d.m_Script.read().m_ClassName
   if name=='Image':
    rgba=struct.unpack_from('<4f',o.get_raw_data(),44)
    row={'path':path,'id':o.path_id,'rgba':rgba,'hex':'#'+''.join(f'{round(v*255):02X}' for v in rgba[:3])}
    rows.append(row);print(row)
  for child in tree.get('m_Children',[]):
   tr=objs.get(child['m_PathID'])
   if tr:visit(tr.read_typetree()['m_GameObject']['m_PathID'],path,depth+1)
for gid in [3397,4646,2553,4699]:visit(gid)
Path('research/stat-slider-colors.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
