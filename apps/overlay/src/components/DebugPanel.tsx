import { useState } from "react";

type DebugLog = {
  id: number;
  title: string;
  status: "ok" | "error";
  detail: string;
};

const BASE_URL = "http://127.0.0.1:37653";

async function callApi(path: string, method: "GET" | "POST") {
  const response = await fetch(`${BASE_URL}${path}`, { method });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path} failed(${response.status}): ${text}`);
  return text;
}

export function DebugPanel(props: { onBack: () => void }) {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);

  const appendLog = (log: Omit<DebugLog, "id">) => {
    setLogs((prev) => [{ ...log, id: Date.now() + Math.floor(Math.random() * 1000) }, ...prev].slice(0, 30));
  };

  const runAction = async (title: string, path: string, method: "GET" | "POST") => {
    setRunning(true);
    try {
      const result = await callApi(path, method);
      appendLog({ title, status: "ok", detail: result });
    } catch (error) {
      appendLog({ title, status: "error", detail: String((error as Error).message) });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div className="settings-header">
        <h2>调试面板</h2>
        <button className="ghost-btn" onClick={props.onBack} type="button">
          返回面板
        </button>
      </div>
      <div className="debug-actions">
        <button className="ghost-btn" disabled={running} onClick={() => runAction("健康检查", "/health", "GET")} type="button">
          GET /health
        </button>
        <button className="ghost-btn" disabled={running} onClick={() => runAction("最近 GSI", "/dev/gsi/last", "GET")} type="button">
          GET /dev/gsi/last
        </button>
        <button className="ghost-btn" disabled={running} onClick={() => runAction("最近10条 GSI", "/dev/gsi/recent", "GET")} type="button">
          GET /dev/gsi/recent
        </button>
        <button className="ghost-btn" disabled={running} onClick={() => runAction("最近50条事件", "/dev/events/recent", "GET")} type="button">
          GET /dev/events/recent
        </button>
        <button className="ghost-btn" disabled={running} onClick={() => runAction("同步 GSI", "/settings/sync-gsi", "POST")} type="button">
          POST /settings/sync-gsi
        </button>
      </div>
      <div className="debug-logs">
        {logs.length === 0 ? (
          <span className="debug-empty">尚无调试日志</span>
        ) : (
          logs.map((log) => (
            <div className={`debug-log ${log.status}`} key={log.id}>
              <strong>{log.title}</strong>
              <pre>{log.detail}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
