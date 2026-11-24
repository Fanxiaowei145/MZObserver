from pathlib import Path
p=Path('ui/index.html');s=p.read_text(encoding='utf-8').replace('<span class="divider"></span>', '<div class="wave-clock"><span class="wave-caption">刷新</span><span id="wave-time">00:42</span></div>');s=s.replace('<script src="app.js"></script>','<script src="app.js"></script><script src="wave-clock.js"></script>');p.write_text(s,encoding='utf-8')
p=Path('ui/style.css');s=p.read_text(encoding='utf-8')+'''
#score{display:grid;grid-template-columns:64px 70px 96px 70px 64px;justify-content:center;justify-items:center}
.wave-clock{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}
.wave-caption{font-size:10px;color:#aebccd;letter-spacing:2px}
#wave-time{font:700 27px/30px Arial,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:1px}
''';p.write_text(s,encoding='utf-8')
p=Path('ui/app.js');s=p.read_text(encoding='utf-8');s=s.replace("if(respawning){c.classList.add('spawning');clearTimeout(c.respawnTimer);c.respawnTimer=setTimeout(()=>c.classList.remove('spawning'),450);}","if(respawning){c.respawnUntil=performance.now()+450;clearTimeout(c.respawnTimer);c.respawnTimer=setTimeout(()=>c.classList.remove('spawning'),450);}if((c.respawnUntil||0)>performance.now())c.classList.add('spawning');")
p.write_text(s,encoding='utf-8')
