import { Tag } from "./Tag";

type FeelTagProps = {
  recentRoundKd?: number[];
};

function resolveFeel(recentRoundKd?: number[]) {
  if (!recentRoundKd || recentRoundKd.length === 0) return null;
  const avgKd = recentRoundKd.reduce((sum, item) => sum + item, 0) / recentRoundKd.length;
  if (avgKd < 0.8) return { label: "❄️手感冰凉", tone: "muted" as const };
  if (avgKd < 1) return { label: "💤手感欠佳", tone: "muted" as const };
  if (avgKd < 2) return { label: "✨手感良好", tone: "good" as const };
  if (avgKd < 2.5) return { label: "🔥手感火热", tone: "good" as const };
  if (avgKd < 3) return { label: "⚡神挡杀神", tone: "warn" as const };
  return { label: "☠️死神降临", tone: "danger" as const };
}

export function FeelTag(props: FeelTagProps) {
  const feel = resolveFeel(props.recentRoundKd);
  if (!feel) return null;

  return <Tag tone={feel.tone}>{feel.label}</Tag>;
}
