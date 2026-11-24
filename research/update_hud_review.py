from pathlib import Path
r=Path(__file__).resolve().parents[1]
def edit(file,old,new):
 p=r/file;s=p.read_text(encoding='utf-8-sig');assert old in s,(file,old[:100]);p.write_text(s.replace(old,new),encoding='utf-8')
edit('ui/index.html','</head>','<link rel="stylesheet" href="killfeed.css"></head>')
edit('ui/index.html','</body>','<script src="killfeed.js"></script><script src="killfeed-preview.js"></script></body>')
edit('server/Config.cs','public int KeybindId {get;set;}=28480;','public int KeybindId {get;set;}=28480;\n public int VisibilityKeybindId {get;set;}=28481;')
edit('server/config.example.yml','keybind_id: 28480','keybind_id: 28480\nvisibility_keybind_id: 28481')
edit('server/Transport.cs','internal bool Zoom,Pressed;','internal HudSession Hud;internal string RemoteAddress=>Context.UserEndPoint.Address.ToString();')
edit('server/MzPlugin.cs','public double Expires;}','public double Expires;public HudSession Hud=new HudSession();}')
edit('server/MzPlugin.cs','SSKeybindSetting binding;','SSKeybindSetting binding,visibilityBinding;\n readonly Dictionary<string,Tuple<double,int>> authAttempts=new Dictionary<string,Tuple<double,int>>();')
edit('server/MzPlugin.cs','if((ServerSpecificSettingsSync.DefinedSettings??new ServerSpecificSettingBase[0]).Any(s=>s.SettingId==Config.KeybindId))','if(Config.KeybindId==Config.VisibilityKeybindId||(ServerSpecificSettingsSync.DefinedSettings??new ServerSpecificSettingBase[0]).Any(s=>s.SettingId==Config.KeybindId||s.SettingId==Config.VisibilityKeybindId))')
edit('server/MzPlugin.cs','ServerSpecificSettingsSync.DefinedSettings=(ServerSpecificSettingsSync.DefinedSettings??new ServerSpecificSettingBase[0]).Concat(new[]{binding}).ToArray();','visibilityBinding=new SSKeybindSetting(Config.VisibilityKeybindId,"MZ HUD 显示／隐藏",KeyCode.V,hint:"已配对后按键切换 UI 显隐；不会断开连接，切换角色后仍可使用");\n  ServerSpecificSettingsSync.DefinedSettings=(ServerSpecificSettingsSync.DefinedSettings??new ServerSpecificSettingBase[0]).Concat(new[]{binding,visibilityBinding}).ToArray();')
edit('server/MzPlugin.cs','if(binding!=null)ServerSpecificSettingsSync.DefinedSettings=','if(binding!=null||visibilityBinding!=null)ServerSpecificSettingsSync.DefinedSettings=')
edit('server/MzPlugin.cs','.Where(s=>s!=binding).ToArray();','.Where(s=>s!=binding&&s!=visibilityBinding).ToArray();')
edit('server/MzPlugin.cs','tokens.Clear();codes.Clear();Instance=null;','tokens.Clear();codes.Clear();authAttempts.Clear();Instance=null;')
p=r/'server/MzPlugin.cs';s=p.read_text(encoding="utf-8");start=s.index(' void OnKey(');end=s.index(' internal void Tick()',start)
s=s[:start]+''' void OnKey(ReferenceHub hub,ServerSpecificSettingBase setting){
  var key=setting as SSKeybindSetting;if(key==null||(key.SettingId!=Config.KeybindId&&key.SettingId!=Config.VisibilityKeybindId))return;
  var p=Player.Get(hub);if(p==null)return;
  foreach(var permit in tokens.Values.Where(t=>t.Net==p.NetworkId&&t.Actor==Collector.Actor(p)).Distinct())permit.Hud.Key(key.SettingId==Config.VisibilityKeybindId,key.SyncIsPressed);
 }
'''+s[end:];p.write_text(s,encoding='utf-8')
edit('server/MzPlugin.cs','observer==null||!observer.IsOverwatchEnabled','observer==null')
edit('server/MzPlugin.cs','var target=observer.CurrentlySpectating;','var target=observer.CurrentlySpectating;\n    if(target==null&&observer.IsAlive)target=observer;')
edit('server/MzPlugin.cs','s["zoom"]=f.Zoom;','s["zoom"]=f.Hud.Zoom;s["uiVisible"]=f.Hud.Visible;')
edit('server/MzPlugin.cs','&&x.IsOverwatchEnabled);',');')
edit('server/MzPlugin.cs','var c=RandomToken(8);codes[c]=','foreach(var old in codes.Where(x=>x.Value.Actor==Collector.Actor(p)).Select(x=>x.Key).ToArray())codes.Remove(old);var c=PairingCode.Create(code=>codes.ContainsKey(code));codes[c]=')
edit('server/MzPlugin.cs','var key=j.Value<string>("code")??j.Value<string>("token")??"";Permit permit;','var key=(j.Value<string>("code")??j.Value<string>("token")??"").Trim();\n  if(j["token"]==null){var now=clock.Elapsed.TotalMilliseconds;foreach(var old in authAttempts.Where(a=>a.Value.Item1+60000<now).Select(a=>a.Key).ToArray())authAttempts.Remove(old);Tuple<double,int> attempts;authAttempts.TryGetValue(f.RemoteAddress,out attempts);if(attempts!=null&&attempts.Item2>=10){f.Control("{\\"type\\":\\"error\\",\\"message\\":\\"配对尝试过于频繁，请一分钟后重试\\"}");return;}authAttempts[f.RemoteAddress]=Tuple.Create(attempts?.Item1??now,(attempts?.Item2??0)+1);}\n  Permit permit;')
edit('server/MzPlugin.cs','(fresh&&permit.Expires<clock.Elapsed.TotalMilliseconds)','(fresh&&(permit.Expires<clock.Elapsed.TotalMilliseconds||!Player.List.Any(p=>p.NetworkId==permit.Net&&Collector.Actor(p)==permit.Actor&&p.IsOverwatchEnabled)))')
edit('server/MzPlugin.cs','f.Observer=permit.Actor;','f.Hud=permit.Hud;permit.Hud.ReleaseKeys();f.Observer=permit.Actor;')
edit('desktop/main.cjs',"hasState=s.phase==='live'||s.phase==='ended';","hasState=s.uiVisible!==false&&(s.phase==='live'||s.phase==='ended');")
edit('desktop/main.cjs',"OW 会话结束或配对失效，请重新进入 OW 并取得配对码","游戏连接结束或配对失效，请进入 OW 获取新配对码")
edit('desktop/main.cjs',"if(!/^[0-9a-f]{16}$/i.test(String(s.code).trim()))throw Error('配对码应为游戏返回的 16 位字符');","if(!/^(?:[0-9]{4}|[0-9a-f]{16})$/i.test(String(s.code).trim()))throw Error('请输入游戏返回的 4 位数字配对码（也兼容旧版 16 位码）');")
edit('desktop/main.cjs',"${s.paused?' · 计时暂停':''}","${s.paused?' · 计时暂停':''}${s.uiVisible===false?' · HUD 已隐藏（默认 V 切换）':''}")
edit('desktop/settings.html','游戏客户端控制台输入 .mzui 获取','输入 .mzui 获取 4 位数字码（兼容旧版码）')
edit('desktop/settings.html','进入 OW 后配对，切回游戏显示覆盖层。B 键在游戏的 Server-Specific 设置中修改。','进入 OW 后配对，之后切换角色仍保留连接。默认 B 放大地图、V 显示／隐藏 UI，均可在游戏 Server-Specific 设置改绑。')
edit('ui/live-bridge.js','connected=true;MZUI.setAuthorized(true);','connected=true;MZUI.setAuthorized(s.uiVisible!==false);')
