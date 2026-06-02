# NovaStrike

> Current stable version: `v1.0.0`

NovaStrike 是一个面向 CS2 的本地状态看板，基于 Game State Integration (GSI) 展示连接状态与基础对局信息。

当前功能包括：

- Fastify GSI Listener
- WebSocket 实时广播
- React Overlay
- Electron 桌面壳
- 自定义窗口标题栏（最小化/最大化/关闭）
- GSI 配置自动同步
- 开发调试面板（查看最近 GSI payload）
- v0.3 面板：回合节奏、经济建议、个人状态风险提醒、事件时间轴

## 安装

```bash
pnpm install
```

如果 pnpm 提示 Electron / esbuild build scripts 被拦截：

```bash
pnpm approve-builds
```

选择 `electron` 和 `esbuild`。

## 启动

```bash
pnpm dev
```

## 地址

- Backend Health: `http://127.0.0.1:37653/health`
- GSI Endpoint: `http://127.0.0.1:37653/gsi`
- WebSocket: `ws://127.0.0.1:37654`
- Overlay: `http://127.0.0.1:5173`

## GSI 自动同步

### 首次配置

1. 启动应用后，在 Overlay 点击“设置”。
2. 填写 **CS2 所在 Steam 库目录（含 `steamapps/common`）**，例如：`D:\SteamLibrary`。
3. 点击“保存并同步”。

### 自动行为

- 后端启动时会自动检查并同步 `docs/gamestate_integration_novastrike.cfg`。
- 目标路径固定为：
  - `<SteamLibrary>\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg\gamestate_integration_novastrike.cfg`
- 若目标文件不存在会自动复制。
- 若目标文件与仓库版本不一致会自动更新覆盖。

## 开发调试面板

- 仅在开发模式（`pnpm dev`）显示“调试”入口。
- 点击“调试”会打开独立窗口进入调试面板。
- 调试面板可调用：
  - `GET /health`
  - `GET /dev/gsi/last`
  - `GET /dev/gsi/recent`
  - `GET /dev/events/recent`
  - `POST /settings/sync-gsi`

## Desktop Packaging

- Build unpacked app: pnpm build:desktop
- Build Windows installers: pnpm dist:desktop
- Output directory: apps/desktop/dist

## Runtime Config

- Config file path (Windows): `%APPDATA%\\NovaStrike\\config.json`
- If the file does not exist, app will auto-create with defaults:
  - `steamLibraryPath`: `""`
  - `httpPort`: `37653`
  - `wsPort`: `37654`
- If ports are invalid or occupied, update this file manually and restart app.
