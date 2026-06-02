import { useEffect, useState } from "react";
import { DebugPanel } from "./components/DebugPanel";
import { EconomyPanel } from "./components/EconomyPanel";
import { MatchOverviewPanel } from "./components/MatchOverviewPanel";
import { SettingsPage } from "./components/SettingsPage";
import { TempoPanel } from "./components/TempoPanel";
import { TimelinePanel } from "./components/TimelinePanel";
import { initRuntimeConfig, getRuntimeConfig } from "./lib/http";
import { WindowBar } from "./components/WindowBar";
import { connectNovaStrikeWs, setWsPort } from "./lib/ws";
import { useNovaStrikeStore } from "./store/useNovaStrikeStore";

type Screen = "overlay" | "settings" | "debug";

function resolveInitialScreen(): Screen {
  const screen = new URLSearchParams(window.location.search).get("screen");
  if (screen === "settings" || screen === "debug") return screen;
  return "overlay";
}

export function App() {
  const { snapshot, events, wsConnected, setWsConnected, applyMessage } = useNovaStrikeStore();
  const [screen, setScreen] = useState<Screen>(() => resolveInitialScreen());
  const [showOverlayHeader, setShowOverlayHeader] = useState(true);
  const [runtimeReady, setRuntimeReady] = useState(false);
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    void (async () => {
      await initRuntimeConfig();
      const config = getRuntimeConfig();
      setWsPort(config.wsPort);
      setRuntimeReady(true);
    })();
  }, []);

  useEffect(
    () => {
      if (!runtimeReady) return;
      return (
      connectNovaStrikeWs({
        onOpen: () => setWsConnected(true),
        onClose: () => setWsConnected(false),
        onMessage: applyMessage,
      })
      );
    },
    [applyMessage, runtimeReady, setWsConnected],
  );

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    void window.novaWindow?.getOverlayHeaderVisible().then((visible) => {
      setShowOverlayHeader(visible);
    });
    unsubscribe = window.novaWindow?.onOverlayHeaderVisibleChange((visible) => {
      setShowOverlayHeader(visible);
    });
    return () => unsubscribe?.();
  }, []);

  if (screen === "settings") {
    return (
      <main className="shell">
        <section className="panel">
          <WindowBar />
          <div className="panel-content">
            <SettingsPage onBack={() => setScreen("overlay")} />
          </div>
        </section>
      </main>
    );
  }

  if (screen === "debug") {
    return (
      <main className="shell">
        <section className="panel">
          <WindowBar />
          <div className="panel-content">
            <DebugPanel onBack={() => setScreen("overlay")} />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="panel">
        <WindowBar />
        <div className="panel-content">
          <div className={`overlay-header ${showOverlayHeader ? "" : "overlay-header-hidden"}`}>
            <div className="brand">
              <div>
                <h1>NovaStrike</h1>
                <p>CS2 Practice Telemetry</p>
              </div>
              <div className={`status ${wsConnected ? "online" : "offline"}`}>
                {wsConnected ? "服务已连接" : "服务已断联"}
              </div>
            </div>
            <div className="toolbar">
              <button className="ghost-btn" onClick={() => setScreen("settings")} type="button">
                设置
              </button>
              {isDev ? (
                <a className="ghost-btn" href="/?screen=debug" rel="noreferrer" target="_blank">
                  调试
                </a>
              ) : null}
            </div>
          </div>
          <div className="layout-grid">
            <MatchOverviewPanel snapshot={snapshot} />
            <TempoPanel snapshot={snapshot} />
            <EconomyPanel snapshot={snapshot} />
            <TimelinePanel events={events} />
          </div>
        </div>
      </section>
    </main>
  );
}
