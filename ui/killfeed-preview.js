// Explicit offline fixtures; never loaded into the live HUD stream.
(()=>{
 if(new URLSearchParams(location.search).get('live')==='1')return;
 const K=window.MZKillfeed,P=(name,role)=>({name,role}),alpha=P('Alpha','scientist'),bravo=P('Bravo','ntf'),charlie=P('Charlie','ntf'),delta=P('Delta','scientist'),echo=P('Echo','ntf'),foxtrot=P('Foxtrot','guard'),phantom=P('Phantom','scp'),wraith=P('Wraith','scp'),shade=P('Shade','scp');
 const kills=[
 ['173-snap','SCP-173 · 左键掐杀','雕像面部与折颈动作'],['173-blink-snap','SCP-173 · 右键掐杀','雕像与三条速度线'],['939-claw','SCP-939 · 爪击','竖向三道爪痕'],['939-pounce','SCP-939 · 飞扑','无眼裂颚与飞扑肢体'],['049-cardiac','SCP-049 · 心脏骤停','心脏与心电波形'],['049-touch','SCP-049 · 二次触碰瞬杀','鸟嘴面具与致命触碰'],['096-slash','SCP-096 · 左键攻击','长指尖爪与细瘦手掌'],['096-charge','SCP-096 · 右键冲刺','无表情身形与冲刺轨迹'],['106-decay','SCP-106 · 凋萎死亡','腐蚀液滴'],['106-pocket','SCP-106 · 口袋空间死亡','拖入口袋空间的身影'],['106-execute','SCP-106 · 末名人类瞬杀','伸手抓颈的人形轮廓'],['079-tesla','SCP-079 · 主动电网击杀','双电极与闪电']
 ];
 const assists=[
 ['939-gas','SCP-939 · 气团','效果期间及结束后 3 秒内'],['173-puddle','SCP-173 · 污池减速','效果期间及结束后 3 秒内'],['096-concussion','SCP-096 · 冲刺脑震荡','复用人物卡眩晕图形；结束后 3 秒内'],['049-cardiac','SCP-049 · 心脏骤停','效果期间及结束后 3 秒内'],['106-decay','SCP-106 · 凋萎','效果期间及结束后 3 秒内'],['079-assist','SCP-079 · 经验助攻','死亡相关的非目击经验'],['939-claw','SCP-939 · 爪击伤害','不计时，目标回满 HP 后清除'],['939-pounce','SCP-939 · 飞扑伤害','不计时，目标回满 HP 后清除'],['096-slash','SCP-096 · 左键伤害','不计时，目标回满 HP 后清除'],['item:Jailbird','人类 · 囚鸟致盲','效果期间及结束后 5 秒内'],['item:SCP1344','人类 · 1344 透视','实际被透视期间及结束后 10 秒内'],['human-flash','人类 · 闪光干扰','效果结束后保留 10 秒'],['item:GrenadeHE','人类 · 手雷伤害','使用手雷轮廓'],['human-burn','人类 · 灼伤','统一火焰，不区分造成灼伤的道具'],['item:SCP2176','人类 · 鬼灯干扰','效果期间同房间；结束后 10 秒内']
 ];
 const weapons=[['GunCOM15','COM-15'],['GunCOM18','COM-18'],['GunCom45','COM-45'],['GunRevolver','左轮'],['GunFSP9','FSP-9'],['GunCrossvec','Crossvec'],['GunE11SR','E11-SR'],['GunAK','AK'],['GunShotgun','霰弹枪'],['GunLogicer','Logicer'],['GunFRMG0','FR-MG-0'],['GunA7','A7'],['GunSCP127','SCP-127'],['MicroHID','电磁炮'],['ParticleDisruptor','分子裂解者'],['Jailbird','囚鸟'],['SCP1509','SCP-1509'],['GrenadeHE','高爆手雷'],['SCP018','SCP-018'],['SCP207','可乐自爆']];
 const event=(icon,killer=phantom,victim=alpha,as=[])=>({killer,victim,icon,assists:as});
 // Offline examples of the production attribution rules.
 const effectWindows=Object.freeze({'939-gas':3,'173-puddle':3,'096-concussion':3,'049-cardiac':3,'106-decay':3,'human-burn':10,'human-flash':10,'item:SCP2176':10,'item:Jailbird':5,'item:SCP1344':10});
 function effectAssists(icon,player,secondsSinceEnd){const limit=effectWindows[icon];return Number.isFinite(secondsSinceEnd)&&limit!==undefined&&secondsSinceEnd<=limit?[{...player,icon}]:[];}
 function ghostAssists(player,sharedRoomDuringEffect,secondsSinceEnd){return sharedRoomDuringEffect===true?effectAssists('item:SCP2176',player,secondsSinceEnd):[];}
 // Offline history simulation: only direct hits enter this ledger, never effect damage ticks.
 function createDamageHistory(){
  let hits=[];
  return {hit(icon,player,damage){if(Number.isFinite(damage)&&damage>0)hits.push({...player,icon});},
   health(hp,maxHp){if(Number.isFinite(hp)&&Number.isFinite(maxHp)&&maxHp>0&&hp>=maxHp)hits=[];},
   reset(){hits=[];},assists(){return hits.map(a=>({...a}));}};
 }
 function damageExample(healthHistory){const h=createDamageHistory();h.hit('939-claw',shade,40);healthHistory.forEach(([hp,max])=>h.health(hp,max));return h.assists();}
 // Independent end times: a later burn never extends ownership of the earlier one.
 const burnSources=Object.freeze([{player:alpha,start:0,ownEnd:8},{player:bravo,start:4,ownEnd:12}]);
 function activeBurnAssists(sources,deathTime){
  const eligible=sources.filter(b=>deathTime>=b.start&&deathTime<=b.ownEnd+10).sort((a,b)=>a.start-b.start);
  const owner=eligible.find(b=>deathTime<b.ownEnd)||eligible[0];
  return owner?[{...owner.player,icon:'human-burn'}]:[];
 }
 const burnCases=[
  ['两人灼伤 · 第 6 秒死亡',event('item:MicroHID',echo,shade,activeBurnAssists(burnSources,6)),'Alpha 的独立灼伤期限是 0–8 秒，Bravo 是 4–12 秒。第 6 秒两者均有效，只算先施加的 Alpha。'],
  ['两人灼伤 · 第 13 秒死亡',event('item:MicroHID',echo,shade,activeBurnAssists(burnSources,13)),'两人的灼伤都已结束，但仍在各自结束后 10 秒内，因此选最先施加的 Alpha。'],
  ['两人灼伤 · 第 9 秒死亡',event('item:MicroHID',echo,shade,activeBurnAssists(burnSources,9)),'Alpha 已结束 1 秒，虽然仍在 10 秒追溯窗口内，但 Bravo 仍有效，因此只显示 Bravo。']
 ];
 burnCases.push(burnCases.splice(1,1)[0]);
 const scenarios=[
 ['人类击杀',event('item:GunE11SR',bravo,phantom),'手持武器轮廓置于名字之间'],
 ['闪光助攻',event('item:GunFRMG0',charlie,wraith,[{...alpha,icon:'human-flash'}]),'Alpha 闪光结束后 8 秒，计入本次助攻'],
 burnCases[0],
 ['939 气团助攻',event('173-snap',phantom,delta,[{...wraith,icon:'939-gas'}]),'击杀者在最左边，+ 后为助攻者'],
 ['079 经验助攻',event('939-pounce',wraith,foxtrot,[{...shade,icon:'079-assist'}]),'此死亡给 Shade 发放了非目击经验'],
 ['079 目击经验不算助攻',event('049-touch',phantom,bravo),'Shade 仅获得目击经验，因此不显示'],
 ['同类攻击用于助攻',event('106-decay',shade,echo,[{...wraith,icon:'939-claw'},{...phantom,icon:'096-slash'}]),'助攻攻击复用同一图标，位置更靠左、尺寸略小'],
 ['状态助攻',event('096-slash',wraith,alpha,[{...phantom,icon:'049-cardiac'},{...shade,icon:'173-puddle'}]),'心脏骤停与污池分别归属于助攻者'],
 ['079 主动电网击杀',event('079-tesla',shade,charlie),'079 自己击杀时不重复添加自身助攻'],
 ['自杀',{suicide:true,victim:foxtrot},'单个名字与骷髅，不虚构击杀者'],
 ['助攻窗口已结束',event('item:GunA7',bravo,phantom),'Alpha 闪光效果已结束 11 秒，不显示助攻'],
 ['仅切换为观察者',null,'不生成击杀播报'],
 ['多人枪击，仅最终击杀者',event('item:GunE11SR',bravo,phantom),'Charlie 与 Echo 的普通子弹伤害不显示助攻'],
 ['污池助攻 · 3 秒内',event('096-slash',wraith,alpha,effectAssists('173-puddle',shade,2.5)),'Shade 的污池减速已消失 2.5 秒，仍显示助攻'],
 ['污池助攻 · 超时',event('096-slash',wraith,alpha,effectAssists('173-puddle',shade,3.1)),'减速已消失 3.1 秒，不再显示 Shade 的助攻'],
 ['直接伤害 · 很久以后仍有效',event('096-slash',wraith,alpha,damageExample([[60,100],[95,100]])),'Shade 爪击后已过 10 分钟，Alpha 始终没有回满 HP，仍算助攻'],
 ['直接伤害 · 回满后清除',event('096-slash',wraith,alpha,damageExample([[60,100],[100,100],[35,100]])),'Alpha 曾回满 100/100；后来再受伤，不会恢复 Shade 的旧助攻'],
 ['心脏骤停 · 效果结束 3 秒内',event('939-pounce',wraith,bravo,effectAssists('049-cardiac',phantom,3)),'心脏骤停结束恰好 3 秒，仍显示 Phantom 的助攻'],
 ['心脏骤停 · 超时且未回满血',event('939-pounce',wraith,bravo,effectAssists('049-cardiac',phantom,3.1)),'效果结束 3.1 秒，即使 Bravo 仍残血，也不保留此效果助攻'],
 ['脑震荡 · 效果结束 3 秒内',event('939-claw',wraith,foxtrot,effectAssists('096-concussion',phantom,2.5)),'脑震荡结束 2.5 秒，显示 Phantom 的助攻'],
 ['脑震荡 · 超时',event('939-claw',wraith,foxtrot,effectAssists('096-concussion',phantom,3.1)),'脑震荡结束 3.1 秒，排除该效果助攻'],
 ['手雷直接击杀',event('item:GrenadeHE',foxtrot,wraith),'保留完整手雷图标；直接炸死时放在击杀者和被击杀者之间'],
 ['鬼灯助攻 · 效果结束 10 秒内',event('item:GunE11SR',bravo,shade,ghostAssists(alpha,true,8)),'Alpha 投掷鬼灯，Shade 在效果期间同房间；结束 8 秒后死亡，显示鬼灯助攻'],
 ['鬼灯助攻 · 超时',event('item:GunE11SR',bravo,shade,ghostAssists(alpha,true,10.1)),'同房间的鬼灯效果已结束 10.1 秒，不再显示 Alpha 助攻'],
 ['鬼灯助攻 · 未同房间',event('item:GunE11SR',bravo,shade,ghostAssists(alpha,false,2)),'Shade 在鬼灯生效期间不在该房间，即使只结束 2 秒也不计助攻'],
 burnCases[1]
 ];
 scenarios.push(['囚鸟致盲助攻',event('item:GunSCP127',bravo,shade,[{...alpha,icon:'item:Jailbird'}]),'致盲结束后 5 秒内；图标放在助攻者名字左边。'],['1344 透视助攻',event('item:GunE11SR',bravo,shade,[{...alpha,icon:'item:SCP1344'}]),'按服务器实际透视目标记录；停止透视后 10 秒。'],['可乐爆炸击杀',event('item:SCP207',alpha,shade),'使用可乐图标。'],['可乐自爆',{suicide:true,victim:alpha,icon:'item:SCP207'},'自爆者仅显示一次，使用可乐图标。'],['127 击杀',event('item:GunSCP127',bravo,shade),'127 也会出现在人物卡上方的特殊武器行。']);
 let timer=null;const controls=document.getElementById('controls'),review=document.createElement('section');review.id='kf-review';review.hidden=true;review.innerHTML=`<header class="kf-review-head"><div><div class="kf-review-tag">MZ TOURNAMENT / KILLFEED STUDY</div><h1>击杀播报 · 图标与样式预览</h1><p>白色动作图标，角色色名字。点击任意图标查看实际播报组合。</p></div><div class="kf-review-actions"><button id="kf-play-all">播放全部案例</button><button id="kf-back">返回完整 HUD</button></div></header><div class="kf-preview-band"><div><b id="kf-selection">当前播报</b><small id="kf-description">这是离线模拟案例；实时模式使用服务端事件。</small></div><div id="kf-selected-row"></div></div><h2>01 / SCP 击杀方式</h2><div id="kf-kills" class="kf-grid"></div><h2>02 / 助攻来源</h2><p>每项按“＋ 图标 玩家名”排列。SCP 直接伤害：回满 HP 才清除；SCP 效果：结束后 3 秒内。</p><div id="kf-assists" class="kf-grid"></div><h2>03 / 人类武器与伤害道具</h2><p>沿用现有物品白色轮廓，枪管水平；灼伤可附加火焰标记。</p><div id="kf-weapons" class="kf-grid"></div><h2>04 / 完整播报案例</h2><div id="kf-cases" class="kf-scenarios"></div><div class="kf-note">预览停留 10 秒，末尾 0.25 秒淡出。囚鸟致盲结束后保留 5 秒，1344 实际透视结束后保留 10 秒。普通枪械伤害不显示人类助攻；A7 只计灼伤效果。SCP 直接伤害助攻不限时间，目标一旦回满 HP 就清除，之后再掉血也不会恢复旧记录。SCP 效果助攻统一到效果结束后 3 秒，持续扣血也按效果类处理。灼伤统一使用火焰图标，且同一次击杀只选一位灼伤助攻者；仍生效者优先，重叠时先施加者优先；若都已结束但都未超过 10 秒，也选最先施加者。人类状态助攻展示“效果期间及结束后 10 秒”的规则。鬼灯需在生效期间与 SCP 同房间，助攻归投掷者，保留至效果结束后 10 秒。手雷直接击杀保留手雷图标。079 仅计与该死亡关联的非目击经验。此页使用模拟数据；正式模式使用服务器事件。</div>`;document.body.append(review);
 const burnStudy=document.createElement('section');burnStudy.id='kf-burn-study';
 burnStudy.innerHTML=`<h2>两人灼伤 · 归属对照</h2><p>Alpha 在第 0 秒施加，独立持续到第 8 秒；Bravo 在第 4 秒施加，独立持续到第 12 秒。以下是两次独立推演。</p><div class="kf-burn-chart"><div class="kf-burn-axis"><span>0 秒</span><span>4 秒</span><span>8 秒</span><span>12 秒</span></div><div class="kf-burn-track"><b style="color:#f4cd50">Alpha</b><div class="kf-burn-lane"><i class="kf-burn-active burn-a">原本有效 · 0–8 秒</i><i class="kf-burn-grace">已结束 · 追溯窗口内</i></div></div><div class="kf-burn-track"><b style="color:#69b2ff">Bravo</b><div class="kf-burn-lane"><i class="kf-burn-active burn-b">原本有效 · 4–12 秒</i></div></div><div class="kf-burn-cursor"></div></div><div class="kf-burn-input"><label for="kf-burn-time">假设 SCP 死亡时间</label><input id="kf-burn-time" type="range" min="4" max="18" step="0.1" value="6"><output id="kf-burn-clock">6.0 秒</output><button id="kf-burn-six">第 6 秒：算 Alpha</button><button id="kf-burn-nine">第 9 秒：算 Bravo</button><button id="kf-burn-play">右上角依次试播</button></div><div class="kf-scenarios" id="kf-burn-examples"></div><p>按各自原本的结束时间判断；不会把 Bravo 接续的时间归给 Alpha。灰色虚线只表示追溯资格，不会挤掉仍生效的 Bravo。</p>`;
 const killHeading=document.getElementById('kf-kills').previousElementSibling;review.insertBefore(burnStudy,killHeading);
 function setBurnTime(value){const t=Number(value);document.getElementById('kf-burn-time').value=t;document.getElementById('kf-burn-clock').textContent=t.toFixed(1)+' 秒';burnStudy.style.setProperty('--burn-time',String(Math.min(t/12,1)));const owner=activeBurnAssists(burnSources,t)[0];select('第 '+t.toFixed(1)+' 秒死亡：只算 '+owner.name,event('item:MicroHID',echo,shade,[owner]),t<8?'Alpha 原本尚未结束，Bravo 不抢走归属。':t<12?'Alpha 已结束；Bravo 仍有效，优先于 Alpha 的 10 秒追溯窗口。':'两人都已结束，但均在 10 秒窗口内，选先施加的 Alpha。');}
 function showBurnStudy(){open();setBurnTime(6);review.scrollTop=Math.max(0,burnStudy.offsetTop-120);}
 function playBurn(){stop();review.hidden=true;document.body.classList.add('export');let index=0;const step=()=>{if(index===burnCases.length){stop();return;}K.clear();const [label,e]=burnCases[index++];K.add(e);status.textContent=label;};step();timer=setInterval(step,6500);}
 for(const [i,[label,e,desc]]of burnCases.entries()){const card=document.createElement('button');card.className='kf-scenario';const title=document.createElement('b');title.textContent=label;const sub=document.createElement('small');sub.textContent=desc;card.append(title,K.row(e),sub);card.onclick=()=>setBurnTime([6,9,13][i]);document.getElementById('kf-burn-examples').append(card);}
 document.getElementById('kf-burn-time').oninput=e=>setBurnTime(e.target.value);document.getElementById('kf-burn-six').onclick=()=>setBurnTime(6);document.getElementById('kf-burn-nine').onclick=()=>setBurnTime(9);document.getElementById('kf-burn-play').onclick=playBurn;
 function select(label,e,description='点击返回完整 HUD，可以查看右上角的实际位置。'){document.getElementById('kf-selection').textContent=label;document.getElementById('kf-description').textContent=description;const r=document.getElementById('kf-selected-row');r.replaceChildren();if(e)r.append(K.row(e));else r.textContent='不生成播报';K.clear();if(e)K.add(e,{pinned:true});}
 function grid(id,rows,mode){for(const [key,label,desc]of rows){const b=document.createElement('button');b.className='kf-glyph-card';b.append(K.icon(key));const t=document.createElement('span'),title=document.createElement('b'),sub=document.createElement('small');title.textContent=label;sub.textContent=desc;t.append(title,sub);b.append(t);b.onclick=()=>select(label,mode==='assist'?(key.startsWith('human')||key.startsWith('item:')?event('item:GunE11SR',charlie,phantom,[{...bravo,icon:key}]):event('173-snap',phantom,alpha,[{...wraith,icon:key}])):event(key,mode==='human'?bravo:phantom,mode==='human'?wraith:alpha),desc);document.getElementById(id).append(b);}}
 grid('kf-kills',kills,'kill');grid('kf-assists',assists,'assist');grid('kf-weapons',weapons.map(([k,n])=>['item:'+k,n,'游戏物品轮廓']),'human');
 scenarios.forEach(([label,e,desc])=>{const b=document.createElement('button');b.className='kf-scenario';const title=document.createElement('b');title.textContent=label;b.append(title);if(e)b.append(K.row(e));else{const x=document.createElement('span');x.textContent='— 不产生播报 —';b.append(x);}const sub=document.createElement('small');sub.textContent=desc;b.append(sub);b.onclick=()=>select(label,e,desc);document.getElementById('kf-cases').append(b);});
 const status=document.createElement('span');status.className='kf-now';
 function stop(){clearInterval(timer);timer=null;K.pause(false);}
 function open(){stop();review.hidden=false;select(...scenarios[0]);}
 function play(){stop();review.hidden=true;document.body.classList.add('export');K.clear();const all=[...scenarios,...kills.map(([k,n,d])=>[n,event(k),d]),...assists.map(([k,n,d])=>[n,k.startsWith('human')||k.startsWith('item:')?event('item:GunE11SR',charlie,phantom,[{...bravo,icon:k}]):event('096-charge',phantom,alpha,[{...wraith,icon:k}]),d])];let i=0;const step=()=>{if(i>=all.length){stop();status.textContent='播报已播放完毕';return;}const [name,e]=all[i++];status.textContent=name;if(e)K.add(e);};step();timer=setInterval(step,1600);}
 function button(text,action){const b=document.createElement('button');b.textContent=text;b.onclick=action;controls.append(b);return b;}
 button('两人灼伤对照',showBurnStudy);button('击杀／助攻图标总览',open);button('播放击杀播报',play);button('暂停／继续播报',()=>K.pause(!K.paused));button('静态播报示例',()=>{stop();K.clear();[scenarios[0],scenarios[3],scenarios[4],scenarios[2]].forEach(([,e])=>K.add(e,{pinned:true}));});controls.append(status);
 document.getElementById('kf-back').onclick=()=>{review.hidden=true;document.body.classList.add('export');};document.getElementById('kf-play-all').onclick=play;
 addEventListener('keydown',e=>{if(e.key==='Escape'&&!review.hidden){review.hidden=true;document.body.classList.remove('export');}if(e.code==='Space'&&review.hidden&&document.activeElement===document.body){e.preventDefault();K.pause(!K.paused);}});
 window.MZKillfeedPreview={open,play,stop,select,scenarios,kills,assists,weapons,effectWindows,effectAssists,createDamageHistory,ghostAssists,burnSources,burnCases,activeBurnAssists,showBurnStudy,setBurnTime,playBurn};
 [scenarios[0],scenarios[3],scenarios[4]].forEach(([,e])=>K.add(e,{pinned:true}));
})();
