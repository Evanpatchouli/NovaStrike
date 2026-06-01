# NovaStrike 任务台账

## v0.3 第一批实现（进行中）

### 目标

1. 产出 v0.3 的可执行任务拆分（按文件粒度）。
2. 桌面端移除原生窗口工具栏，改为自定义标题栏并提供最小化、最大化、关闭。

### 执行项

- [x] 任务 1：确认 v0.3 规划文档并转入任务拆分执行。
- [x] 任务 2：Electron 主窗改为无原生 frame，并保留现有打开调试窗逻辑。
- [x] 任务 3：新增 preload + IPC，向前端暴露窗口控制 API（minimize/maximize/close）。
- [x] 任务 4：Overlay 新增自定义标题栏组件，接入窗口控制按钮。
- [x] 任务 5：补充 v0.3 第一批开发任务清单（按文件粒度）。
- [x] 任务 6：运行 typecheck 并记录评审结果。

### v0.3 第一批开发任务清单（按文件粒度）

1. [x] `apps/backend/src/services/player-state-events.service.ts`：实现 `previously` 事件抽取（血量/经济/状态变化）。
2. [x] `apps/backend/src/http/create-app.ts`：新增事件流调试接口（recent events）。
3. [x] `packages/shared/src/index.ts`：补充事件流 WS 消息类型。
4. [x] `apps/overlay/src/store/useNovaStrikeStore.ts`：接入事件流状态。
5. [x] `apps/overlay/src/components/TimelinePanel.tsx`：实现事件时间轴展示。
6. [x] `apps/overlay/src/components/EconomyPanel.tsx`：实现经济与装备建议卡片。
7. [x] `apps/overlay/src/components/TempoPanel.tsx`：实现回合节奏面板。
8. [x] `apps/overlay/src/App.tsx`：编排 v0.3 三块核心面板（节奏/经济/时间轴）。
9. [x] `README.md`：补充 v0.3 功能与接口说明。

### 评审记录

1. 自定义窗口标题栏已落地，原生窗口工具栏已移除。
2. 窗口控制（最小化/最大化/关闭）通过 preload IPC 暴露给前端。
3. `pnpm -r typecheck` 全通过。
4. v0.3 第一批核心功能已落地：后端事件流 + 前端节奏/经济/时间轴面板。

## v0.3 第二批实现（进行中）

### 目标

1. 补齐 v0.3 规划中的“个人状态风险提醒”能力。
2. 在经济建议面板中提供可解释的风险提示（状态风险 + 购买风险）。

### 执行项

- [x] 任务 1：梳理当前 Overlay 数据面与风险策略阈值（health/flashed/smoked/burning）。
- [x] 任务 2：增强 `EconomyPanel`，加入状态风险等级与购买风险提示文案。
- [x] 任务 3：新增风险标签与提示样式，保证信息层级清晰。
- [x] 任务 4：更新 README 功能说明。
- [x] 任务 5：运行 `pnpm -r typecheck` 并记录评审结果。

### v0.3 第二批开发任务清单（按文件粒度）

1. [x] `apps/overlay/src/components/EconomyPanel.tsx`：新增状态风险评估、购买风险评估、状态标签展示。
2. [x] `apps/overlay/src/styles.css`：新增风险提示与状态标签样式。
3. [x] `README.md`：更新 v0.3 面板能力描述（补充个人风险提醒）。

### 评审记录（追加）

1. 经济面板已具备“建议 ECO/半起/全起 + 购买风险提示”双层解释。
2. 状态风险支持三档：稳定/注意/高风险（覆盖低血、致盲、烟雾、燃烧）。
3. 风险状态以 badge + 标签呈现，信息密度提升且不增加交互负担。
4. 新增 `defusekit` 状态展示；回合节奏新增 `round_kills` / `round_killhs`、击杀效率和最近 3 回合 K/D 手感状态。
5. 新增“对局概览”卡片：承载连接状态与全局累计指标（总击杀/死亡/KD、致盲次数、燃烧受伤次数、藏烟次数、总体手感）。
