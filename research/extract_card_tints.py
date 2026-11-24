exec(open('research/inspect_card_components.py',encoding='utf-8-sig').read().split('for i in [')[0])
rows=json.load(open('research/keycard-serialized.json')); out={}
for r in rows:
 if not r['class'].endswith('KeycardItem'):continue
 b=bytes.fromhex(r['raw'])
 for off in range(32,len(b)-11,4):
  f,p=struct.unpack_from('<iq',b,off)
  if f or p not in d:continue
  o=d[p]
  if o.type.name!='MonoBehaviour':continue
  x=o.read(check_read=False)
  if x.m_Script.read().m_ClassName=='PredefinedTintDetail':
   color=struct.unpack_from('<4f',o.get_raw_data(),32);out[r['go']]='#'+''.join(f'{round(c*255):02x}' for c in color[:3])
print(out)
from pathlib import Path
Path('research/keycard-colors.json').write_text(json.dumps(out,indent=2))
