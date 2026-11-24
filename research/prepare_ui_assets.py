import json,sys,shutil
from pathlib import Path
sys.path.insert(0,r'C:\Users\86188\Documents\电脑调试\SLUI-Minimap\research\unity-vendor')
import UnityPy
old=Path(r'C:\Users\86188\Documents\电脑调试\SLUI-Minimap')
out=Path('assets/official')
env=UnityPy.load(r'D:\steam\steamapps\common\SCP Secret Laboratory\SCPSL_Data\resources.assets')
chosen={753:'ParticleDisruptor',1014:'E11SR',1046:'Jailbird',1244:'MicroHID',1245:'ArmorLight',1286:'ArmorHeavy',1341:'ArmorCombat',1417:'SCP500',1421:'SCP268',1591:'SCP1344'}
for o in env.objects:
    if o.path_id in chosen:
        d=o.read();d.image.save(out/(chosen[o.path_id]+'.png'))
layout=json.loads((old/'src/mocks/minimap-layouts.json').read_text(encoding='utf-8'))['layouts'][0]
manifest=json.loads((old/'src/features/minimap/room-artwork.json').read_text(encoding='utf-8'))
dest=Path('assets/rooms');dest.mkdir(exist_ok=True)
for room in layout['rooms']:
    art=manifest['byPrefabName'].get(room['prefab']) or manifest['byZoneShape'][room['zone']][room['shape']]
    shutil.copy2(old/'public/assets/minimap/rooms'/art,dest/art)
    room['art']=art
Path('ui').mkdir(exist_ok=True)
Path('ui/map-data.js').write_text('window.MZ_MAP='+json.dumps(layout,ensure_ascii=False)+';',encoding='utf-8')
print('Prepared',len(layout['rooms']),'map rooms; official role/item assets ready.')
