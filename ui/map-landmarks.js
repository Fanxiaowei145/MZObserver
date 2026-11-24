// Match by room identity; colors follow native room silhouettes and rotations.
window.MZ_LANDMARKS=(()=>{
 const specs=[
  {kind:'elevator-a',names:['HczCheckpointA','LczCheckpointA'],pattern:/(?:HCZ|LCZ)_ChkpA(?:\b|_)/i,label:'A',elevator:true},
  {kind:'elevator-b',names:['HczCheckpointB','LczCheckpointB'],pattern:/(?:HCZ|LCZ)_ChkpB(?:\b|_)/i,label:'B',elevator:true},
  {kind:'scp079',names:['Hcz079'],pattern:/HCZ_079(?:\b|_)/i,label:'079',color:'#9b88b4'},
  {kind:'micro',names:['HczMicroHID'],pattern:/HCZ_MicroHID(?:\b|_)/i,label:'电磁炮',color:'#ded7c2'},
  {kind:'gate-a',names:['EzGateA'],pattern:/EZ_GateA(?:\b|_)/i,label:'A 大门',color:'#649377'},
  {kind:'gate-b',names:['EzGateB'],pattern:/EZ_GateB(?:\b|_)/i,label:'B 大门',color:'#5d91c4'},
  {kind:'tesla',names:['HczTesla'],pattern:/HCZ_Tesla(?:\b|_)/i,label:'特斯拉',color:'#d8c87d'},
  {kind:'armory',names:['LczArmory'],pattern:/LCZ_Armory(?:\b|_)/i,label:'轻收容武器库',color:'#b78494'},
  {kind:'scp914',names:['Lcz914'],pattern:/LCZ_914(?:\b|_)/i,label:'914',color:'#c98f72'},
  {kind:'gr18',names:['LczGlassroom'],pattern:/LCZ_(?:372|GR18)(?:\b|_)/i,label:'GR18'}
 ];
 const classify=r=>specs.find(s=>s.names.includes(r.name)||s.pattern.test(r.prefab||''));
 function anchors(rooms){return rooms.flatMap(r=>{
  const s=classify(r);if(!s?.elevator)return [];
  const custom=r.mapAnchors?.[s.kind],a=(r.yaw_degrees||0)*Math.PI/180;
  const localX=custom?.localX??15,localY=custom?.localY??0,na=a+(custom?.normalAngle??0)*Math.PI/180;
  return [{...s,roomId:r.room_id,x:r.x*2+Math.cos(a)*localX-Math.sin(a)*localY,y:-r.z*2+Math.sin(a)*localX+Math.cos(a)*localY,dx:Math.cos(na),dy:Math.sin(na)}];
 });}
 function project(a,camera){const sign=camera.mapSign??1,m=camera.matrix;if(m){const k=Math.hypot(m.a,m.b)||1;return {x:m.a*a.x+m.c*a.y+m.e,y:m.b*a.x+m.d*a.y+m.f,dx:(m.a*a.dx+m.c*a.dy)/k,dy:(m.b*a.dx+m.d*a.dy)/k};}return {x:a.x*sign*camera.scale+camera.tx,y:a.y*sign*camera.scale+camera.ty,dx:a.dx*sign,dy:a.dy*sign};}
 function installColorFilters(){
  if(document.getElementById('room-color-definitions'))return;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='room-color-definitions';svg.setAttribute('width','0');svg.setAttribute('height','0');svg.style.position='absolute';svg.setAttribute('aria-hidden','true');
  svg.innerHTML='<defs>'+specs.filter(s=>s.color).map(s=>`<filter id="room-color-${s.kind}" color-interpolation-filters="sRGB"><feFlood flood-color="${s.color}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`).join('')+'</defs>';document.body.append(svg);
 }
 return {anchors,project,classify,installColorFilters,palette:specs.filter(s=>s.color)};
})();
