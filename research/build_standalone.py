"""Package the actual renderer and original art into one offline HTML file."""
import base64,json,re,mimetypes
from pathlib import Path
root=Path(__file__).resolve().parents[1]
ui=root/'ui'
def data_uri(p):
    mime='image/svg+xml' if p.suffix=='.svg' else mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
    return 'data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode('ascii')
assets={p.relative_to(root/'assets').as_posix():data_uri(p) for p in (root/'assets').rglob('*') if p.suffix.lower() in ['.png','.svg']}
html=(ui/'index.html').read_text(encoding='utf-8-sig')
def css(match):
    name=match[1];text=(ui/name).read_text(encoding='utf-8-sig')
    text=re.sub(r"url\(['\"]?\.\./assets/([^)'\"]+)['\"]?\)",lambda m:'url("'+assets[m[1]]+'")',text)
    return '<style>\n'+text+'\n</style>'
html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',css,html)
def js(match):
    name=match[1];text=(ui/name).read_text(encoding='utf-8-sig')
    text=text.replace("const art=n=>`../assets/official/${n}.png`;","const art=n=>window.MZ_ASSETS['official/'+n+'.png'];")
    text=text.replace("im.src='../assets/rooms/'+r.art", "im.src=window.MZ_ASSETS['rooms/'+r.art]")
    text=text.replace("c.querySelector('.armor').src=`../assets/ui/armor-${armorSymbols[p.armor]}.svg`", "c.querySelector('.armor').src=window.MZ_ASSETS[`ui/armor-${armorSymbols[p.armor]}.svg`]")
    return '<script>\n'+text.replace('</script','<\\/script')+'\n</script>'
html=re.sub(r'<script src="([^"]+)"></script>',js,html)
html=html.replace('<body>','<body><script>window.MZ_ASSETS='+json.dumps(assets,ensure_ascii=False,separators=(',',':'))+';</script>')
html=re.sub(r'src="\.\./assets/([^"]+)"',lambda m:'src="'+assets[m[1]]+'"',html)
html=html.replace('MZ 观战 UI · 实际布局预览','MZ 观战 UI · 统一离线预览')
target=root/'output'/'MZ观战UI_统一预览.html';target.write_text(html,encoding='utf-8')
print(json.dumps({'output':str(target),'embeddedAssets':len(assets),'sizeMiB':round(target.stat().st_size/1048576,2)},ensure_ascii=False))
