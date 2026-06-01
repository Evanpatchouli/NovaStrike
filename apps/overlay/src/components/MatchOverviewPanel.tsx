import type { AppSnapshot } from "@nova-strike/shared";
import { CardCollapseButton } from "./CardCollapseButton";
import { FeelTag } from "./FeelTag";
import { Tag } from "./Tag";
import { TagGroup } from "./TagGroup";
import { usePersistedCollapsed } from "./usePersistedCollapsed";

export function MatchOverviewPanel(props: { snapshot: AppSnapshot }) {
  const [collapsed, setCollapsed] = usePersistedCollapsed("match-overview");
  const connected = props.snapshot.connected;
  const rounds = Math.max(1, props.snapshot.round ?? 0);
  const player = props.snapshot.player;
  const avgFlashedPerRound = (player?.totalFlashedCount ?? 0) / rounds;
  const avgBurningDamagePerRound = (player?.totalBurningDamageCount ?? 0) / rounds;
  const showFlashWarning = avgFlashedPerRound >= 0.8;
  const showBurnWarning = avgBurningDamagePerRound >= 0.3;
  const kdRaw = `${player?.totalKills ?? 0}/${player?.totalDeaths ?? 0}`;

  return (
    <section className="card overview-card">
      <div className="card-head">
        <h3>对局概览</h3>
        <div className="card-head-actions">
          {collapsed ? (
            <TagGroup inline uniform>
              <Tag tone="muted">K/D {kdRaw}</Tag>
              <FeelTag recentRoundKd={player?.totalKd ? [player.totalKd] : player?.recentRoundKd} />
              {showFlashWarning ? <Tag tone="warn">注意被闪</Tag> : null}
              {showBurnWarning ? <Tag tone="danger">注意防火</Tag> : null}
            </TagGroup>
          ) : null}
          <Tag unstyled className={`conn-pill ${connected ? "online" : "offline"}`}>
            {connected ? <i className="conn-dot" /> : null}
            {connected ? "已连接" : "未连接"}
          </Tag>
          <CardCollapseButton collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
        </div>
      </div>
      {!collapsed ? <div className="overview-grid">
        <div className="tempo-item">
          <span>总击杀</span>
          <strong>{player?.totalKills ?? "-"}</strong>
        </div>
        <div className="tempo-item">
          <span>总死亡</span>
          <strong>{player?.totalDeaths ?? "-"}</strong>
        </div>
        <div className="tempo-item">
          <span>总 K/D</span>
          <strong>{typeof player?.totalKd === "number" ? player.totalKd.toFixed(2) : "-"}</strong>
        </div>
        <div className="tempo-item">
          <span>总被致盲数</span>
          <strong>{player?.totalFlashedCount ?? 0}</strong>
        </div>
        <div className="tempo-item">
          <span>总燃烧受伤次数</span>
          <strong>{player?.totalBurningDamageCount ?? 0}</strong>
        </div>
        <div className="tempo-item">
          <span>总藏烟次数</span>
          <strong>{player?.totalSmokedCount ?? 0}</strong>
        </div>
      </div> : null}
      {!collapsed ? <TagGroup uniform>
        <Tag tone="muted">K/D {kdRaw}</Tag>
        <FeelTag recentRoundKd={player?.totalKd ? [player.totalKd] : player?.recentRoundKd} />
        {showFlashWarning ? <Tag tone="warn">注意被闪</Tag> : null}
        {showBurnWarning ? <Tag tone="danger">注意防火</Tag> : null}
      </TagGroup> : null}
    </section>
  );
}
