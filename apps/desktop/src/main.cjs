const { app, BrowserWindow, Menu, Tray, nativeImage, globalShortcut, shell, ipcMain } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const OVERLAY_ORIGIN = "http://127.0.0.1:5173";
let mainWindow;
let tray;

function getIconPath(fileName) {
  return path.join(__dirname, "..", "assets", fileName);
}

function getUiPrefsPath() {
  return path.join(app.getPath("userData"), "ui-prefs.json");
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
  return url.startsWith(OVERLAY_ORIGIN);
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
  debugWindow.loadURL(`${OVERLAY_ORIGIN}/?screen=debug`);
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

  mainWindow.loadURL(OVERLAY_ORIGIN);
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

app.whenReady().then(() => {
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
  globalShortcut.unregisterAll();
});
