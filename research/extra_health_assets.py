import sys,json
from pathlib import Path
sys.path.insert(0,r'C:\Users\86188\Documents\电脑调试\SLUI-Minimap\research\unity-vendor')
import UnityPy
env=UnityPy.load(r'D:\steam\steamapps\common\SCP Secret Laboratory\SCPSL_Data\resources.assets')
rows=[]
for o in env.objects:
    if o.type.name not in ['Texture2D','GameObject']:continue
    d=o.read();name=d.m_Name
    if o.type.name=='Texture2D' and any(k in name.lower() for k in ['1509','207','1853','adrenal']):
        rows.append({'id':o.path_id,'name':name,'size':[d.m_Width,d.m_Height]})
        if 'icon' in name.lower():d.image.save(Path('assets/official')/(name+'.png'))
    if o.type.name=='GameObject' and any(k in name.lower() for k in ['artificial','ahp','hume']):rows.append({'go':o.path_id,'name':name})
Path('research/extra-health-assets.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps(rows))
