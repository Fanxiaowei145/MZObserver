const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('mzHost',{
 connect:settings=>ipcRenderer.invoke('mz:connect',settings),disconnect:()=>ipcRenderer.invoke('mz:disconnect'),
 setSwitchOptions:value=>ipcRenderer.invoke('mz:switch-options',value),
 onSwitch:cb=>ipcRenderer.on('mz:switch-result',(_e,s)=>cb(s)),
 getSettings:()=>ipcRenderer.invoke('mz:settings'),
 setKeybindings:value=>ipcRenderer.invoke('mz:keybindings',value),
 onControls:cb=>ipcRenderer.on('mz:controls',(_e,s)=>cb(s)),
 onState:cb=>ipcRenderer.on('mz:state',(_e,s)=>cb(s)),onStatus:cb=>ipcRenderer.on('mz:status',(_e,s)=>cb(s))
});
