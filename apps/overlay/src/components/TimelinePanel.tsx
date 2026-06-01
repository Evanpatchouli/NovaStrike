import type { PlayerEvent } from "@nova-strike/shared";
import { CardCollapseButton } from "./CardCollapseButton";
import { usePersistedCollapsed } from "./usePersistedCollapsed";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString();
}

export function TimelinePanel(props: { events: PlayerEvent[] }) {
  const [collapsed, setCollapsed] = usePersistedCollapsed("timeline");
  return (
    <section className="card">
      <div className="card-head">
        <h3>事件时间轴</h3>
        <CardCollapseButton collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      </div>
      {!collapsed ? <div className="timeline">
        {props.events.length === 0 ? (
          <span className="debug-empty">暂无事件</span>
        ) : (
          props.events.slice(0, 20).map((event) => (
            <div className="timeline-item" key={event.id}>
              <strong>{event.message}</strong>
              <span>{formatTime(event.at)}</span>
            </div>
          ))
        )}
      </div> : null}
    </section>
  );
}
