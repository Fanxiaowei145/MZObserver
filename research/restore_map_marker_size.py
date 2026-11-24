from pathlib import Path
p=Path('ui/map-camera.js');s=p.read_text(encoding='utf-8').replace('markerSize:13.2','markerSize:22');p.write_text(s,encoding='utf-8')
p=Path('ui/final-layout.css');s=p.read_text(encoding='utf-8').replace('.marker{width:13.2px;height:13.2px;border-width:1px;', '.marker{width:22px;height:22px;border-width:1.5px;').replace('.marker span{font-size:8px}', '.marker span{font-size:12px}').replace('.marker::before{width:4.2px;height:6px;left:12.6px;top:3.6px;transform-origin:-6px 3px}', '.marker::before{width:7px;height:10px;left:21px;top:6px;transform-origin:-10px 5px}').replace('var(--map-number-font,8px)','var(--map-number-font,12px)');p.write_text(s,encoding='utf-8')
p=Path('ui/app.js');s=p.read_text(encoding='utf-8').replace("Math.max(8,7/scale)+'px'", "Math.max(12,7/scale)+'px'");p.write_text(s,encoding='utf-8')
p=Path('ui/map-interaction.js');s=p.read_text(encoding='utf-8').replace('stopMapMovementDemo();stopFloorDemo();setScene(1);',"stopMapMovementDemo();stopFloorDemo();stopDamageDemo();if(playTimer){clearInterval(playTimer);playTimer=null;$('#motion').textContent='播放状态变化';}setScene(1);");p.write_text(s,encoding='utf-8')
p=Path('ui/verify-map-review.cjs');s=p.read_text(encoding='utf-8').replace(".width)\")-13.2", ".width)\")-22").replace('markerSize:13.2','markerSize:22');p.write_text(s,encoding='utf-8')
p=Path('ui/verify-render.cjs');s=p.read_text(encoding='utf-8').replace(".width\"))-4.2)", ".width\"))-7)");p.write_text(s,encoding='utf-8')
p=Path('预览说明.md');s=p.read_text(encoding='utf-8');s+='''

## 当前显示修订：单人范围、观战高亮与房间配色

放大筛选结果只有一名玩家时，以该玩家所在房间中心为准，显示本房间与相邻一圈（约 3×3 房间格），不再按单个点取极小范围；有两人及以上时继续按实际站位包围框取景。可点击“单人取景演示”检查此分支。原来的极小跨度防除零只用于多个玩家完全重合等数值边界。

正在观战的选手名字底条用柔和浅绿色 #A3BEA9，搭配深色文字；只改变名字底条，不改变角色血量颜色。切换观战对象、更新状态后保持唯一正确高亮。

特殊房间使用原始地图图块的透明轮廓染色，不绘制外接矩形、不更换房间形状。地图中仅保留 A/B 电梯字母，其余特殊房间不再写文字或附加图标。颜色按 RoomName/Prefab 绑定，多个同类特斯拉房间使用相同颜色，换 seed 后仍按房型生效：

| 房间 | 颜色 | 色值 |
|---|---|---|
| B 大门 | 柔和九尾狐蓝 | #5D91C4 |
| A 大门 | 柔和混沌绿 | #649377 |
| 电磁炮房 | 米白 | #DED7C2 |
| 特斯拉 | 浅黄 | #D8C87D |
| 079 | 灰紫 | #9B88B4 |
| 914 | 陶橙 | #C98F72 |
| 轻收容武器库 | 豆沙粉 | #B78494 |
| GR18 | 青灰 | #73B3AE |

GR18 按 LczGlassroom / LCZ_372 匹配；命名核对来源：https://en.scpslgame.com/index.php/Light_Containment_Zone 。以上是为本 HUD 调整的低饱和配色，不称为全部房间的官方 UI 原色。

用户后续调整：玩家小地图标记恢复原来的尺寸——圆点 22 px、编号 12 px、朝向箭头 7×10 px；地图窗口仍保持增大 25%。不再使用缩小 40% 的玩家标记。尺寸均为 1920×1080 设计基准，随窗口统一缩放。
''';p.write_text(s,encoding='utf-8')
