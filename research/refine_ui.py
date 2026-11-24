from pathlib import Path
p=Path('ui/app.js')
s=p.read_text(encoding='utf-8').replace('MZ · ','')
s=s.replace('reserve:120','reserve:30').replace('reserve:60','reserve:30').replace('reserve:0','reserve:5')
s=s.replace("document.images].filter(im=>!im.naturalWidth)","document.images].filter(im=>im.getAttribute('src') && !im.naturalWidth)")
s=s.replace("im.className='room';im.src", "im.className='room';im.dataset.zone=r.zone;im.src")
s=s.replace("function updateMap(n,data){", "function updateMap(n,data){world.querySelectorAll('.room').forEach(im=>im.style.opacity=n===1||im.dataset.zone==='HeavyContainment'?'.79':'0');")
s=s.replace('art(p.held)', "art(p.held||'E11SR')")
s=s.replace('p.reserve!==null?', 'p.reserve!==null&&p.ammo!==null?')
s=s.replace("<img class=\"held\" src=\"${art(p.held||'E11SR')}\"", "<img class=\"held\" style=\"visibility:${p.held?'visible':'hidden'}\" src=\"${art(p.held||'E11SR')}\"")
s=s.replace("c.querySelector('.role').textContent=r.name", "c.querySelector('.role').textContent=''")
s=s.replace('reserve:', 'magazineCapacity:').replace('p.reserve', 'p.magazineCapacity')
s=s.replace("armor:'ArmorNone'", "armor:null")
s=s.replace("c.querySelector('.armor').style.display=scp?'none':'block';if(!scp)c.querySelector('.armor').src=art(p.armor)","c.querySelector('.armor').style.display=scp||!p.armor?'none':'block';if(!scp&&p.armor)c.querySelector('.armor').src=art(p.armor);else c.querySelector('.armor').removeAttribute('src')")
p.write_text(s,encoding='utf-8')
# The CSS layout crops official portraits only; no generated or redrawn players/items.
css='''
/* Final review adjustments: original item art, no card outlines, smaller portraits. */
.frame{border:0;background:transparent}
.name-row{border:0;justify-content:center;height:24px;background:#080e18c9}
.name{max-width:128px;font-size:16px;text-align:center;font-weight:700}
.role{display:none}
.equipment{border:0;height:25px;background:#080d16b3}
.card{height:188px}
.portrait{width:81px;height:132px;bottom:0;left:0}
.portrait[data-art="Scientist_ProfileImage"] img{width:178px;left:-48px;top:-8px}
.portrait[data-art="Guard_ProfileImage"] img{width:170px;left:-47px;top:-7px}
.portrait[data-art="MTF_Icon"] img{width:95px;left:-7px;top:18px}
.portrait[data-art="049_ProfileImage"] img{width:98px;left:-9px;top:3px}
.portrait[data-art="096_ProfileImage"] img{width:158px;left:-37px;top:0}
.portrait[data-art="106_ProfileImage"] img{width:105px;left:-14px;top:0}
.numbers{right:7px;bottom:25px;gap:5px}
.hp{font-size:29px;letter-spacing:-.6px}
.hs{font-size:17px;line-height:20px;color:#e3d8ff}
.armor{right:8px;bottom:2px;width:23px;height:23px;filter:brightness(2) drop-shadow(0 0 1px #fff8)}
.held{width:49px;height:24px;filter:brightness(2.3) drop-shadow(0 0 1px #fff7)}
.special img{width:26px;height:20px;filter:brightness(2.1) drop-shadow(0 0 1px #fff5)}
.special{border:0;background:#0a111bc9;padding:2px 4px;height:23px}
.specials{bottom:192px}
.effects{bottom:167px}
.room{transition:opacity .3s}
.ammo{font-size:13px}.ammo .reserve{font-size:11px;opacity:.7}
'''
style=Path('ui/style.css')
style.write_text(style.read_text(encoding='utf-8')+css,encoding='utf-8')
