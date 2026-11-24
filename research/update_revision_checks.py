from pathlib import Path
p=Path('ui/final-layout.css');s=p.read_text().replace('.secondary-values{bottom:78px}', '.secondary-values{bottom:62px}');p.write_text(s)
p=Path('ui/verify-render.cjs');s=p.read_text().replace(".hp').textContent\"),'1/3'",".generators').textContent\"),'1/3'").replace(".hs span').textContent\"),'72'",".hp').textContent\"),'72'").replace(".hs span').textContent\"),'56'",".hp').textContent\"),'56'");p.write_text(s)
p=Path('ui/verify-standalone.cjs');s=p.read_text(encoding='utf-8-sig').replace(".hp').textContent\"),n+'/3'", ".generators').textContent\"),n+'/3'")
s=s.replace('generatorsActivated:${n},camera:', 'generatorsActivated:${n},levelExperience:${n*50},levelExperienceRequired:150,camera:')
s=s.replace("await run(\"setScene(1);MZUI.previewHeldItem('KeycardScientist');document.body.classList.add('export')\");", '''await run("MZUI.applyScp079({id:'S01',level:4,energy:90,maxEnergy:150,levelExperience:75,levelExperienceRequired:150})");await sleep(250);
 assert.equal(await run("document.querySelector('[data-id=S01] .hp').textContent"),'90');
 assert.equal(await run("document.querySelector('[data-id=S01] .xp-track i').style.width"),'50%');
 await run("setScene(1);MZUI.applyPlayers(currentSnapshot.map(p=>p.id==='H01'?{...p,inventory:[{type:'SCP1576',count:3}]}:p))");
 assert.equal(await run("[...document.querySelectorAll('[data-id=H01] .special')].find(e=>e.querySelector('img').alt==='SCP1576').textContent"),'×3');
 await run("MZUI.applyPlayers(currentSnapshot.map(p=>p.id==='H01'?{...p,inventory:[]}:p))");
 assert.equal(await run("[...document.querySelectorAll('[data-id=H01] .special img')].some(e=>e.alt==='SCP1576')"),false);
 assert.equal(await run("mapCamera.mapSign"),-1);
 assert((await run("world.style.transform")).includes('scale(-'));
 await run("previewMapPlane('LCZ',{animate:false})");assert.equal(await run('mapCamera.mapSign'),1);assert(!(await run('world.style.transform')).includes('scale(-'));
 await run("setScene(1);MZUI.previewHeldItem('KeycardScientist');document.body.classList.add('export')");''')
s=s.replace('deadHandsEmpty:true','deadHandsEmpty:true,xpRatio:0.5,inventory1576:true,hczRotated180:true,lczUnrotated:true');p.write_text(s)
p=Path('ui/layout-review.cjs');s=p.read_text(encoding='utf-8-sig').replace("await run('setScene(6)');","await run('setScene(6)');");p.write_text(s)
