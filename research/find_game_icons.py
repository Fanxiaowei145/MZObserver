import sys, json
from pathlib import Path
sys.path.insert(0, r'C:\Users\86188\Documents\电脑调试\SLUI-Minimap\research\unity-vendor')
import UnityPy
game=Path(r'D:\steam\steamapps\common\SCP Secret Laboratory\SCPSL_Data')
rows=[]
for filename in ['resources.assets','sharedassets2.assets']:
    env=UnityPy.load(str(game/filename))
    for obj in env.objects:
        if obj.type.name not in ['Sprite','Texture2D']: continue
        d=obj.read()
        name=d.m_Name
        if any(k in name.lower() for k in ['logo','ntf','mtf','faction','nine','epsilon','team','fox']):
            rows.append({'file':filename,'id':obj.path_id,'type':obj.type.name,'name':name})
Path('research/icon-candidates.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(rows,ensure_ascii=False))
