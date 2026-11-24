from pathlib import Path
p=Path('ui/map-interaction.js');s=p.read_text(encoding='utf-8');s=s.replace("return {player:p,path:path.map(v=>({x:v.x+offset.x,y:v.y+offset.y}))};", "return {player:p,path:path.map(v=>({x:v.x+offset.x,y:v.y+offset.y})),gather:{x:center.x*2+offset.x,y:-center.z*2+offset.y}};")
start=s.index(' function frame(now){const phase=');end=s.index("  fitMapPlayers(players,'HCZ_EZ');",start)
s=s[:start]+" function frame(now){const players=sampleMapMovement(paths,(now-start)/1000);\n"+s[end:]
needle='moveButton.onclick=()=>{'
s=s.replace(needle,'''function sampleMapMovement(paths,seconds){
 const phase=seconds%26;
 const t=phase<8?phase/8:phase<17?1:phase<25?1-(phase-17)/8:0;
 const gatherRatio=phase<8?0:phase<11?(phase-8)/3:phase<14?1:phase<17?1-(phase-14)/3:0;
 return paths.map(({player,path,gather})=>{
  const u=t*(path.length-1),i=Math.max(0,Math.min(path.length-2,Math.floor(u))),f=t===1?1:u-Math.floor(u),a=path[i],b=path[Math.min(i+1,path.length-1)];
  const x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f;
  const dx=phase>=8&&phase<17?gather.x-path.at(-1).x:b.x-a.x,dy=phase>=8&&phase<17?gather.y-path.at(-1).y:b.y-a.y;
  return {...player,x:x+(gather.x-x)*gatherRatio,y:y+(gather.y-y)*gatherRatio,heading:Math.atan2(dy,dx)*180/Math.PI+(phase>=14&&phase<25?180:0),plane:'HCZ_EZ'};
 });
}
'''+needle);p.write_text(s,encoding='utf-8')
p=Path('ui/verify-map-review.cjs');s=p.read_text(encoding='utf-8');needle=" fs.writeFileSync(path.join(out,'map-review-check.json')";idx=s.index(needle);s=s[:idx]+''' const transitions=await run("(()=>{const paths=movementPaths();return [8,11,14,17,25,26].map(t=>{const a=sampleMapMovement(paths,t-.00001),b=sampleMapMovement(paths,t+.00001);return Math.max(...a.map((p,i)=>Math.hypot(p.x-b[i].x,p.y-b[i].y)))})})()");assert(transitions.every(d=>d<.01));
 await run("fitMapPlayers(sampleMapMovement(movementPaths(),11),'HCZ_EZ')");const singleRoomScale=await run('mapCamera.scale');
 await run("fitMapPlayers(sampleMapMovement(movementPaths(),8),'HCZ_EZ')");const twoRoomScale=await run('mapCamera.scale');assert(singleRoomScale>twoRoomScale*1.5);
'''+s[idx:];s=s.replace('continuousMovement:true','continuousMovement:true,singleRoomScale,twoRoomScale');p.write_text(s,encoding='utf-8')
