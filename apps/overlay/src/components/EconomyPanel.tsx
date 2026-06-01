import type { AppSnapshot } from "@nova-strike/shared";
import { CardCollapseButton } from "./CardCollapseButton";
import { Tag } from "./Tag";
import { TagGroup } from "./TagGroup";
import { usePersistedCollapsed } from "./usePersistedCollapsed";

type RiskLevel = "safe" | "warning" | "danger";

function suggestEconomy(snapshot: AppSnapshot) {
  const money = snapshot.player?.money ?? 0;
  const equipValue = snapshot.player?.equipValue ?? 0;
  if (money < 2000 && equipValue < 3000) return "建议 ECO";
  if (money < 4300) return "建议半起";
  return "建议全起";
}

function evaluateStatusRisk(snapshot: AppSnapshot): { level: RiskLevel; reason: string } {
  const health = snapshot.player?.health ?? 0;
  const flashed = snapshot.player?.flashed ?? 0;
  const smoked = snapshot.player?.smoked ?? 0;
  const burning = snapshot.player?.burning ?? 0;

  if (burning > 0) return { level: "danger", reason: "燃烧中，优先脱离火区" };
  if (flashed >= 120) return { level: "danger", reason: "重度致盲，先拉开或找掩体" };
  if (health > 0 && health <= 35) return { level: "danger", reason: "低血量，建议保守处理枪位" };
  if (flashed > 0 || smoked > 0) return { level: "warning", reason: "视野受限，避免强行对枪" };
  return { level: "safe", reason: "状态稳定，可按默认节奏作战" };
}

function evaluatePurchaseRisk(snapshot: AppSnapshot): string {
  const money = snapshot.player?.money ?? 0;
  const equipValue = snapshot.player?.equipValue ?? 0;
  if (money <= 1200 && equipValue >= 4500) return "高风险购买：当前经济偏低但装备投入过高";
  if (money < 2000 && equipValue > 3500) return "购买偏激进：下回合经济可能断档";
  return "购买风险可控";
}

export function EconomyPanel(props: { snapshot: AppSnapshot }) {
  const [collapsed, setCollapsed] = usePersistedCollapsed("economy");
  const player = props.snapshot.player;
  const statusRisk = evaluateStatusRisk(props.snapshot);
  const buyRisk = evaluatePurchaseRisk(props.snapshot);
  return (
    <section className="card">
      <div className="card-head">
        <h3>经济与状态</h3>
        <CardCollapseButton collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      </div>
      {!collapsed ? <div className="tempo-inline">
        <div className="tempo-item tempo-item-map">
          <span>生命/护甲</span>
          <strong>
            {player?.health ?? "-"} / {player?.armor ?? "-"}
          </strong>
        </div>
        <div className="tempo-item">
          <span>经济 $</span>
          <strong>{player?.money ?? "-"}</strong>
        </div>
        <div className="tempo-item">
          <span>装备价值</span>
          <strong>{player?.equipValue ?? "-"}</strong>
        </div>
      </div> : null}
      {!collapsed ? <div className="hint-block">
        <div className="hint">{suggestEconomy(props.snapshot)}</div>
        <div className="hint">{buyRisk}</div>
      </div> : null}
      {!collapsed ? <div className={`risk-line risk-${statusRisk.level}`}>
        <span className="risk-badge">
          {statusRisk.level === "danger" ? "高风险" : statusRisk.level === "warning" ? "注意" : "稳定"}
        </span>
        <strong>{statusRisk.reason}</strong>
      </div> : null}
      {!collapsed ? <TagGroup>
        <Tag tone={player?.helmet ? "good" : "muted"}>头盔: {player?.helmet ? "有" : "无"}</Tag>
        <Tag tone={player?.defusekit ? "good" : "muted"}>
          拆弹器: {player?.defusekit ? "有" : "无"}
        </Tag>
        <Tag tone={player?.flashed ? "warn" : "muted"}>致盲: {player?.flashed ?? 0}</Tag>
        <Tag tone={player?.smoked ? "warn" : "muted"}>烟雾: {player?.smoked ?? 0}</Tag>
        <Tag tone={player?.burning ? "danger" : "muted"}>燃烧: {player?.burning ?? 0}</Tag>
      </TagGroup> : null}
    </section>
  );
}
