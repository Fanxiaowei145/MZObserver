from pathlib import Path
# HCZ/EZ rotates world coordinates and glyph heading together; labels stay upright.
p=Path('ui/app.js');s=p.read_text();s=s.replace('const {scale,tx,ty,waitMs}=cameraController.update(relevant,plane);',"const mapSign=plane==='HCZ_EZ'?-1:1;\n const projected=relevant.map(p=>({...p,x:p.x*mapSign,y:p.y*mapSign}));\n const {scale,tx,ty,waitMs}=cameraController.update(projected,plane);")
s=s.replace('scale(${scale})`;','scale(${scale*mapSign})`;')
s=s.replace('${p.x*scale+tx-11}px,${p.y*scale+ty-11}', '${p.x*mapSign*scale+tx-11}px,${p.y*mapSign*scale+ty-11}')
s=s.replace('${p.heading??[35,150,270,45,180,80,225,310,90][i]}deg','${(p.heading??[35,150,270,45,180,80,225,310,90][i])+(mapSign<0?180:0)}deg')
s=s.replace('window.mapCamera={scale,tx,ty,visibleIds:', 'window.mapCamera={scale,tx,ty,mapSign,visibleIds:');p.write_text(s)
p=Path('ui/map-preview.js');s=p.read_text().replace('const {scale,tx,ty}=mapCamera;','const {scale,tx,ty,mapSign=1}=mapCamera;').replace('+e.dataset.x*scale+tx+8*e.dataset.dx','+e.dataset.x*mapSign*scale+tx+8*e.dataset.dx*mapSign').replace('+e.dataset.y*scale+ty+10*e.dataset.dy','+e.dataset.y*mapSign*scale+ty+10*e.dataset.dy*mapSign');p.write_text(s)
# 079 telemetry: independent energy, activated generators, level progress.
p=Path('ui/scp-showcase.js');s=p.read_text();s=s.replace("art:'scp_939_v2'","art:'939_Icon'")
s=s.replace("if(p.role!=='079'){c.querySelector('.fill')", "if(p.role!=='079'){c.querySelector('.generators')?.remove();c.querySelector('.fill')")
a=s.index(" c.querySelector('.hp').textContent=`${p.generatorsActivated");b=s.index(" c.querySelector('.fill').style.height",a)
s=s[:a]+''' let generators=c.querySelector('.generators');if(!generators){generators=document.createElement('div');generators.className='generators';c.querySelector('.visual').append(generators);}
 generators.textContent=`${p.generatorsActivated??0}/3`;
 c.querySelector('.hp').textContent=Math.floor(p.energy??0);
 c.querySelector('.hs').style.display='none';
 c.querySelector('.ahp-number').style.display='block';c.querySelector('.ahp-number').textContent=`Lv.${p.level??1}`;
'''+s[b:]
s=s.replace('c.querySelector(\'.equipment\').innerHTML=p.dead?\'\':`<img class="vigor-icon" src="${art(\'Lightning\')}" alt="电量">`;', '''const xp=Math.max(0,p.levelExperience??0),required=Math.max(0,p.levelExperienceRequired??0),ratio=required>0?Math.min(1,xp/required):(p.maxLevel?1:0);
 c.querySelector('.equipment').innerHTML=p.dead?'':`<div class="xp-readout">${p.maxLevel?'MAX':`${Math.floor(xp)} / ${Math.floor(required)}`}</div><div class="xp-track"><i style="width:${ratio*100}%"></i></div>`;''')
s=s.replace('generatorsActivated:1,camera:', 'generatorsActivated:1,levelExperience:120,levelExperienceRequired:250,camera:')
s=s.replace('camera,generatorsActivated})','camera,generatorsActivated,levelExperience,levelExperienceRequired,maxLevel})')
s=s.replace('const next={...p,level,energy,maxEnergy,camera,generatorsActivated:activated};', '''const xp=levelExperience??p.levelExperience??0,required=levelExperienceRequired??p.levelExperienceRequired??0;
 if(!Number.isFinite(xp)||xp<0||!Number.isFinite(required)||required<0)throw Error('Invalid experience');
 const next={...p,level,energy,maxEnergy,camera:camera??p.camera,generatorsActivated:activated,levelExperience:xp,levelExperienceRequired:required,maxLevel:maxLevel??p.maxLevel};''')
p.write_text(s)
# Preserve existing inventory list, add 1576 derived from actual supplied inventory count.
p=Path('ui/item-icons.js');s=p.read_text(encoding='utf-8-sig');s=s.replace(' itemRenderPrevious(p);', ''' if(!p.id.startsWith('S')){
  const inventory=p.inventory||[],count=inventory.reduce((n,i)=>n+(typeof i==='string'?(i==='SCP1576'?1:0):(i.type==='SCP1576'?(i.count??1):0)),0);
  let special=p.special||[];
  if(p.inventory!==undefined)special=special.filter(([name])=>name!=='SCP1576');
  if(count>0)special=[...special,['SCP1576',count>1?'×'+count:'']];
  p={...p,special};
 }
 itemRenderPrevious(p);''');p.write_text(s,encoding='utf8')
p=Path('ui/app.js');s=p.read_text().replace("special:[['SCP500','×2']]", "special:[['SCP500','×2']],inventory:[{type:'SCP1576',count:1}]");p.write_text(s)
p=Path('ui/final-layout.css');s=p.read_text();s+='''
/* Native 939 bust: head and chest, no body rotation or inherited full-body polygon. */
.portrait[data-art="939_Icon"]{width:90px;height:126px;mask-image:linear-gradient(to right,#000 0 80%,transparent 99%)}
.portrait[data-art="939_Icon"] img{width:118px;left:-13px;top:8px;clip-path:none;transform:scaleX(-1);transform-origin:center;filter:url(#portrait-alpha-clean)}
.card.flashed .portrait[data-art="939_Icon"] img{filter:url(#portrait-alpha-clean) brightness(0) invert(1)}
.card[data-role="079"] .generators{position:absolute;left:6px;top:8px;font-weight:800;font-size:17px;line-height:20px;text-shadow:0 1px 3px #000}
.card[data-role="079"].dead .generators{visibility:hidden}
.card[data-role="079"] .secondary-values{bottom:78px}
.card[data-role="079"] .equipment{display:flex;flex-direction:column;justify-content:center;gap:3px;padding:2px 6px}
.xp-readout{font-size:10px;line-height:11px;color:white;font-variant-numeric:tabular-nums}
.xp-track{height:5px;width:100%;background:#ffffff25;overflow:hidden}.xp-track i{display:block;height:100%;background:white;transition:width .2s ease-out}
''';p.write_text(s)
p=Path('ui/index.html');s=p.read_text();s=s.replace('<body>', '<body><svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="portrait-alpha-clean" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="linear" slope="2" intercept="-0.5"/></feComponentTransfer></filter></defs></svg>');p.write_text(s)
