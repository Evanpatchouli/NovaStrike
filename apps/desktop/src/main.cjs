const { app, BrowserWindow, Menu, Tray, nativeImage, globalShortcut, shell, ipcMain } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const OVERLAY_ORIGIN = "http://127.0.0.1:5173";
let mainWindow;
let tray;
let backendProcess;
let runtimeConfig;
let backendStatus = { ok: true, message: "" };

const DEFAULT_RUNTIME_CONFIG = {
  steamLibraryPath: "",
  httpPort: 37653,
  wsPort: 37654
};

function getIconPath(fileName) {
  return path.join(__dirname, "..", "assets", fileName);
}

function getUiPrefsPath() {
  return path.join(app.getPath("userData"), "ui-prefs.json");
}

function getRuntimeConfigPath() {
  return path.join(app.getPath("appData"), "NovaStrike", "config.json");
}

function normalizePort(value, fallback) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 65535) return fallback;
  return num;
}

function normalizeRuntimeConfig(input) {
  return {
    steamLibraryPath: typeof input?.steamLibraryPath === "string" ? input.steamLibraryPath.trim() : "",
    httpPort: normalizePort(input?.httpPort, DEFAULT_RUNTIME_CONFIG.httpPort),
    wsPort: normalizePort(input?.wsPort, DEFAULT_RUNTIME_CONFIG.wsPort)
  };
}

function ensureRuntimeConfigFile() {
  const configPath = getRuntimeConfigPath();
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_RUNTIME_CONFIG, null, 2), "utf8");
  }
}

function loadRuntimeConfig() {
  ensureRuntimeConfigFile();
  const raw = fs.readFileSync(getRuntimeConfigPath(), "utf8");
  const parsed = JSON.parse(raw);
  return normalizeRuntimeConfig(parsed);
}

function saveRuntimeConfig(nextConfig) {
  const normalized = normalizeRuntimeConfig(nextConfig);
  fs.mkdirSync(path.dirname(getRuntimeConfigPath()), { recursive: true });
  fs.writeFileSync(getRuntimeConfigPath(), JSON.stringify(normalized, null, 2), "utf8");
  runtimeConfig = normalized;
  return normalized;
}

function getBackendLogPath() {
  if (app.isPackaged) {
    return path.join(path.dirname(process.execPath), "backend.log");
  }
  return path.join(app.getPath("userData"), "backend.log");
}

function appendBackendLog(line) {
  try {
    fs.appendFileSync(getBackendLogPath(), `${new Date().toISOString()} ${line}\n`, "utf8");
  } catch {
    // ignore write failures
  }
}

function loadUiPrefs() {
  try {
    const filePath = getUiPrefsPath();
    if (!fs.existsSync(filePath)) return { closeBehavior: "close", showOverlayHeader: true };
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      closeBehavior: parsed?.closeBehavior === "hide" ? "hide" : "close",
      showOverlayHeader: parsed?.showOverlayHeader !== false
    };
  } catch {
    return { closeBehavior: "close", showOverlayHeader: true };
  }
}

function saveUiPrefs(nextPrefs) {
  try {
    fs.writeFileSync(getUiPrefsPath(), JSON.stringify(nextPrefs), "utf8");
  } catch {
    // ignore write failures
  }
}

let uiPrefs = loadUiPrefs();

function compareVersion(a, b) {
  const pa = String(a).split(".").map((item) => Number.parseInt(item, 10) || 0);
  const pb = String(b).split(".").map((item) => Number.parseInt(item, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

function getWindowStatePath() {
  return path.join(app.getPath("userData"), "window-state.json");
}

function loadWindowState() {
  try {
    const filePath = getWindowStatePath();
    if (!fs.existsSync(filePath)) return null;
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (typeof parsed?.width !== "number" || typeof parsed?.height !== "number") return null;
    const state = { width: parsed.width, height: parsed.height };
    if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
      state.x = parsed.x;
      state.y = parsed.y;
    }
    return state;
  } catch {
    return null;
  }
}

function saveWindowState(window) {
  try {
    if (!window || window.isDestroyed() || window.isMinimized() || window.isMaximized()) return;
    const { x, y, width, height } = window.getBounds();
    const filePath = getWindowStatePath();
    fs.writeFileSync(filePath, JSON.stringify({ x, y, width, height }), "utf8");
  } catch {
    // ignore write failures
  }
}

function isOverlayUrl(url) {
  if (url.startsWith(OVERLAY_ORIGIN)) return true;
  if (!app.isPackaged) return false;
  return url.startsWith(pathToFileURL(getOverlayIndexPath()).toString());
}

function getOverlayIndexPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "overlay-dist", "index.html");
  }
  return path.join(__dirname, "..", "..", "overlay", "dist", "index.html");
}

function getBackendEntryPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend-dist", "index.cjs");
  }
  return path.join(__dirname, "..", "..", "backend", "dist-bundle", "index.cjs");
}

function getGsiTemplatePath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "gsi-template", "gamestate_integration_novastrike.cfg");
  }
  return path.join(__dirname, "..", "..", "..", "docs", "gamestate_integration_novastrike.cfg");
}

function canListenOnPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function waitForBackendReady(config, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${config.httpPort}/health`);
      if (response.ok) return true;
    } catch {
      // keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

function stopEmbeddedBackend() {
  const processRef = backendProcess;
  backendProcess = undefined;
  if (!processRef || processRef.killed) return processRef;
  processRef.kill("SIGTERM");
  return processRef;
}

function waitForBackendExit(processRef, timeoutMs = 5000) {
  if (!processRef) return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    processRef.once("exit", () => finish(true));
  });
}

async function startEmbeddedBackend(config) {
  if (!app.isPackaged) return true;
  const backendEntry = getBackendEntryPath();
  if (!fs.existsSync(backendEntry)) {
    appendBackendLog(`backend entry missing: ${backendEntry}`);
    backendStatus = { ok: false, message: `后端入口缺失：${backendEntry}` };
    return false;
  }
  const [httpAvailable, wsAvailable] = await Promise.all([canListenOnPort(config.httpPort), canListenOnPort(config.wsPort)]);
  if (!httpAvailable || !wsAvailable) {
    appendBackendLog(`backend start blocked by port conflict: http=${config.httpPort} ws=${config.wsPort}`);
    backendStatus = { ok: false, message: `端口冲突：HTTP ${config.httpPort} 或 WS ${config.wsPort} 已被占用` };
    return false;
  }
  backendProcess = spawn(process.execPath, [backendEntry], {
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NOVASTRIKE_SETTINGS_FILE: getRuntimeConfigPath(),
      NOVASTRIKE_GSI_CFG_SOURCE: getGsiTemplatePath(),
      NOVASTRIKE_HTTP_PORT: String(config.httpPort),
      NOVASTRIKE_WS_PORT: String(config.wsPort)
    }
  });
  backendProcess.stdout?.on("data", (chunk) => appendBackendLog(`[stdout] ${String(chunk).trimEnd()}`));
  backendProcess.stderr?.on("data", (chunk) => appendBackendLog(`[stderr] ${String(chunk).trimEnd()}`));
  backendProcess.on("exit", (code, signal) => {
    appendBackendLog(`backend exited: code=${code ?? "null"} signal=${signal ?? "null"}`);
    backendProcess = undefined;
  });
  const ready = await waitForBackendReady(config);
  if (!ready) {
    appendBackendLog("backend health check timeout");
    backendStatus = { ok: false, message: "后端启动超时，请检查端口占用或安全软件拦截" };
    stopEmbeddedBackend();
    return false;
  }
  backendStatus = { ok: true, message: `后端已启动（HTTP:${config.httpPort} / WS:${config.wsPort}）` };
  return true;
}

async function applyRuntimeConfig(candidate) {
  const previous = runtimeConfig;
  const next = normalizeRuntimeConfig({ ...previous, ...candidate });
  if (!app.isPackaged) {
    saveRuntimeConfig(next);
    backendStatus = { ok: true, message: "开发模式下配置已写入，重启应用后生效" };
    return { ok: true, message: "开发模式下配置已写入，重启应用后生效", config: runtimeConfig };
  }
  const portsChanged = next.httpPort !== previous.httpPort || next.wsPort !== previous.wsPort;
  if (!portsChanged) {
    saveRuntimeConfig(next);
    backendStatus = { ok: true, message: "配置已保存，端口未变更，无需重启后端" };
    return { ok: true, message: "配置已保存，端口未变更，无需重启后端", config: runtimeConfig };
  }
  const [httpAvailable, wsAvailable] = await Promise.all([
    next.httpPort === previous.httpPort ? true : canListenOnPort(next.httpPort),
    next.wsPort === previous.wsPort ? true : canListenOnPort(next.wsPort)
  ]);
  if (!httpAvailable) {
    backendStatus = { ok: false, message: `核心服务端口 ${next.httpPort} 已被占用` };
    return { ok: false, message: `核心服务端口 ${next.httpPort} 已被占用` };
  }
  if (!wsAvailable) {
    backendStatus = { ok: false, message: `核心WS服务端口 ${next.wsPort} 已被占用` };
    return { ok: false, message: `核心WS服务端口 ${next.wsPort} 已被占用` };
  }

  saveRuntimeConfig(next);
  const backendRef = stopEmbeddedBackend();
  await waitForBackendExit(backendRef);
  const started = await startEmbeddedBackend(next);
  if (!started) {
    saveRuntimeConfig(previous);
    await startEmbeddedBackend(previous);
    backendStatus = { ok: false, message: "应用配置失败，已回滚到旧配置" };
    return { ok: false, message: "应用配置失败，已回滚到旧配置" };
  }
  backendStatus = { ok: true, message: `配置已应用（HTTP:${next.httpPort} / WS:${next.wsPort}）` };
  return { ok: true, message: "配置已应用并重启后端", config: runtimeConfig };
}

function loadOverlayRoute(window, screen) {
  if (!window) return;
  if (!app.isPackaged) {
    const suffix = screen ? `/?screen=${encodeURIComponent(screen)}` : "";
    window.loadURL(`${OVERLAY_ORIGIN}${suffix}`);
    return;
  }
  const overlayPath = getOverlayIndexPath();
  const query = screen ? { screen } : undefined;
  window.loadFile(overlayPath, query ? { query } : undefined);
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (!mainWindow.isVisible()) mainWindow.show();
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
}

function hideMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.hide();
}

function createDebugWindow() {
  const appIcon = nativeImage.createFromPath(getIconPath("icon-512.png"));
  const debugWindow = new BrowserWindow({
    width: 560,
    height: 780,
    minWidth: 480,
    minHeight: 480,
    title: "NovaStrike Debug",
    transparent: true,
    backgroundColor: "#00000000",
    autoHideMenuBar: true,
    frame: false,
    icon: appIcon,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs")
    }
  });
  loadOverlayRoute(debugWindow, "debug");
}

function updateTrayMenu() {
  if (!tray) return;
  const visible = !!mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible();
  const onTop = !!mainWindow && !mainWindow.isDestroyed() && mainWindow.isAlwaysOnTop();
  const isDev = !app.isPackaged;
  const menuTemplate = [
    {
      label: visible ? "隐藏" : "显示",
      click: () => {
        if (visible) hideMainWindow();
        else showMainWindow();
        updateTrayMenu();
      }
    },
    {
      label: onTop ? "取消置顶" : "置顶",
      click: () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop(), "screen-saver");
        updateTrayMenu();
      }
    },
    {
      label: uiPrefs.showOverlayHeader ? "隐藏顶部信息区" : "显示顶部信息区",
      click: () => {
        uiPrefs = { ...uiPrefs, showOverlayHeader: !uiPrefs.showOverlayHeader };
        saveUiPrefs(uiPrefs);
        BrowserWindow.getAllWindows().forEach((win) => {
          if (!win.isDestroyed()) win.webContents.send("ui:overlay-header-visible-changed", uiPrefs.showOverlayHeader);
        });
        updateTrayMenu();
      }
    }
  ];
  if (isDev) {
    menuTemplate.push({
      label: "调试面板",
      click: () => createDebugWindow()
    });
  }
  menuTemplate.push({ type: "separator" }, { label: "退出", click: () => app.quit() });
  tray.setContextMenu(Menu.buildFromTemplate(menuTemplate));
}

function createTray() {
  const icon = nativeImage.createFromPath(getIconPath("tray-32.png"));
  tray = new Tray(icon);
  tray.setToolTip("NovaStrike");
  tray.on("click", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isVisible()) hideMainWindow();
    else showMainWindow();
    updateTrayMenu();
  });
  updateTrayMenu();
}

function createWindow() {
  const restoredState = loadWindowState();
  const appIcon = nativeImage.createFromPath(getIconPath("icon-512.png"));
  mainWindow = new BrowserWindow({
    x: restoredState?.x,
    y: restoredState?.y,
    width: restoredState?.width ?? 556,
    height: restoredState?.height ?? 1000,
    minWidth: 556,
    minHeight: 480,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    title: "NovaStrike",
    icon: appIcon,
    backgroundColor: "#00000000",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  loadOverlayRoute(mainWindow);
  mainWindow.on("show", () => updateTrayMenu());
  mainWindow.on("hide", () => updateTrayMenu());
  mainWindow.on("always-on-top-changed", () => updateTrayMenu());
  mainWindow.on("move", () => saveWindowState(mainWindow));
  mainWindow.on("resize", () => saveWindowState(mainWindow));
  mainWindow.on("close", () => saveWindowState(mainWindow));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isOverlayUrl(url) || url === "about:blank") {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 560,
          height: 780,
          minWidth: 480,
          minHeight: 100,
          title: "NovaStrike Debug",
          transparent: true,
          backgroundColor: "#00000000",
          autoHideMenuBar: true,
          frame: false,
          icon: appIcon,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, "preload.cjs")
          }
        }
      };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(async () => {
  runtimeConfig = loadRuntimeConfig();
  ipcMain.handle("window:minimize", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.minimize();
  });
  ipcMain.handle("window:toggle-maximize", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return false;
    if (window.isMaximized()) {
      window.unmaximize();
      return false;
    }
    window.maximize();
    return true;
  });
  ipcMain.handle("window:close", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    if (uiPrefs.closeBehavior === "hide") {
      window.hide();
      return;
    }
    window.close();
  });
  ipcMain.handle("window:get-close-behavior", () => uiPrefs.closeBehavior);
  ipcMain.handle("window:set-close-behavior", (_event, behavior) => {
    uiPrefs = { ...uiPrefs, closeBehavior: behavior === "hide" ? "hide" : "close" };
    saveUiPrefs(uiPrefs);
    return uiPrefs.closeBehavior;
  });
  ipcMain.handle("ui:get-overlay-header-visible", () => uiPrefs.showOverlayHeader);
  ipcMain.handle("ui:set-overlay-header-visible", (_event, visible) => {
    uiPrefs = { ...uiPrefs, showOverlayHeader: visible !== false };
    saveUiPrefs(uiPrefs);
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) win.webContents.send("ui:overlay-header-visible-changed", uiPrefs.showOverlayHeader);
    });
    updateTrayMenu();
    return uiPrefs.showOverlayHeader;
  });
  ipcMain.handle("window:get-always-on-top", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    return window?.isAlwaysOnTop() ?? false;
  });
  ipcMain.handle("window:toggle-always-on-top", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return false;
    const next = !window.isAlwaysOnTop();
    window.setAlwaysOnTop(next, "screen-saver");
    return next;
  });
  ipcMain.handle("app:get-version", () => app.getVersion());
  ipcMain.handle("runtime:get-config", () => runtimeConfig);
  ipcMain.handle("runtime:get-backend-status", () => backendStatus);
  ipcMain.handle("runtime:apply-config", async (_event, configPatch) => {
    return applyRuntimeConfig(configPatch ?? {});
  });
  ipcMain.handle("app:check-updates", async () => {
    const currentVersion = app.getVersion();
    const updateUrl = process.env.NOVASTRIKE_UPDATE_URL;
    if (!updateUrl) {
      return {
        ok: false,
        hasUpdate: false,
        currentVersion,
        message: "未配置更新源（设置 NOVASTRIKE_UPDATE_URL 后可在线检查）"
      };
    }

    try {
      const response = await fetch(updateUrl, { method: "GET" });
      if (!response.ok) {
        return {
          ok: false,
          hasUpdate: false,
          currentVersion,
          message: `更新源请求失败（HTTP ${response.status}）`
        };
      }
      const data = await response.json();
      const latestVersion = data?.version;
      if (!latestVersion) {
        return {
          ok: false,
          hasUpdate: false,
          currentVersion,
          message: "更新源数据格式错误：缺少 version"
        };
      }
      const hasUpdate = compareVersion(latestVersion, currentVersion) > 0;
      return {
        ok: true,
        hasUpdate,
        currentVersion,
        latestVersion,
        notes: data?.notes ?? "",
        downloadUrl: data?.url ?? "",
        message: hasUpdate ? `发现新版本 ${latestVersion}` : "当前已是最新版本"
      };
    } catch (error) {
      return {
        ok: false,
        hasUpdate: false,
        currentVersion,
        message: `检查更新失败：${String(error?.message ?? error)}`
      };
    }
  });

  const started = await startEmbeddedBackend(runtimeConfig);
  if (!started) {
    const fallback = saveRuntimeConfig(DEFAULT_RUNTIME_CONFIG);
    const fallbackStarted = await startEmbeddedBackend(fallback);
    backendStatus = fallbackStarted
      ? { ok: false, message: "检测到端口冲突，已自动回退到默认端口" }
      : { ok: false, message: "后端启动失败，请检查端口占用或配置" };
  }
  createWindow();
  createTray();

  globalShortcut.register("CommandOrControl+Shift+O", () => {
    if (!mainWindow) return;
    mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop(), "screen-saver");
    updateTrayMenu();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  stopEmbeddedBackend();
  globalShortcut.unregisterAll();
});
