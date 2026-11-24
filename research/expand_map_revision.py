from pathlib import Path
p=Path('ui/app.js');s=p.read_text(encoding='utf-8');s=s.replace('const rooms=window.MZ_MAP.rooms;',"const rooms=window.MZ_MAP.rooms;\nwindow.mapRoomSets={HCZ_EZ:rooms,LCZ:MZ_LIGHT_MAP.rooms};")
s=s.replace("const scope=n===1?rooms:rooms.filter(r=>r.zone==='HeavyContainment');", "const layout=mapRoomSets.HCZ_EZ;\n const scope=n===1?layout:layout.filter(r=>r.zone==='HeavyContainment');")
s=s.replace('${p.x*mapSign*scale+tx-11}px,${p.y*mapSign*scale+ty-11}', '${p.x*mapSign*scale+tx-MZ_MAP_VIEW.markerSize/2}px,${p.y*mapSign*scale+ty-MZ_MAP_VIEW.markerSize/2}')
a=s.index('function fit(){');b=s.index("addEventListener('resize'",a)
s=s[:a]+'''function fit(){const scale=Math.min(innerWidth/1920,innerHeight/1080);const stage=$('#stage');stage.style.width=`${innerWidth/scale}px`;stage.style.height=`${innerHeight/scale}px`;stage.style.transform=`scale(${scale})`;stage.style.left='0px';stage.style.top='0px';}
'''+s[b:];p.write_text(s,encoding='utf-8')
p=Path('ui/item-icons.js');s=p.read_text(encoding='utf-8').replace('p={...p,special};',"special=special.map(([name,label])=>[name,String(label??'').replace(/\\s*[x×]\\s*1$/i,'')]);\n  p={...p,special};");p.write_text(s,encoding='utf-8')
p=Path('ui/index.html');s=p.read_text(encoding='utf-8').replace('<script src="map-preview.js">','<script src="map-landmarks.js"></script><script src="map-preview.js">');p.write_text(s,encoding='utf-8')
p=Path('ui/final-layout.css');s=p.read_text(encoding='utf-8');s+='''
#radar{width:472.5px;height:437.5px}
#score{left:calc(50% - 210px)}
#controls{max-width:calc(100vw - 24px);flex-wrap:wrap}
.card.invisible:not(.dead) .portrait{opacity:.5}
.marker{width:13.2px;height:13.2px;border-width:1px;box-shadow:0 1px 2px #0009}
.marker span{font-size:8px}
.marker::before{width:4.2px;height:6px;left:12.6px;top:3.6px;transform-origin:-6px 3px}
#map-world,.marker,.elevator-label,.room-landmark{transition:transform .22s linear}
.room-landmark{position:absolute;left:0;top:0;display:flex;align-items:center;gap:2px;height:16px;color:#fff;font:600 10px/16px Arial,'Microsoft YaHei',sans-serif;white-space:nowrap;text-shadow:0 1px 2px #000,0 0 3px #000;pointer-events:none}
.room-landmark svg{width:12px;height:12px;flex-shrink:0;fill:none;stroke:currentColor;stroke-width:1.6}
#radar.floor-reset .room-landmark{transition:none}
''';p.write_text(s,encoding='utf-8')
