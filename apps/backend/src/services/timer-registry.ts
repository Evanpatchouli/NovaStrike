import type { AppSnapshot } from "@nova-strike/shared";
export class TimerRegistry {
  private connected = false;
  private lastGsiAt: number | undefined;
  private map: string | undefined;
  private round: number | undefined;
  private roundPhase: string | undefined;
  private player: AppSnapshot["player"] | undefined;
  markGsiReceived(input: { map?: string; round?: number; roundPhase?: string; player?: AppSnapshot["player"] }) { this.connected = true; this.lastGsiAt = Date.now(); this.map = input.map ?? this.map; this.round = input.round ?? this.round; this.roundPhase = input.roundPhase ?? this.roundPhase; this.player = input.player ?? this.player; }
  sweep(now = Date.now()) {
    if (this.lastGsiAt && now - this.lastGsiAt > 10000) this.connected = false;
  }
  getSnapshot(): AppSnapshot { return { connected: this.connected, lastGsiAt: this.lastGsiAt, map: this.map, round: this.round, roundPhase: this.roundPhase, player: this.player }; }
}
