import json,struct,sys
from pathlib import Path
base=Path(r'D:\steam\steamapps\common\SCP Secret Laboratory\SCPSL_Data')
meta=(base/'il2cpp_data/Metadata/global-metadata.dat').read_bytes()
u32=lambda o:struct.unpack_from('<I',meta,o)[0]
u16=lambda o:struct.unpack_from('<H',meta,o)[0]
def name(i):
 p=u32(24)+i
 return meta[p:meta.index(0,p)].decode('utf-8',errors='replace')
item_names=[]
for p in range(u32(160),u32(160)+u32(164),88):
 if name(u32(p))!='ItemType':continue
 start=u32(p+32);count=u16(p+68)
 for i in range(start,start+count):
  q=u32(96)+i*12
  item_names.append(name(u32(q)))
print('ItemType',item_names)
sys.path.insert(0,r'C:\Users\86188\Documents\电脑调试\SLUI-Minimap\research\unity-vendor')
import UnityPy
env=UnityPy.load(str(base/'resources.assets'))
icons=[]
for o in env.objects:
 if o.type.name!='Texture2D':continue
 d=o.read();n=d.m_Name
 if any(k in n.lower() for k in ['icon','keycard','lantern','snowball','coin','scp018','scp244','scp1576','scp330','scp2176','scp956']):
  icons.append({'id':o.path_id,'name':n,'size':[d.m_Width,d.m_Height]})
Path('research/item-catalog.json').write_text(json.dumps({'types':item_names,'textures':icons},indent=2),encoding='utf-8')
print(json.dumps(icons))
