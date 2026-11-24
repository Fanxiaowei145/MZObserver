"""Export reviewed local-space room artwork; do not apply review-only rotations."""
from pathlib import Path
import json,runpy,copy
ROOT=Path(__file__).resolve().parents[1]
g=runpy.run_path(str(ROOT/'output/room-candidates/build_review.py'))
out=ROOT/'assets/rooms/reviewed';out.mkdir(exist_ok=True)
manifest={}
for source in g['rooms']:
 if source.get('excluded'):continue
 r=copy.deepcopy(source)
 r.pop('previewRotation',None);r.pop('previewFlipY',None)
 svg=g['svg'](r)
 target=out/(r['code']+'.svg');target.write_text(svg,encoding='utf-8')
 manifest[r['key']]={'code':r['code'],'art':'reviewed/'+target.name,'bounds':[float(x) for x in g['bounds'](r).split()]}
(ROOT/'ui/room-shapes-data.js').write_text('window.MZ_ROOM_SHAPE_DATA='+json.dumps(manifest,separators=(',',':'))+';\n',encoding='utf-8')
print(f'Exported {len(manifest)} room shapes in local coordinates')
