// Number the screen positions, independently of moving card nodes or actor IDs.
(()=>{
 const groups=[['humans',1],['scps',7]];
 const layers=new Map();
 for(const [id,start] of groups){const layer=document.createElement('div');layer.className='position-shortcuts '+id;layer.setAttribute('aria-hidden','true');document.getElementById('stage').append(layer);layers.set(id,layer);}
 function sync(){if(document.getElementById('stage').hidden)return;for(const [id,start] of groups){const layer=layers.get(id),nodes=[...document.getElementById(id).children];
  nodes.forEach((card,i)=>{let slot=layer.children[i];if(!slot){slot=document.createElement('div');slot.className='position-slot';const label=document.createElement('span');label.className='position-number';slot.append(label);layer.append(slot);}
   const number=start+i,placeholder=card.querySelector('.shortcut-number'),row=card.querySelector('.name-row');
   if(placeholder){placeholder.textContent=number;placeholder.hidden=false;}
   card.dataset.shortcutNumber=number;const marker=document.querySelector('.marker[data-id="'+card.dataset.id+'"]');if(marker){marker.querySelector('span').textContent=number;marker.setAttribute('aria-label',(marker.classList.contains('camera-marker')?'SCP-079 摄像头 ':'玩家 ')+number);}slot.style.width=card.offsetWidth+'px';slot.style.height=card.offsetHeight+'px';
   const badge=slot.firstChild;badge.textContent=number;badge.style.top=(row.offsetTop+(row.offsetHeight-19)/2)+'px';badge.style.opacity=card.classList.contains('dead')?'.35':'1';
  });
 }}
 const update=updateCard;updateCard=function(p){update(p);sync();};
 const reorder=MZUI.applyWaveOrder;MZUI.applyWaveOrder=function(s){const result=reorder(s);sync();return result;};
 const authorize=MZUI.setAuthorized;MZUI.setAuthorized=function(...args){const value=authorize(...args);sync();return value;};
 window.MZPositionShortcuts={sync};sync();
})();
