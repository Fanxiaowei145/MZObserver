const $=id=>document.getElementById(id);let bindings={...MZHotkeys.defaults},listening=null,saving=false;
function paint(){for(const action of ['visibility','zoom']){$('bind-'+action).textContent=listening===action?'请按键…':(MZHotkeys.keys[bindings[action]]?.label||'未绑定');$('bind-'+action).disabled=saving;$('clear-'+action).disabled=saving;}}
window.mzHost.getSettings().then(s=>{$('url').value=s.url||'';$('lan').checked=!!s.allowLan;bindings=MZHotkeys.load(s.keybindings);$('sample-directory').textContent=s.orderSampleDirectory?'顺序样本保存目录：'+s.orderSampleDirectory:'';paint();});
window.mzHost.onStatus(s=>$('status').textContent=s);
window.mzHost.onControls(s=>$('control-state').textContent=`UI：${s.visible?'显示':'隐藏'} · 地图：${s.zoom?'局部放大':'全图'}`);
$('connect').onclick=async()=>{try{await window.mzHost.connect({url:$('url').value.trim(),code:$('code').value.trim(),allowLan:$('lan').checked});$('code').value='';}catch(e){$('status').textContent=e.message;}};
$('disconnect').onclick=()=>window.mzHost.disconnect();
async function save(action,code){if(saving)return;listening=null;saving=true;paint();try{bindings=await window.mzHost.setKeybindings(MZHotkeys.validate({...bindings,[action]:code}));$('keyhint').textContent='已保存，下次启动仍有效。';}catch(e){$('keyhint').textContent=e.message;}finally{saving=false;paint();}}
for(const action of ['visibility','zoom']){$('bind-'+action).onclick=()=>{listening=action;paint();$('keyhint').textContent='请按一个新键（不带 Ctrl / Alt / Shift），Esc 取消。';};$('clear-'+action).onclick=()=>save(action,null);}
addEventListener('keydown',e=>{if(!listening)return;e.preventDefault();e.stopPropagation();if(e.repeat)return;if(e.code==='Escape'){listening=null;paint();$('keyhint').textContent='已取消换绑。';return;}if(e.ctrlKey||e.altKey||e.shiftKey||e.metaKey||!MZHotkeys.keys[e.code]){$('keyhint').textContent='请使用字母、数字、F1–F12、方向键等单键。';return;}save(listening,e.code);},true);
addEventListener('blur',()=>{if(listening){listening=null;paint();$('keyhint').textContent='窗口已失焦，换绑已取消。';}});
paint();

const cycleSelect=$('switch-cycle'),previousSelect=$('switch-previous');
for(const [code,key] of Object.entries(MZHotkeys.keys)){if(!code.startsWith('Digit')){cycleSelect.add(new Option(key.label,String(key.vk)));previousSelect.add(new Option(key.label,String(key.vk)));}}
window.mzHost.getSettings().then(s=>{$('switch-enabled').checked=!!s.switchOptions?.enabled;cycleSelect.value=String(s.switchOptions?.cycle||1);previousSelect.value=String(s.switchOptions?.previous||(s.switchOptions?.cycle===2?1:2));});
async function saveSwitch(){try{await window.mzHost.setSwitchOptions({enabled:$('switch-enabled').checked,cycle:Number(cycleSelect.value),previous:Number(previousSelect.value)});$('switch-result').textContent='已保存。主键盘 1–9 选人，Esc 取消。';}catch(e){$('switch-result').textContent=e.message;const s=await window.mzHost.getSettings();$('switch-enabled').checked=!!s.switchOptions?.enabled;cycleSelect.value=String(s.switchOptions?.cycle||1);previousSelect.value=String(s.switchOptions?.previous||(s.switchOptions?.cycle===2?1:2));}}
$('switch-enabled').onchange=saveSwitch;cycleSelect.onchange=saveSwitch;previousSelect.onchange=saveSwitch;
window.mzHost.onSwitch?.(s=>{$('switch-result').textContent=s.ok?`已切到目标：${s.steps} 次切换，${s.elapsedMs} ms`:`已停止：${s.reason}`;});
