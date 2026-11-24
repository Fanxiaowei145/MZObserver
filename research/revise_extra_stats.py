from pathlib import Path
p=Path('ui/item-icons.js');s=p.read_text(encoding='utf-8');s=s.replace("i==='SCP1576'", "i==='SCP2176'").replace("i.type==='SCP1576'", "i.type==='SCP2176'").replace('let special=p.special||[];', "let special=(p.special||[]).filter(([name])=>name!=='SCP1576');").replace("if(p.inventory!==undefined)special=special.filter(([name])=>name!=='SCP1576');", "if(p.inventory!==undefined)special=special.filter(([name])=>name!=='SCP2176');").replace("special=[...special,['SCP1576',", "special=[...special,['SCP2176',");p.write_text(s,encoding='utf-8')
p=Path('ui/app.js');s=p.read_text(encoding='utf-8').replace("inventory:[{type:'SCP1576',count:1}]", "inventory:[{type:'SCP2176',count:1}]");p.write_text(s,encoding='utf-8')
p=Path('ui/extra-health.js');s=p.read_text(encoding='utf-8');s=s.replace("for(const [active,key,icon,label] of [[p.colaSpeed,", "const colaStacks=Math.max(0,Math.floor(Number(p.colaStacks??(p.colaSpeed?1:0))||0));\n   for(const [active,key,icon,label] of [[p.colaSpeed!==false&&colaStacks>0,")
s=s.replace("image.alt=label;effects.append(image);", "image.alt=label;\n     const badge=document.createElement('span');badge.className='status-badge';badge.append(image);\n     if(key==='cola-speed'&&colaStacks>1){const count=document.createElement('span');count.className='status-count';count.textContent='×'+colaStacks;badge.append(count);}\n     effects.append(badge);")
s=s.replace('colaSpeed:true,ammo:20', 'colaSpeed:true,colaStacks:2,ammo:20').replace('held:null,colaSpeed:true,scp1853:true','held:null,colaSpeed:true,colaStacks:3,scp1853:true');p.write_text(s,encoding='utf-8')
p=Path('ui/scp-showcase.js');s=p.read_text(encoding='utf-8');s=s.replace("if(p.role!=='079'){c.querySelector('.generators')?.remove();", "if(p.role!=='079'){c.querySelector('.generators')?.remove();c.querySelector('.xp-readout')?.remove();")
s=s.replace('c.querySelector(\'.equipment\').innerHTML=p.dead?\'\':`<div class="xp-readout">${p.maxLevel?\'MAX\':`${Math.floor(xp)} / ${Math.floor(required)}`}</div><div class="xp-track"><i style="width:${ratio*100}%"></i></div>`;', '''let xpText=c.querySelector('.xp-readout');if(!xpText){xpText=document.createElement('div');xpText.className='xp-readout';c.querySelector('.numbers').append(xpText);}
 xpText.textContent=p.maxLevel?'MAX':`${Math.floor(xp)} / ${Math.floor(required)}`;
 c.querySelector('.equipment').innerHTML=p.dead?'':`<div class="xp-track"><i style="width:${ratio*100}%"></i></div>`;''');p.write_text(s,encoding='utf-8')
p=Path('ui/final-layout.css');s=p.read_text(encoding='utf-8');s+='''
/* Latest review: subdued AHP, fixed side-by-side extra stats, readable 079 telemetry. */
.ahp-fill{background:#8dce64}.ahp-number{color:#a9dd8a}
.secondary-values,.card.scp .secondary-values{width:70px;height:20px;bottom:46px;grid-template-columns:32px 32px;grid-template-rows:20px;column-gap:6px;row-gap:0;align-items:center}
.secondary-values .ahp-number{grid-row:1;grid-column:1;font-size:16px;line-height:20px}
.secondary-values .hs,.card.scp .secondary-values .hs{grid-row:1;grid-column:2;font-size:16px;line-height:20px}
.status-badge{display:inline-flex;align-items:center;gap:2px;height:25px}.status-count{font-size:12px;line-height:16px;font-weight:700;color:#fff;text-shadow:0 1px 3px #000;white-space:nowrap}
.card[data-role="079"] .portrait{width:84px;mask-image:linear-gradient(to right,#000 0 93%,transparent 100%)}
.card[data-role="079"] .portrait img{width:130px;left:-24px;top:-46px}
.card[data-role="079"] .generators{font-size:21px;line-height:24px;top:7px}
.card[data-role="079"] .secondary-values{bottom:83px;height:24px;grid-template-columns:70px;grid-template-rows:24px}
.card[data-role="079"] .secondary-values .ahp-number{grid-column:1;grid-row:1;font-size:20px;line-height:24px}
.card[data-role="079"] .xp-readout{position:absolute;right:0;top:36px;font-size:12px;line-height:15px;font-weight:700;white-space:nowrap;color:#fff;text-align:right}
.card[data-role="079"] .xp-track{height:10px}
''';p.write_text(s,encoding='utf-8')
