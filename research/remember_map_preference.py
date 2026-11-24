from pathlib import Path
p=Path(r'C:\Users\86188\.codex\memories_v2\extensions\ad_hoc\notes\2026-11-13-mz-observer-map-motion.md');p.parent.mkdir(parents=True,exist_ok=True)
p.write_text('''# MZ 观战 UI 地图偏好（用户明确要求记住）

- 玩家在真实比赛中连续移动，不会瞬间从分散跳到集中；地图缩放演示应使用连续移动。
- 用户希望地图放大及时响应，结合此前要求保持平滑、不频繁来回缩放。不能把“瞬时响应”自动理解为视觉硬切倍率。
- 用户提出改为以当前观战玩家的周边情况决定放大，避免因人类经常抱团而持续锁在人类群体上；请求设计具体判定标准。具体房间范围、倍率、敌人纳入范围仍是待审阅设计，不能记为已确认参数。
''',encoding='utf-8')
