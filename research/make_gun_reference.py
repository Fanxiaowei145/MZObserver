from pathlib import Path
import json
s=Path('ui/item-data.js').read_text();d=json.loads(s.split('window.MZ_ITEMS=')[1].split(';')[0]);html='<style>body{background:#344558;color:white;font:14px Arial;display:grid;grid-template-columns:repeat(6,200px)}figure{margin:10px}img{width:180px;height:180px;object-fit:contain}</style>'
for k,v in d.items():
 if v.get('wide'):html+=f'<figure><img src="../assets/official/{v["asset"]}.png"><figcaption>{k}</figcaption></figure>'
Path('research/gun-originals.html').write_text(html)
