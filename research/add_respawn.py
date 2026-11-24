from pathlib import Path
p=Path('ui/app.js');s=p.read_text(encoding='utf-8')
s=s.replace("const art=n=>`../assets/official/${n}.${n==='ArmorNone'?'svg':'png'}`;", "const art=n=>`../assets/official/${n}.png`;")
s=s.replace('const snapshots={','const snapshots={\n 4:{H05:{hp:100,dead:false,held:\'E11SR\',ammo:30,magazineCapacity:30,special:[]},S03:{vigor:66}},')
s=s.replace("function updateCard(p){const c=cards.get(p.id),r=roles[p.role],scp=p.id[0]==='S';", "function updateCard(p){const c=cards.get(p.id),r=roles[p.role],scp=p.id[0]==='S';const respawning=c.classList.contains('dead')&&!p.dead&&p.hp>0;")
s=s.replace("c.style.setProperty('--color',r.color);", "if(respawning){c.classList.add('spawning');clearTimeout(c.respawnTimer);c.respawnTimer=setTimeout(()=>c.classList.remove('spawning'),450);}c.style.setProperty('--color',r.color);")
s=s.replace('<span class="vigor-label">VIGOR</span>', '<img class="vigor-icon" src="${art(\'Lightning\')}" alt="">')
s=s.replace('state===3?1:state+1','state===4?1:state+1')
s=s.replace("['1','2','3'].includes(e.key)","['1','2','3','4'].includes(e.key)")
p.write_text(s,encoding='utf-8')
p=Path('ui/index.html');s=p.read_text(encoding='utf-8').replace('<button id="motion">','<button data-scene="4">4 波次刷新</button><button id="motion">');p.write_text(s,encoding='utf-8')
p=Path('ui/style.css');s=p.read_text(encoding='utf-8')+'''
/* Source: installed game Vigor Slider/Fill Image color (0, .68493217, .99056602, 1). */
.vigor i{background:#00affd}.vigor{background:#00affd26}
.vigor-value{color:#00affd;font-size:11px;margin-left:5px}
.vigor-icon{width:12px;height:16px;margin-right:7px;object-fit:contain;filter:brightness(0) saturate(100%) invert(51%) sepia(99%) saturate(1727%) hue-rotate(163deg) brightness(99%) contrast(103%)}
.card.spawning .visual{animation:respawn .42s ease-out both}
.card.spawning .portrait{transition:opacity .42s ease-out,filter .42s ease-out}
@keyframes respawn{from{opacity:.27}to{opacity:1}}
''';p.write_text(s,encoding='utf-8')
