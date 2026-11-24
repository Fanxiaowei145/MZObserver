(function(root){
 const keys={};
 for(let n=65;n<=90;n++)keys['Key'+String.fromCharCode(n)]={vk:n,label:String.fromCharCode(n)};
 for(let n=0;n<10;n++){keys['Digit'+n]={vk:48+n,label:String(n)};keys['Numpad'+n]={vk:96+n,label:'小键盘 '+n};}
 for(let n=1;n<=12;n++)keys['F'+n]={vk:111+n,label:'F'+n};
 Object.assign(keys,{Space:{vk:32,label:'空格'},Insert:{vk:45,label:'Insert'},Delete:{vk:46,label:'Delete'},Home:{vk:36,label:'Home'},End:{vk:35,label:'End'},PageUp:{vk:33,label:'PageUp'},PageDown:{vk:34,label:'PageDown'},ArrowLeft:{vk:37,label:'←'},ArrowUp:{vk:38,label:'↑'},ArrowRight:{vk:39,label:'→'},ArrowDown:{vk:40,label:'↓'},Backquote:{vk:192,label:'`'},Minus:{vk:189,label:'-'},Equal:{vk:187,label:'='},BracketLeft:{vk:219,label:'['},BracketRight:{vk:221,label:']'},Backslash:{vk:220,label:'\\'},Semicolon:{vk:186,label:';'},Quote:{vk:222,label:"'"},Comma:{vk:188,label:','},Period:{vk:190,label:'.'},Slash:{vk:191,label:'/'}});
 const defaults={visibility:'KeyV',zoom:'KeyB'};
 function validate(value){if(!value||typeof value!=='object')throw Error('无效的按键设置');const result={};for(const action of ['visibility','zoom']){const code=value[action];if(code!==null&&!Object.hasOwn(keys,code))throw Error('请选择字母、数字、功能键或受支持的单键');result[action]=code;}if(new Set(Object.values(result).filter(Boolean)).size!==Object.values(result).filter(Boolean).length)throw Error('不同功能不能绑定同一个按键');return result;}
 function load(value){try{return validate(value);}catch{return {...defaults};}}
 class Controls {constructor(){this.visible=true;this.zoom=false;}toggle(action){if(action==='visibility')this.visible=!this.visible;else if(action==='zoom')this.zoom=!this.zoom;else return false;return true;}apply(state){return {...state,uiVisible:this.visible,zoom:this.zoom};}}
 const api={keys,defaults,validate,load,Controls};if(typeof module==='object')module.exports=api;else root.MZHotkeys=api;
})(globalThis);
