from pathlib import Path
import json,base64
p=Path('ui/item-data.js');s=p.read_text();catalog=json.loads(s.split('window.MZ_ITEMS=')[1].split(';')[0]);target=Path('assets/items');target.mkdir(exist_ok=True)
for key,d in catalog.items():
 if d.get('card'):continue
 raw=base64.b64encode(Path('assets/official',d['asset']+'.png').read_bytes()).decode();w,h=d['size'];box=' '.join(map(str,d['box']))
 cut=d.get('alphaCutoff',.5);transfer=f'<feComponentTransfer><feFuncA type="linear" slope="{1/(1-cut):.6f}" intercept="{-cut/(1-cut):.6f}"/></feComponentTransfer>' if key!='SCP2176' else '<feComponentTransfer><feFuncA type="linear" slope="32" intercept="-1"/></feComponentTransfer>'
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="{box}"><defs><filter id="white" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/>{transfer}</filter></defs><image width="{w}" height="{h}" transform="rotate({d["angle"]})" filter="url(#white)" xlink:href="data:image/png;base64,{raw}"/></svg>'
 (target/(key+'.svg')).write_text(svg)
