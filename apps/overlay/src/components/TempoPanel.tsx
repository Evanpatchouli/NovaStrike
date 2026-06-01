import type { AppSnapshot } from "@nova-strike/shared";
import { CardCollapseButton } from "./CardCollapseButton";
import { FeelTag } from "./FeelTag";
import { TagGroup } from "./TagGroup";
import { usePersistedCollapsed } from "./usePersistedCollapsed";

const phaseLabels: Array<{ key: string; label: string }> = [
  { key: "warmup", label: "热身" },
  { key: "live", label: "进行中" },
  { key: "freezetime", label: "冻结时间" },
  { key: "over", label: "回合结束" },
  { key: "bomb", label: "炸弹阶段" }
];

const mapLabels: Array<{ key: string; label: string }> = [
  { key: "de_dust2", label: "炙热沙城 II" },
  { key: "de_mirage", label: "荒漠迷城" },
  { key: "de_inferno", label: "炼狱小镇" },
  { key: "de_nuke", label: "核子危机" },
  { key: "de_overpass", label: "死亡游乐园" },
  { key: "de_ancient", label: "远古遗迹" },
  { key: "de_anubis", label: "阿努比斯" },
  { key: "de_vertigo", label: "殒命大厦" },
  { key: "de_train", label: "列车停放站" },
  { key: "cs_office", label: "办公室" },
  { key: "cs_italy", label: "意大利小镇" }
];

function toPhaseLabel(phase?: string) {
  if (!phase) return "-";
  return phaseLabels.find((item) => item.key === phase)?.label ?? phase;
}

function toMapLabel(map?: string) {
  if (!map) return "-";
  return mapLabels.find((item) => item.key === map)?.label ?? map;
}

function toEfficiencyLabel(kills?: number, headshots?: number) {
  if (!kills || kills <= 0) return "-";
  return `${Math.round(((headshots ?? 0) / kills) * 100)}%`;
}

export function TempoPanel(props: { snapshot: AppSnapshot }) {
  const [collapsed, setCollapsed] = usePersistedCollapsed("tempo");
  const player = props.snapshot.player;
  const kdTrailText =
    player?.recentRoundKd && player.recentRoundKd.length > 0 ? player.recentRoundKd.map((item) => item.toFixed(2)).join(" / ") : "-";

  return (
    <section className="card">
      <div className="card-head">
        <h3>回合节奏</h3>
        <CardCollapseButton collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      </div>
      {!collapsed ? (
        <div className="tempo-inline">
          <div className="tempo-item tempo-item-map">
            <span>地图</span>
            <strong>{toMapLabel(props.snapshot.map)}</strong>
          </div>
          <div className="tempo-item">
            <span>回合</span>
            <strong>{typeof props.snapshot.round === "number" ? props.snapshot.round : "-"}</strong>
          </div>
          <div className="tempo-item">
            <span>阶段</span>
            <strong>{toPhaseLabel(props.snapshot.roundPhase)}</strong>
          </div>
        </div>
      ) : null}
      {!collapsed ? (
        <div className="tempo-inline tempo-inline-spaced">
          <div className="tempo-item">
            <span>击杀</span>
            <strong>{player?.roundKills ?? "-"}</strong>
          </div>
          <div className="tempo-item">
            <span>爆头击杀</span>
            <strong>{player?.roundKillHs ?? "-"}</strong>
          </div>
          <div className="tempo-item tempo-item-map">
            <span className="metric-label-with-help">
              击杀效率
              <i className="help-tip" data-tip="爆头率，狙击手请无视" aria-label="爆头率，狙击手请无视">
                ?
              </i>
            </span>
            <strong>{toEfficiencyLabel(player?.roundKills, player?.roundKillHs)}</strong>
          </div>
        </div>
      ) : null}
      {!collapsed ? (
        <div className="hint-block">
          <div className="hint">最近 3 回合 K/D: {kdTrailText}</div>
          <TagGroup>
            <FeelTag recentRoundKd={player?.recentRoundKd} />
          </TagGroup>
        </div>
      ) : null}
    </section>
  );
}
