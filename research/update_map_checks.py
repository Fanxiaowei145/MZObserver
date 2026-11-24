from pathlib import Path
p=Path('ui/verify-render.cjs');s=p.read_text(encoding='utf-8');s=s.replace("const closeScale=await run('mapCamera.scale');assert(closeScale>wideScale);", "const closeScale=await run('mapCamera.scale');assert.equal(closeScale,wideScale);await run('MZUI.setMapZoom(true)');assert((await run('mapCamera.scale'))>wideScale);await run('MZUI.setMapZoom(false)');")
s=s.replace("assert.equal(await run(\"getComputedStyle(document.querySelector('.marker'),'::before').width\"),'7px');", "assert(Math.abs(parseFloat(await run(\"getComputedStyle(document.querySelector('.marker'),'::before').width\"))-4.2)<.03);")
s=s.replace('width:390,height:370','width:490,height:460');p.write_text(s,encoding='utf-8')
p=Path('ui/app.js');s=p.read_text(encoding='utf-8').replace("stage.style.top='0px';}", "stage.style.top='0px';stage.style.setProperty('--map-number-font',Math.max(8,7/scale)+'px');}");p.write_text(s,encoding='utf-8')
p=Path('ui/final-layout.css');s=p.read_text(encoding='utf-8')+'\n.marker span{font-size:var(--map-number-font,8px)}\n';p.write_text(s,encoding='utf-8')
