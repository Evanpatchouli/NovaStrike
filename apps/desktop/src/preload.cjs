const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("novaWindow", {
  getAlwaysOnTop: () => ipcRenderer.invoke("window:get-always-on-top"),
  toggleAlwaysOnTop: () => ipcRenderer.invoke("window:toggle-always-on-top"),
  getCloseBehavior: () => ipcRenderer.invoke("window:get-close-behavior"),
  setCloseBehavior: (behavior) => ipcRenderer.invoke("window:set-close-behavior", behavior),
  getOverlayHeaderVisible: () => ipcRenderer.invoke("ui:get-overlay-header-visible"),
  setOverlayHeaderVisible: (visible) => ipcRenderer.invoke("ui:set-overlay-header-visible", visible),
  onOverlayHeaderVisibleChange: (handler) => {
    const listener = (_event, visible) => handler(visible);
    ipcRenderer.on("ui:overlay-header-visible-changed", listener);
    return () => ipcRenderer.removeListener("ui:overlay-header-visible-changed", listener);
  },
  getAppVersion: () => ipcRenderer.invoke("app:get-version"),
  checkUpdates: () => ipcRenderer.invoke("app:check-updates"),
  minimize: () => ipcRenderer.invoke("window:minimize"),
  toggleMaximize: () => ipcRenderer.invoke("window:toggle-maximize"),
  close: () => ipcRenderer.invoke("window:close")
});
