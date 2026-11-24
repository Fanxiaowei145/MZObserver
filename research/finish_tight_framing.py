from pathlib import Path
p=Path('ui/app.js');s=p.read_text(encoding='utf-8').replace(' let framing;',' let framing,displayPlayers=relevant;').replace("const fullFallback=observed?.role==='079'&&!cameraAnchor;", "const fullFallback=observed?.role==='079'&&!cameraAnchor;\n  if(!fullFallback)displayPlayers=near;")
s=s.replace(' relevant.forEach((p,i)=>{',' displayPlayers.forEach((p,i)=>{').replace('visibleIds:relevant.map(p=>p.id)', 'visibleIds:displayPlayers.map(p=>p.id)');p.write_text(s,encoding='utf-8')
p=Path('ui/verify-map-review.cjs');s=p.read_text(encoding='utf-8');s=s.replace("await win.loadFile(path.join(__dirname,'index.html'),{query:{export:'1'}});", "await win.loadFile(process.argv.includes('--offline')?path.join(out,'MZ观战UI_统一预览.html'):path.join(__dirname,'index.html'),{query:{export:'1'}});")
s=s.replace('assert(close>5&&close>original*3);', 'assert(close>7.5&&close>original*3);')
needle=" fs.writeFileSync(path.join(out,'14-map-close.png'),(await win.webContents.capturePage({x:20,y:20,width:490,height:460})).toPNG());"
s=s.replace(needle,needle+'''
 await run("fitMapPlayers(clusterPoints.map(p=>({...p,x:clusterPoints[0].x+(p.x-clusterPoints[0].x)/2,y:clusterPoints[0].y+(p.y-clusterPoints[0].y)/2})),'HCZ_EZ')");
 const tighter=await run('mapCamera.scale');assert(tighter>close*1.8);
 await run("fitMapPlayers(clusterPoints.map(p=>({...p,role:'scientist'})),'HCZ_EZ')");assert(Math.abs((await run('mapCamera.scale'))-close)<.01);
''')
s=s.replace('closeScale:close,','closeScale:close,tighterScale:tighter,noEnemyRequired:true,');p.write_text(s,encoding='utf-8')
p=Path('预览说明.md');s=p.read_text(encoding='utf-8');s+='''

## 当前放大规则修正：两格是筛选上限，站位决定边界

本段取代前文的 75/90 单位距离、固定留白半径、敌方存在条件与 7.5 倍倍率上限。

B 关闭时仍显示全图。B 开启时，以观战对象所在房间为原点，按房间坐标直线距离 ≤2 格选取房间，并纳入这些房间内的存活玩家；不同平面、教程角色不参与。正式数据优先使用 roomId，预览坐标缺少 roomId 时才以最近房间中心估计。边缘房间中的玩家不会因为站到房间远端就被误排除；超过两格的房间不使用旧的更大退出半径继续保留。

用入选玩家真实位置的轴对齐最小包围框决定取景中心和倍率，涵盖所有入选玩家，不固定展示整间房，也不要求有敌方角色。同房内两人距离缩短时，视野继续收紧。保留每侧约 6% 的站位范围留白和 24 个界面像素的安全边距；保持地图比例，因此宽高比造成的另一方向空白可能略大。取消固定 7.5 倍上限。仅在单人、重合或极小跨度时使用 4 个投影单位的最小尺寸，防止除零和无限倍率。目标变化立即开始 220 ms 平滑过渡，3% 微小变化门槛仅用于抑制轻微抖动，不扩大玩家筛选范围。

079 以当前摄像头所在房间筛选附近玩家，玩家的站位决定取景；摄像头坐标缺失时保留全图，不能把其他人错误当作 079 的观战中心。服务端应同时提供摄像头平面、投影坐标和 roomId。
''';p.write_text(s,encoding='utf-8')
