# UI 预览素材来源

- `epsilon11-source.png`：SCP Wiki 的 Epsilon-11（Nine-Tailed Fox）标志，作者 SunnyClockwork，CC BY-SA 3.0。来源：https://scp-wiki.wikidot.com/task-forces#epsilon-11 ；原图：https://scp-wiki.wdfiles.com/local--files/task-forces/Epsilon11.png 。这是 SCP Wiki 使用的队徽，不宣称它是从 SL 客户端提取的队徽。
- `official-MTF_Icon.png`：只读提取本机 SCP: Secret Laboratory 的 `SCPSL_Data/resources.assets`，Texture2D `MTF_Icon`，path ID 1662。这是官方游戏角色头像，并非九尾狐队徽；未修改游戏文件。
- 早期 AI 概念图已废弃，不属于 `output/` 中的交付预览。交付预览由 `ui/` 实际前端渲染。
- `official/` 下的角色画像、武器、旧护甲与特殊物品 PNG，来自本机游戏 `resources.assets` 的原生 Texture2D，未重绘其轮廓。当前九尾狐使用前景士兵立绘裁切，不再使用圆形头像。原图保留不变，显示尺寸与轮廓裁切由 CSS 控制。护甲显示已按用户要求改为本项目自制纯白 SVG，不再使用原 PNG。
- `official/Lightning.png` 来自 `Lightning_AbilitySymbol`；106 精力颜色取自原生 `Vigor Slider/Fill` 的 Image 组件，RGBA 为 `(0, 0.6849321723, 0.9905660152, 1)`，约 `#00AFFD`。
- 地图使用旧 `SLUI-Minimap/src/mocks/minimap-layouts.json` 的第一个已有模板（seed 1062329959）和原生 079 房间图块；不是当前比赛地图。怪物侧徽标为本项目原创 SVG，不使用基金会徽标。示例比分、血量、装备不代表真实比赛。

# 接口核验范围

LabAPI 官方源码参考版本：`7b837be2ce8012f12b2d1dd80c52c4c11ba4e0c3`。
已核对 Player 的 OW、身份、观战对象、位置/朝向、HP/HS及上限、装备/弹药/状态接口；096 WasLooking、状态变化事件；106 精力变化事件。现已编译 LabAPI 插件并完成离线逻辑与渲染检查；仍未连比赛服务器、未完成真实多人客户端实测。

赛事文档最初只能取得公开预览片段；本次重新访问公开页面及其 opendoc 数据成功，已提取主文档正文至 `research/rules-full-text.txt`。已读到刷新、计分、平衡血量、暂停等规则；没有另读文内链接的其他协议。正文对波次起算点、SCP 复活间隔和半场结束条件仍未给出明确数值或流程，不能自行称为官方规则。

## 后续视觉修订

九尾狐人物卡已从 `MTF_Icon` 切换到 `MTF_ProfileImage` 的前景士兵 CSS 裁切；原始 PNG 保留，无 AI 重绘。右边缘淡出由 CSS mask 实现。E11、ParticleDisruptor、MicroHID 通过 CSS 旋转原图实现水平展示。轻收容模板由旧 SLUI `packages/map-seed` 的 14.2.8 模板生成，种子 1062329959，共 30 个房间；图块仍来自旧项目已提取的原生 079 素材。A/B 以真实模板房间 prefab 中的 ChkpA / ChkpB 匹配，不是随意摆放。

追加原生素材：`resources.assets` 的 Texture2D 1516 `1509Icon`，922 `SCP207Icon 1`（粉可乐），1386 `SCP207Icon`，1223 `SCP1853Icon`，1646 `AdrenalineIcon`。原始 PNG 由 UnityPy 提取，未重绘。接口依据：Player.ArtificialHealth / HumeShield，以及 Scp1509Item.ShieldRegenRate、ShieldDecayRate、EquippedHS；这些证明存在可读取的统计及道具机制，仍不是比赛服联调结果。

原版血条颜色：`level2` Image 16388，路径 `Artificial Slider/Fill Area/Fill`，RGBA `(0.3857725859,1,0,1)` → `#62FF00`；Image 18099，路径 `HS Slider/Fill Area/Fill`，RGBA `(0.5058823824,0.4784313738,1,1)` → `#817AFF`。已由对应 StatSlider 的 `AhpStat`、`HumeShieldStat` 标识确认用途，而非使用图标的灰白色。只读脚本与结果：`research/read_stat_slider_colors.py`、`research/stat-slider-colors.json`。

全 SCP 预览新增使用 `scp_939_v2`（Texture2D 1296）、`3114_Icon`（1445）、`1507_Icon`（1540），以及之前提取的 173、079、Zombie 原版立绘。所有原图保留，外部背景和其他人物通过 `ui/portrait-polish.css` 的显示裁切排除。护甲 `assets/ui/armor-light.svg`、`armor-combat.svg`、`armor-heavy.svg` 是按用户指定风格制作的 UI 标志，不称为官方图标。

物品白色图标：`assets/items/*.svg` 内嵌原始 PNG，使用 alpha 轮廓白化和旋转/裁切，不改动原始 PNG。对应表 `ui/item-data.js` 对照本机 ItemType；69 项不含 DebugRagdollMover 与 None。普通 10 种钥匙卡端色读取 PredefinedTintDetail（`research/keycard-colors.json`）；O5、Chaos、SurfaceAccessPass 及自定义卡初始端色为预览配置，正式接入需从该卡显示组件取得实际颜色（heldColor），不能把这些默认值称为全部原版已核验。钥匙卡统一白色外形按用户要求新绘。

本次武器白图改为按原生 alpha 轮廓生成矢量路径并去除碎片；角度以枪管为基准（`research/prepare_white_items.py`），不是 PCA。2176 玻璃 alpha 低于旧裁切门槛，改为独立低门槛提取完整轮廓（`research/clean_item_vectors.py`）。原始 PNG 仍保留不改。939 使用已有原生 `939_Icon`，不再对全身图做倾斜拉伸。

2026-11-14：实际覆盖版地图由服务器本局 Room/ElevatorDoor 数据驱动，离线 HTML 仍使用上述旧模板作为视觉样例。原版 AHP 绿色按用户最新偏好降低饱和度显示为 #8DCE64；素材原始颜色记录保留用于溯源。

服务器接入更新：Collector 已发送 heldColor。PredefinedTint 取实际颜色；CustomTint 只读服务器该物品的同步载荷，跟随每张卡的序列号。无 Tint 数据时仍保留类型预设色，未宣称所有图案的色调都能由 Tint 表达。

2026-11-15：人类物品 SVG 增加按原图定位的透明内部描边/镂空，原图未修改；囚鸟使用 resources.assets Texture2D 1194 原版电击球头。状态图标仅在指定区域着色。生成脚本 research/detail_item_icons.py。079 封锁/电网使用本机 door-close / tesla-use 原生交互图标。
