import { useEffect, useState } from "react";
import { sleep } from "@nova-strike/shared";
import { getSettings, saveSettings, syncGsi } from "../lib/http";

export function SettingsPage(props: { onBack: () => void }) {
  const [steamLibraryPath, setSteamLibraryPath] = useState("");
  const [status, setStatus] = useState("加载中...");
  const [targetPath, setTargetPath] = useState("");
  const [saving, setSaving] = useState(false);
  const [transparentOpacityPercent, setTransparentOpacityPercent] = useState(100);
  const [closeBehavior, setCloseBehavior] = useState<"close" | "hide">("close");
  const [showOverlayHeader, setShowOverlayHeader] = useState(true);
  const [appVersion, setAppVersion] = useState("-");
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateBadge, setUpdateBadge] = useState<{ type: "latest" | "update" | "unknown"; text: string }>({
    type: "unknown",
    text: ""
  });

  useEffect(() => {
    void (async () => {
      try {
        const result = await getSettings();
        setSteamLibraryPath(result.settings.steamLibraryPath);
        setStatus(result.gsiSync.message);
        setTargetPath(result.gsiSync.targetPath ?? "");
      } catch (error) {
        setStatus(`加载失败：${String((error as Error).message)}`);
      }
    })();
  }, []);

  useEffect(() => {
    void window.novaWindow?.getCloseBehavior().then((behavior) => {
      setCloseBehavior(behavior);
    });
  }, []);

  useEffect(() => {
    void window.novaWindow?.getOverlayHeaderVisible().then((visible) => {
      setShowOverlayHeader(visible);
    });
  }, []);

  useEffect(() => {
    void window.novaWindow?.getAppVersion().then((version) => {
      setAppVersion(version);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await window.novaWindow?.checkUpdates();
      if (cancelled || !result) return;
      if (result.ok && result.hasUpdate) {
        const nextVersion = result.latestVersion ?? "?";
        setUpdateBadge({ type: "update", text: `有新版本 ${nextVersion}` });
        return;
      }
      if (result.ok) {
        setUpdateBadge({ type: "latest", text: "已是最新版本" });
        return;
      }
      setUpdateBadge({ type: "unknown", text: "" });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const savedOpacity = window.localStorage.getItem("novastrike:transparent-opacity");
    const opacityPercent = Number(savedOpacity);
    const normalizedPercent = Number.isFinite(opacityPercent) ? Math.min(100, Math.max(0, opacityPercent)) : 15;
    setTransparentOpacityPercent(normalizedPercent);
  }, []);

  const handleTransparentOpacityChange = (value: number) => {
    const normalizedPercent = Math.min(100, Math.max(0, value));
    const normalized = normalizedPercent / 100;
    setTransparentOpacityPercent(value);
    window.localStorage.setItem("novastrike:transparent-opacity", String(normalizedPercent));
    document.documentElement.style.setProperty("--overlay-transparent-opacity", normalized.toFixed(2));
  };

  const handleCloseBehaviorChange = async (behavior: "close" | "hide") => {
    setCloseBehavior(behavior);
    await window.novaWindow?.setCloseBehavior(behavior);
  };

  const handleOverlayHeaderToggle = async (checked: boolean) => {
    setShowOverlayHeader(checked);
    await window.novaWindow?.setOverlayHeaderVisible(checked);
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateMessage("检查中...");
    try {
      const [result] = await Promise.all([window.novaWindow?.checkUpdates(), sleep(500)]);
      if (result?.ok && result.hasUpdate) {
        const nextVersion = result.latestVersion ?? "?";
        setUpdateBadge({ type: "update", text: `有新版本 ${nextVersion}` });
      } else if (result?.ok) {
        setUpdateBadge({ type: "latest", text: "已是最新版本" });
      } else {
        setUpdateBadge({ type: "unknown", text: "" });
      }
      setUpdateMessage(result?.message ?? "检查更新失败");
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveSettings(steamLibraryPath);
      setStatus(result.gsiSync.message);
      setTargetPath(result.gsiSync.targetPath ?? "");
    } catch (error) {
      setStatus(`保存失败：${String((error as Error).message)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSaving(true);
    try {
      const result = await syncGsi();
      setStatus(result.gsiSync.message);
      setTargetPath(result.gsiSync.targetPath ?? "");
    } catch (error) {
      setStatus(`同步失败：${String((error as Error).message)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="settings-header">
        <h2>设置</h2>
        <button className="ghost-btn" onClick={props.onBack} type="button">
          返回面板
        </button>
      </div>
      <label className="field-label" htmlFor="steam-library-path">
        CS2 所在 Steam 库目录（含 steamapps/common）
      </label>
      <input
        className="text-input"
        id="steam-library-path"
        onChange={(event) => setSteamLibraryPath(event.target.value)}
        placeholder="例如：D:\\SteamLibrary"
        type="text"
        value={steamLibraryPath}
      />
      <div className="settings-actions">
        <button className="primary-btn" disabled={saving || !steamLibraryPath.trim()} onClick={handleSave} type="button">
          保存并同步
        </button>
        <button className="ghost-btn" disabled={saving} onClick={handleSync} type="button">
          立即同步 GSI
        </button>
      </div>
      <div className="settings-status">
        <strong>同步状态</strong>
        <span>{status}</span>
        {targetPath ? <code>{targetPath}</code> : null}
      </div>
      <hr className="settings-divider" />
      <div className="settings-opacity">
        <label className="field-label" htmlFor="transparent-opacity">
          透明模式透明度（100% = 无透明）：{transparentOpacityPercent}%
        </label>
        <input
          className="opacity-slider"
          id="transparent-opacity"
          max={100}
          min={0}
          onChange={(event) => handleTransparentOpacityChange(Number(event.target.value))}
          type="range"
          value={transparentOpacityPercent}
        />
      </div>
      <div className="settings-opacity">
        <label className="field-label" htmlFor="close-behavior">
          Window Bar 关闭按钮行为
        </label>
        <select
          className="text-input"
          id="close-behavior"
          onChange={(event) => void handleCloseBehaviorChange(event.target.value as "close" | "hide")}
          value={closeBehavior}
        >
          <option value="close">关闭应用</option>
          <option value="hide">隐藏到后台</option>
        </select>
      </div>
      <div className="settings-opacity">
        <label className="field-label" htmlFor="overlay-header-visible">
          顶部信息区显示
        </label>
        <label className="switch-row" htmlFor="overlay-header-visible">
          <input
            checked={showOverlayHeader}
            id="overlay-header-visible"
            onChange={(event) => void handleOverlayHeaderToggle(event.target.checked)}
            type="checkbox"
          />
          <span>{showOverlayHeader ? "显示" : "隐藏"}</span>
        </label>
      </div>
      <div className="settings-opacity">
        <label className="field-label">版本信息</label>
        <div className="settings-version-row">
          <span>
            当前版本：{appVersion}
            {updateBadge.text ? (
              <em className={`version-badge ${updateBadge.type}`}>{updateBadge.text}</em>
            ) : null}
          </span>
          <button className="ghost-btn" disabled={checkingUpdate} onClick={() => void handleCheckUpdates()} type="button">
            {checkingUpdate ? (
              <>
                <i className="btn-spinner" />
                检查中...
              </>
            ) : (
              "检查更新"
            )}
          </button>
        </div>
        {updateMessage ? <div className="settings-version-msg">{updateMessage}</div> : null}
      </div>
    </div>
  );
}
