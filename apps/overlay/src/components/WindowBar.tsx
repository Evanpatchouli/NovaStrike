import { useEffect, useState } from "react";

export function WindowBar() {
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [transparentMode, setTransparentMode] = useState(false);
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    let mounted = true;
    void window.novaWindow?.getAlwaysOnTop().then((value) => {
      if (mounted) setAlwaysOnTop(value);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("novastrike:transparent-mode");
    const enabled = saved === "1";
    setTransparentMode(enabled);
    document.body.classList.toggle("overlay-transparent", enabled);

    const savedOpacity = window.localStorage.getItem("novastrike:transparent-opacity");
    const opacityPercent = Number(savedOpacity);
    const normalizedPercent = Number.isFinite(opacityPercent) ? Math.min(100, Math.max(0, opacityPercent)) : 30;
    document.documentElement.style.setProperty("--overlay-transparent-opacity", (normalizedPercent / 100).toFixed(2));
  }, []);

  function toggleTransparentMode() {
    setTransparentMode((prev) => {
      const next = !prev;
      document.body.classList.toggle("overlay-transparent", next);
      window.localStorage.setItem("novastrike:transparent-mode", next ? "1" : "0");
      return next;
    });
  }

  if (!window.novaWindow) return null;

  const openSettings = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("screen", "settings");
    window.location.href = url.toString();
  };

  const openDebug = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("screen", "debug");
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="window-bar">
      <div className="window-title">NovaStrike</div>
      <div className="window-actions">
        {isDev ? (
          <button className="window-btn" onClick={openDebug} title="打开调试面板" type="button">
            <i className="bi bi-bug window-icon" />
          </button>
        ) : null}
        <button className="window-btn" onClick={openSettings} title="打开设置" type="button">
          <i className="bi bi-gear window-icon" />
        </button>
        <button
          className={`window-btn ${transparentMode ? "active" : ""}`}
          onClick={toggleTransparentMode}
          title={transparentMode ? "切换为深色背景" : "切换为透明背景"}
          type="button"
        >
          <i className="bi bi-circle-half window-icon" />
        </button>
        <button
          className={`window-btn ${alwaysOnTop ? "active" : ""}`}
          onClick={() =>
            void window.novaWindow?.toggleAlwaysOnTop().then((next) => {
              setAlwaysOnTop(next);
            })
          }
          title={alwaysOnTop ? "取消置顶" : "置顶窗口"}
          type="button"
        >
          <i className="bi bi-pin-angle window-icon" />
        </button>
        <button className="window-btn" onClick={() => void window.novaWindow?.minimize()} type="button">
          <i className="bi bi-dash-lg window-icon" />
        </button>
        <button className="window-btn" onClick={() => void window.novaWindow?.toggleMaximize()} type="button">
          <i className="bi bi-square window-icon" />
        </button>
        <button className="window-btn danger" onClick={() => void window.novaWindow?.close()} type="button">
          <i className="bi bi-x-lg window-icon" />
        </button>
      </div>
    </div>
  );
}
