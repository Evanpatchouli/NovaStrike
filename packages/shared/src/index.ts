export type PlayerSnapshot = {
  health?: number;
  armor?: number;
  helmet?: boolean;
  defusekit?: boolean;
  flashed?: number;
  smoked?: number;
  burning?: number;
  money?: number;
  equipValue?: number;
  roundKills?: number;
  roundKillHs?: number;
  recentRoundKd?: number[];
  totalKills?: number;
  totalDeaths?: number;
  totalKd?: number;
  totalFlashedCount?: number;
  totalBurningDamageCount?: number;
  totalSmokedCount?: number;
  activeWeapon?: string;
};
export type AppSnapshot = { connected: boolean; lastGsiAt?: number; map?: string; round?: number; roundPhase?: string; player?: PlayerSnapshot };
export type PlayerEventKind = "health_change" | "money_change" | "status_change" | "weapon_switch";
export type PlayerEvent = {
  id: string;
  at: number;
  kind: PlayerEventKind;
  message: string;
};
export type ServerMessage =
  | { type: "snapshot"; payload: AppSnapshot }
  | { type: "player:events"; payload: PlayerEvent[] }
  | { type: "heartbeat"; payload: { now: number } };

export function sleep(ms: number): Promise<void> {
  const duration = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}
