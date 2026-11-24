from pathlib import Path
p=Path('预览说明.md');s=p.read_text(encoding='utf-8');s+='''

## 当前实现：全图 / 手动动态放大

- 默认是当前平面完整地图；B 按一次启用动态放大，再按一次回到全图。长按产生的重复按键不会反复切换。可用“观战”下拉框演示切换对象。
- 开启后，以观战对象为基准纳入附近玩家：进入半径 75 个投影单位、离开半径 90 个单位（一个房间格约 30 单位）；远处人群不强制牵动视角。附近存在对方阵营时按局部站位包围范围留 14 单位边距计算倍率；无近敌时保留周围通行空间。最大内部投影倍率 7.5，约为原版上限 2.1 的 3.57 倍，不代表所有场景固定放大 7.5 倍。只保留 6% 倍率变化门槛抑制抖动，目标倍率立即更新，220 ms 连续插值。
- 小地图设计尺寸从 378×350 增至 472.5×437.5，宽高均增 25%；玩家圆点从 22 px 减到 13.2 px，箭头同比缩小 40%，数字有低分辨率最小字号保护。
- “连续走位演示”从相邻房间中心连续移动到两间房内，再散开；B 可在过程中切换。位置为演示数据，不模拟真实服务器寻路规则。
- 地标：079、HID、办公区 A/B 门、轻收容武器库、914 和 A/B 电梯；以房间 Name/Prefab 匹配，局部锚点随房间 yaw 旋转，再经过 HCZ 的 180° 投影变换。可由 mapAnchors 提供各房间真实端口局部坐标。标签优先避开地图房间与其他标签，不依赖地图边缘或某个 seed 的绝对坐标。
- “切换地图模板”在两个实际生成 seed 之间切换；已验证两套模板地标数量、旋转和平移绑定。比赛端仍需提供实际生成地图和房间端口，不能把测试模板当作比赛地图。
- 隐身画像透明度 50%；所有已有数量提示在数量为 1 时去除 ×1，2176 数量大于 1 才显示 ×N，207 叠层同理。
- UI 仍按统一比例缩放，但逻辑画布覆盖整个窗口，比分固定顶部居中、人物卡贴近左右下角；本地验证 1280×720、1920×1080、1440×1080、2560×1080。尚未完成真实游戏多屏 / DPI / 捕获联调。

## 用户确定的部署架构

最终使用“LabAPI 服务端插件 + 独立桌面覆盖软件”，不把这套 HUD 的布局和动画塞进游戏内 UI。当前统一 HTML 复用为桌面软件的渲染层；它仍是预览，不是已连接比赛服的 EXE。

服务端职责：采集权威状态、真实地图与观战对象、分数和波次；验证 Steam64 白名单与 OW 状态；处理 Server-Specific 按键；向该观察员绑定的数据会话发送状态。配对不能仅相信桌面端自行填写的 Steam64；失权、断开后停止该会话的数据，桌面端清空旧画面。

桌面端职责：接收已授权状态，复用 HTML/CSS 进行补间与显示；创建透明、置顶、鼠标穿透的覆盖窗口；跟随游戏客户区的位置、尺寸和可见状态。窗口化 / 无边框为主要支持目标；独占全屏、OBS 等录制方式、多显示器 DPI 需要实机验证，不能把浏览器检查当作这些验证。

B 的正式链路：Server-Specific 中的 SSKeybindSetting（默认 UnityEngine.KeyCode.B，可由用户改绑）→ ServerOnSettingValueReceived → 检查对应 setting id、OW 与白名单 → 对按下沿切换该解说员的 mapZoomEnabled → 数据通道通知桌面端。放开按键只复位 pressed 状态；不依赖透明软件取得键盘焦点。注册时合并其他插件已有的 DefinedSettings，不能整表覆盖；每位观察员独立保存开关，初始 false。

已核对的官方资料：
- https://github.com/northwood-studios/LabAPI/wiki/DisplayKit-SendingToPlayers （SSKeybindSetting、SyncIsPressed 与接收事件示例；只采用按键接口，不采用游戏内 DisplayKit 绘制方案）
- https://www.electronjs.org/docs/latest/tutorial/custom-window-interactions （鼠标穿透 setIgnoreMouseEvents）

当前可复用的渲染入口：MZUI.applyPlayers、applyMapRooms、applyScp079、setMapObservedPlayer、setMapZoom、setWaveClock。服务器传来的比赛状态和镜头位置还需通过独立通信适配层接入，现阶段没有安装服务器插件或开放网络服务。
''';p.write_text(s,encoding='utf-8')
