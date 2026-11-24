from pathlib import Path
p=Path('ui/verify-render.cjs');s=p.read_text(encoding='utf-8').replace('assert.equal(extraLayout.a.right,extraLayout.s.right);assert(extraLayout.a.bottom<extraLayout.s.y);','assert.equal(extraLayout.a.y,extraLayout.s.y);assert(extraLayout.a.right<extraLayout.s.x);').replace("'rgb(98, 255, 0)'", "'rgb(141, 206, 100)'");p.write_text(s,encoding='utf-8')
p=Path('ui/verify-standalone.cjs');s=p.read_text(encoding='utf-8-sig').replace('SCP1576','SCP2176').replace('inventory1576:true','inventory2176:true');needle=' assert.equal(await run("mapCamera.mapSign"),-1);';addition=''' await run("MZUI.applyPlayers(currentSnapshot.map(p=>p.id==='H01'?{...p,inventory:[{type:'SCP1576',count:1}],special:[['SCP1576','1576']]}:p))");
 assert.equal(await run("[...document.querySelectorAll('[data-id=H01] .special img')].some(e=>e.alt==='SCP1576')"),false);
 for(const n of [1,2,3,0]){
  await run(`MZUI.applyPlayers(currentSnapshot.map(p=>p.id==='H01'?{...p,colaSpeed:n>0,colaStacks:n}:p))`.replace('n>0',String(n>0)).replace('colaStacks:n','colaStacks:'+n));
  assert.equal(await run("document.querySelector('[data-id=H01] .status-count')?.textContent??''"),n>1?'×'+n:'');
  assert.equal(await run("document.querySelectorAll('[data-id=H01] [data-status=cola-speed]').length"),n>0?1:0);
 }
 await run("MZUI.showScpLineup(['079','939','3114'])");
 const xpLayout=await run("(()=>{const c=document.querySelector('[data-id=S01]'),r=s=>c.querySelector(s).getBoundingClientRect();return {hpBottom:r('.hp').bottom,xpTop:r('.xp-readout').top,inNumberColumn:!!c.querySelector('.numbers .xp-readout'),barHeight:r('.xp-track').height,genFont:getComputedStyle(c.querySelector('.generators')).fontSize,levelFont:getComputedStyle(c.querySelector('.ahp-number')).fontSize}})()");
 assert(xpLayout.xpTop>xpLayout.hpBottom);assert(xpLayout.inNumberColumn);assert.equal(xpLayout.barHeight,10);assert.equal(xpLayout.genFont,'21px');assert.equal(xpLayout.levelFont,'20px');
''';s=s.replace(needle,addition+needle);s=s.replace('inventory2176:true,','inventory2176:true,excluded1576:true,colaStacks:[1,2,3,0],xpBelowEnergy:true,xpBarHeight:10,');p.write_text(s,encoding='utf-8')
p=Path('预览说明.md');s=p.read_text(encoding='utf-8');s=s.replace('AHP、HS 数字改为靠右的固定上下两行，HP 固定在下方。','AHP、HS 数字改为靠右的固定同一行、左 AHP 右 HS，HP 固定在下方。');s=s.replace('- 1576 的物品类型是 SCP1576；inventory 中的持有数量会汇总为色块上方特殊物品提示，不要求正在手持。库存移除或死亡后清除，数量大于 1 显示 ×N。','- 鬼灯 SCP2176 的 inventory 持有数量汇总到色块上方，不要求手持；阴间通话器 SCP1576 不进入特殊持有提示，但手持栏仍正常显示。库存移除或死亡后清除，数量大于 1 显示 ×N。')
s+='''\n本次修订：AHP 色块按用户要求降低饱和度为 #8DCE64，数字用 #A9DD8A；原版 #62FF00 仅作为取色来源保留，不再声称预览显示完全原色。AHP/HS 同一高度，固定两列，任意一个消失不使另一个移位，也不跟随色块高度移动。207 通过 colaStacks 接收实际效果叠层，2 层以上显示 ×N，失效后清空，不根据背包里可乐瓶数量推断。场景 6 展示 ×2、×3。079 经验数字移到电量正下方，底部只保留 10 px 厚白色经验条；电板 21 px、等级 20 px。原版电脑图向左调整，完整露出屏幕并保留更多键盘主体。\n''';p.write_text(s,encoding='utf-8')
