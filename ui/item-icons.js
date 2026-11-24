// Resolve every supported in-game ItemType to the same icon used in the item review.
function itemIconSource(name,color){
 const key=MZ_ITEM_ALIASES[name]||name,entry=MZ_ITEMS[key];
 if(!entry)return null;
 if(entry.card){
  const tint=/^#[0-9a-f]{6}$/i.test(color||'')?color:entry.color;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 34"><path fill="#fff" d="M4 1h47a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V5a4 4 0 0 1 4-4Z"/><path fill="${tint}" d="M44 1h7a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4h-7Z"/><rect x="7" y="7" width="13" height="5" rx="2" fill="#17202b"/><path stroke="#17202b" stroke-width="3" d="M7 21h24M7 27h16"/></svg>`;
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
 }
 const path='items/'+key+'.svg';return window.MZ_ASSETS?.[path]||'../assets/'+path;
}
const itemRenderPrevious=window.updateCard;
const specialWeaponTypes=['MicroHID','Jailbird','ParticleDisruptor','GunSCP127'];
const specialItemTypes=['SCP268','SCP500','SCP1344','SCP2176'];
function specialInventoryRows(p){
 const counts=new Map(),allowed=[...specialWeaponTypes,...specialItemTypes];
 function add(name,count){const key=MZ_ITEM_ALIASES[name]||name;if(!allowed.includes(key))return;const n=Math.max(0,Math.floor(Number(count)||0));counts.set(key,(counts.get(key)||0)+n);}
 if(Array.isArray(p.inventory)){
  for(const entry of p.inventory)add(typeof entry==='string'?entry:entry.type,typeof entry==='string'?1:entry.count??1);
 }else{
  // Compatibility with the preview's older [item, label] fixtures.
  for(const [name,label] of p.special||[]){const match=String(label??'').match(/^[x×]\s*(\d+)$/i);add(name,typeof label==='number'?label:match?Number(match[1]):1);}
 }
 return [specialWeaponTypes,specialItemTypes].map(types=>types.flatMap(type=>Array.from({length:counts.get(type)||0},()=>type)));
}
function renderSpecialInventory(c,p){
 const host=c.querySelector('.specials');host.replaceChildren();
 if(p.dead)return;
 specialInventoryRows(p).forEach((items,index)=>{
  if(!items.length)return;
  const row=document.createElement('div');row.className='special-row '+(index===0?'special-weapons':'special-items');if(index===0&&items.length>3)row.classList.add('wrap-weapons');
  for(const type of items){const slot=document.createElement('div');slot.className='special';const img=new Image();img.alt=type;img.src=itemIconSource(type);img.className='item-white';slot.append(img);row.append(slot);}
  host.append(row);
 });
}
window.updateCard=function(p){
 itemRenderPrevious({...p,special:[]});
 if(p.id.startsWith('S'))return;
 const c=cards.get(p.id),held=c.querySelector('.held'),key=MZ_ITEM_ALIASES[p.held]||p.held,entry=MZ_ITEMS[key];
 renderSpecialInventory(c,p);
 if(held){
  const src=p.dead?null:itemIconSource(p.held,p.heldColor);
  held.className='held item-white'+(entry?.wide?' item-wide':'')+(entry?.card?' item-keycard':'');
  held.style.removeProperty('--weapon-angle');held.style.visibility=src?'visible':'hidden';
  if(src)held.src=src;else held.removeAttribute('src');
 }
 for(const im of c.querySelectorAll('.special img,.status-item')){
  const status=im.classList.contains('status-item');
  const name=status?({'cola-speed':'SCP207','anti-cola':'AntiSCP207','scp1853':'SCP1853'}[im.dataset.status]):im.alt;
  const src=status?'../assets/status/'+name+'.svg':itemIconSource(name);if(src){im.src=src;im.classList.toggle('item-white',!status);}
 }
};
MZUI.previewHeldItem=function(item,color){
 if(!MZ_ITEMS[item])throw Error('Unknown item type');
 const next=currentSnapshot.map((p,i)=>i===0?{...p,dead:false,hp:100,held:item,heldColor:color,ammo:item.startsWith('Gun')?24:item==='ParticleDisruptor'?5:item==='MicroHID'?'62%':null,magazineCapacity:item.startsWith('Gun')?30:item==='ParticleDisruptor'?5:null}:p);
 MZUI.applyPlayers(next);
};
const itemButton=document.createElement('button');itemButton.id='item-gallery-button';itemButton.textContent='全部物品图标';document.getElementById('background').before(itemButton);
function showItemGallery(){
 document.getElementById('item-gallery')?.remove();
 const panel=document.createElement('section');panel.id='item-gallery';
 panel.innerHTML='<header><strong>物品图标 · 实际显示尺寸</strong><span>点击物品可放入 Alpha 的手持栏；标签仅用于此预览目录。</span><button class="close">关闭</button></header><div class="item-grid"></div>';
 for(const [key,entry] of Object.entries(MZ_ITEMS)){
  const b=document.createElement('button');b.className='item-example';
  const im=new Image();im.src=itemIconSource(key);im.className='item-white '+(entry.wide?'item-wide':entry.card?'item-keycard':'');im.alt=key;
  const slot=document.createElement('span');slot.className='catalog-icon';slot.append(im);
  const label=document.createElement('span');label.textContent=key;b.append(slot,label);
  b.onclick=()=>{panel.remove();MZUI.previewHeldItem(key)};panel.querySelector('.item-grid').append(b);
 }
 panel.querySelector('.close').onclick=()=>panel.remove();document.body.append(panel);return panel;
}
itemButton.onclick=showItemGallery;
addEventListener('keydown',e=>{if(e.key==='Escape')document.getElementById('item-gallery')?.remove()});
currentSnapshot.forEach(updateCard);
