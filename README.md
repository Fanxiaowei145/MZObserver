# MZ 比赛观战 UI

用于《SCP: Secret Laboratory》6 名人类对 3 名 SCP 比赛的观战 HUD。比赛服通过 LabAPI 插件发送数据，解说电脑在游戏画面上显示地图、人物状态、技能冷却和比分。参赛玩家无需安装。

## 下载

当前发布版本为 **0.1.10-preview.14**，升级时请同时更新服务端和客户端。

| 使用者 | 下载 | 安装位置 |
| --- | --- | --- |
| 服主 | [服务端插件 ZIP](https://github.com/Fanxiaowei145/MZObserver/releases/download/v0.1.10-preview.14/MZObserver-0.1.10-preview.14-server.zip) | 比赛服的 LabAPI 目录 |
| 解说或观战员 | [Windows x64 客户端 ZIP](https://github.com/Fanxiaowei145/MZObserver/releases/download/v0.1.10-preview.14/MZOverlay-0.1.10-preview.14-win-x64.zip) | 运行游戏的 Windows 电脑 |

源码压缩包和 SHA-256 校验值见[版本发布页](https://github.com/Fanxiaowei145/MZObserver/releases/tag/v0.1.10-preview.14)。

## 服主安装服务端插件

1. 停服，解压服务端 ZIP。找到**运行专服的账户**所使用的 LabAPI 目录。Windows 默认路径为 `%APPDATA%\SCP Secret Laboratory\LabAPI`，Linux 通常为 `~/.config/SCP Secret Laboratory/LabAPI`。面板服使用面板实际生成的目录。
2. 从压缩包的 `server/` 目录复制文件。下表以游戏端口 **7777** 为例，其他实例请替换为自己的游戏端口。

   | 文件 | 目标目录 |
   | --- | --- |
   | `MZObserver.dll` | `LabAPI/plugins/7777/` |
   | `0Harmony.dll`、`Newtonsoft.Json.dll`、`websocket-sharp.dll` | `LabAPI/dependencies/7777/` |

3. 启动一次服务器以生成配置，再停服检查 `LabAPI/configs/7777/MZObserver/config.yml`。首次安装可对照包内的 `server/config.example.yml`。升级前备份已有配置，保留原服使用的端口和证书设置。
4. 默认配置监听 `0.0.0.0`，通过 **TCP 28480** 发送观战数据。在防火墙和云安全组放行该 TCP 端口。面板服需分配相应的 TCP 端口，经过路由器或 NAT 时还需配置端口映射。
5. 重启服务器，确认日志中出现 MZObserver 的监听地址。把 `ws://服务器IP:28480/mz` 发给解说，将 IP 和端口换为解说电脑实际可达的地址和**外部 TCP 端口**，保留末尾的 `/mz`。允许解说进入游戏的 Overwatch（OW）监管模式。

## 解说安装与首次配对

1. 将 Windows 客户端 ZIP **完整解压**到本机目录，从解压后的 `MZOverlay` 文件夹启动 `MZOverlay.exe`。
2. 将游戏设为**无边框窗口**，加入比赛服并进入 **OW 监管模式**。打开游戏客户端控制台，输入 `.mzui`，取得 4 位数字配对码。配对码有效期为 120 秒，每个码只能使用一次。
3. 在软件的「服务器数据地址」填入服主提供的完整地址，在「OW 配对码」填入数字。如果使用默认的 `ws://` 地址，勾选「允许使用 ws:// 未加密连接」。点击「连接观战 HUD」。
4. 连接成功后可最小化设置窗口，切回游戏。首次配对完成后可以离开 OW 继续观战。退出比赛服务器或关闭软件后，再次使用时需重新取码配对。

## 比赛中怎么用

- **开始显示** — 准备阶段会隐藏 HUD。回合开始并凑齐 6 名有效人类和 3 名有效 SCP 后，HUD 开始显示和计时。教程角色不计入人数。
- **地图与显隐** — 游戏在前台时，按 **B** 切换全图与局部放大，按 **V** 显示或隐藏 HUD。两项都可以在软件的「本地快捷键」中改绑或解绑。
- **按数字选人（可选）** — 在软件中勾选「启用实验选人」，并让上一位、下一位观战的鼠标绑定与游戏设置一致。**1–6** 对应左下方从左到右的人类卡片，**7–9** 对应右下方从左到右的 SCP 卡片。使用小键盘时打开 Num Lock，操作前关闭 RA、控制台和游戏菜单。
- **连不上或没有画面** — 连接失败先核对地址末尾的 `/mz` 和 TCP 端口是否放行。提示配对失效时，进入 OW 重新取码。已连接但提示等待人数时，检查双方阵容。提示等待游戏窗口时，检查游戏是否已启动并使用无边框窗口。

管理员暂停计时、手动调整比分等命令见[安装与使用](安装与使用.md)。部署前可查阅[兼容性清单](兼容性清单.md)，版本变化见[更新说明](更新说明.md)，自行构建见[源码说明](源码说明.md)。
