const armorSymbols={ArmorLight:'light',ArmorCombat:'combat',ArmorHeavy:'heavy'};
Object.assign(roles,{
 '0492':{name:'SCP-049-2',color:'#d72948',art:'Zombie_ProfileImage'},
 '079':{name:'SCP-079',color:'#d72948',art:'079_ProfileImage'},
 '173':{name:'SCP-173',color:'#d72948',art:'173_ProfileImage'},
 '939':{name:'SCP-939',color:'#d72948',art:'939_Icon'},
 '3114':{name:'SCP-3114',color:'#d72948',art:'3114_Icon'},
 '1507':{name:'SCP-1507',color:'#d72948',art:'1507_ProfileImage 1'}
});
const renderBeforePolish=window.updateCard;
window.updateCard=function(p){
 // Only this adapter supplies neutral layout values; 079 telemetry has no HP/HS.
 renderBeforePolish(p.role==='079'?{...p,hp:0,maxHp:1,hs:0,maxHs:0,effects:[]}:p);
 const c=cards.get(p.id);c.dataset.role=p.role;
 if(p.armor&&armorSymbols[p.armor])c.querySelector('.armor').src=`../assets/ui/armor-${armorSymbols[p.armor]}.svg`;
 if(p.id.startsWith('S'))c.querySelector('.equipment').replaceChildren();
 let vigor=c.querySelector('.vigor-readout');
 if(p.role==='106'&&!p.dead&&p.alive!==false&&p.vigor!==undefined){
  if(!vigor){vigor=document.createElement('div');vigor.className='vigor-readout';vigor.innerHTML='<img alt="体力" src="'+art('Lightning')+'"><span></span>';c.querySelector('.visual').append(vigor);}
  vigor.querySelector('span').textContent=Math.round(Number(p.vigor)||0);
 }else vigor?.remove();
 if(p.role!=='079'){c.querySelector('.generators')?.remove();c.querySelector('.xp-readout')?.remove();c.querySelector('.fill').style.removeProperty('background');if(p.id.startsWith('S')&&p.maxHs===0)c.querySelector('.hs').style.display='none';return;}
 c.classList.remove('burn','flashed');
 let generators=c.querySelector('.generators');if(!generators){generators=document.createElement('div');generators.className='generators';c.querySelector('.visual').append(generators);}
 generators.textContent=`${p.generatorsActivated??0}/3`;
 c.querySelector('.hp').textContent=Math.floor(p.energy??0);
 c.querySelector('.hs').style.display='none';
 c.querySelector('.ahp-number').style.display='block';c.querySelector('.ahp-number').textContent=`Lv.${p.level??1}`;
 c.querySelector('.fill').style.height=p.dead?'0px':'90px';
 c.querySelector('.fill').style.background=roles['079'].color;
 c.querySelector('.shield').style.height='0px';c.querySelector('.shield').style.bottom='0px';
 const xp=Math.max(0,p.levelExperience??0),required=Math.max(0,p.levelExperienceRequired??0),ratio=required>0?Math.min(1,xp/required):(p.maxLevel?1:0);
 let xpText=c.querySelector('.xp-readout');if(!xpText){xpText=document.createElement('div');xpText.className='xp-readout';c.querySelector('.numbers').append(xpText);}
 xpText.textContent=p.maxLevel?'MAX':`${Math.floor(xp)} / ${Math.floor(required)}`;

};
const scpKinds=['049','0492','079','096','106','173','939','3114','1507'];
function sampleScp(role,index=0){
 const common={id:'S0'+(index+1),name:['Phantom','Wraith','Shade'][index],role,special:[],effects:[],dead:false};
 if(role==='079')return {...common,level:3,energy:72,maxEnergy:125,generatorsActivated:1,levelExperience:120,levelExperienceRequired:250,camera:{plane:'HCZ_EZ'}};
 // Demonstration values are intentionally separate from live tournament maxima.
 const [maxHp,maxHs]=({'049':[2000,600],'0492':[400,0],'096':[2500,800],'106':[1800,700],'173':[3000,1200],'939':[2400,900],'3114':[1200,0],'1507':[150,0]})[role];
 return {...common,hp:Math.round(maxHp*.7),maxHp,hs:Math.round(maxHs*.4),maxHs,...(role==='106'?{vigor:64}:{})};
}
MZUI.showScpLineup=function(kinds){
 if(kinds.length!==3||kinds.some(k=>!scpKinds.includes(k)))throw Error('Invalid SCP lineup');
 stopDamageDemo();const next=currentSnapshot.slice(0,6).concat(kinds.map(sampleScp));
 next.forEach(updateCard);window.currentSnapshot=next;
 updateMap(state,next);return next;
};
let previewObservedId=null;
MZUI.applyScp079=function({id,level,energy,maxEnergy,camera,generatorsActivated,levelExperience,levelExperienceRequired,maxLevel}){
 if(!Number.isInteger(level)||level<1||!Number.isFinite(energy)||energy<0||!(maxEnergy>0)||energy>maxEnergy)throw Error('Invalid SCP-079 state');
 const p=currentSnapshot.find(p=>p.id===id);if(!p||p.role!=='079')throw Error('Not an SCP-079 slot');
 const activated=generatorsActivated??p.generatorsActivated??0;
 if(!Number.isInteger(activated)||activated<0||activated>3)throw Error('Invalid generator count');
 const xp=levelExperience??p.levelExperience??0,required=levelExperienceRequired??p.levelExperienceRequired??0;
 if(!Number.isFinite(xp)||xp<0||!Number.isFinite(required)||required<0)throw Error('Invalid experience');
 const next={...p,level,energy,maxEnergy,camera:camera??p.camera,generatorsActivated:activated,levelExperience:xp,levelExperienceRequired:required,maxLevel:maxLevel??p.maxLevel};window.currentSnapshot=currentSnapshot.map(p=>p.id===id?next:p);updateCard(next);
 if(previewObservedId===id&&camera?.plane!==document.getElementById('radar').dataset.plane)MZUI.previewObservedPlayer(id);
};
MZUI.previewObservedPlayer=function(id){
 const p=currentSnapshot.find(p=>p.id===id);if(!p)throw Error('Unknown observed player');
 previewObservedId=id;
 const plane=p.role==='079'?p.camera?.plane:p.plane;
 if(!plane)throw Error('Observed floor unavailable');
 window.mapSurfaceOverview=plane==='Surface';
 if(plane==='Surface')return previewMapPlane('HCZ_EZ');
 return previewMapPlane(plane);
};
const lineup=document.createElement('select');lineup.id='scp-lineup';lineup.title='SCP 角色组';
[['049','096','106'],['173','939','0492'],['079','3114','1507']].forEach(k=>{const option=new Option(k.map(s=>roles[s].name).join(' / '),k.join(','));lineup.add(option);});
lineup.onchange=()=>MZUI.showScpLineup(lineup.value.split(','));
const galleryButton=document.createElement('button');galleryButton.textContent='全部 SCP／特效';galleryButton.id='scp-gallery-button';
const cameraButton=document.createElement('button');cameraButton.textContent='079 摄像头跨层';cameraButton.id='camera-demo';
document.getElementById('motion').before(lineup,galleryButton,cameraButton);
let cameraDemoTimeout;
cameraButton.onclick=()=>{
 clearTimeout(cameraDemoTimeout);stopDamageDemo();stopFloorDemo();if(playTimer){clearInterval(playTimer);playTimer=null;$('#motion').textContent='播放状态变化';}
 MZUI.showScpLineup(['079','3114','939']);MZUI.previewObservedPlayer('S01');
 cameraDemoTimeout=setTimeout(()=>{MZUI.applyScp079({id:'S01',level:3,energy:61,maxEnergy:125,camera:{plane:'LCZ'}});MZUI.previewObservedPlayer('S01');},1200);
};
const gallery=document.createElement('section');gallery.id='scp-gallery';gallery.hidden=true;document.body.append(gallery);
window.showScpGallery=function(){
 const saved=currentSnapshot;gallery.replaceChildren();
 const header=document.createElement('header');header.innerHTML='<strong>SCP 全角色与状态预览</strong><span>使用同一套人物卡渲染 · 1507 为活动角色示例 · 数值为布局演示</span>';
 const back=document.createElement('button');back.textContent='返回观战预览';back.onclick=()=>{gallery.hidden=true;document.body.classList.remove('gallery-open');};header.append(back);gallery.append(header);
 const grid=document.createElement('div');grid.className='scp-grid';gallery.append(grid);
 for(const mode of ['normal','burn','flashed']){
   for(const role of scpKinds){
     const cell=document.createElement('div');cell.className='scp-cell';
     const label=document.createElement('div');label.className='scp-label';label.textContent=roles[role].name;cell.append(label);
     const p=sampleScp(role);p.effects=mode==='normal'||role==='079'?[]:[mode];updateCard(p);
     const copy=cards.get('S01').cloneNode(true);copy.classList.remove('spawning');copy.classList.add('static');copy.removeAttribute('data-id');copy.removeAttribute('data-observed');cell.append(copy);
     const caption=document.createElement('div');caption.className='scp-caption';caption.textContent=role==='079'&&mode!=='normal'?'079 不适用此效果':({normal:'正常',burn:'灼伤',flashed:'闪白'})[mode];cell.append(caption);grid.append(cell);
   }
 }
 saved.forEach(updateCard);gallery.hidden=false;document.body.classList.add('gallery-open');
};
galleryButton.onclick=showScpGallery;
currentSnapshot.forEach(updateCard);
