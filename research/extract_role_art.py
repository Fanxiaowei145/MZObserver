import sys,json
from pathlib import Path
sys.path.insert(0,r'C:\Users\86188\Documents\电脑调试\SLUI-Minimap\research\unity-vendor')
import UnityPy
game=Path(r'D:\steam\steamapps\common\SCP Secret Laboratory\SCPSL_Data')
out=Path('assets/official');out.mkdir(parents=True,exist_ok=True)
rows=[]
for filename in ['resources.assets','sharedassets2.assets']:
    env=UnityPy.load(str(game/filename))
    for obj in env.objects:
        if obj.type.name!='Texture2D':continue
        d=obj.read();name=d.m_Name
        if any(k in name.lower() for k in ['profileimage','_icon','roleicon']):
            if d.m_Width < 100 or d.m_Height <100:continue
            rows.append({'file':filename,'id':obj.path_id,'name':name,'size':[d.m_Width,d.m_Height]})
            if name.endswith('ProfileImage') or any(k in name.lower() for k in ['scp','scientist','guard','mtf','class','human']):
                target=out/(name+'.png');d.image.save(target)
                rows[-1]['output']=target.as_posix()
Path('research/role-art-index.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(rows,ensure_ascii=False))
