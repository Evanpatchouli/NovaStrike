import type { GsiPayload } from "../domain/gsi.js";
import { PlayerStateEventsService } from "./player-state-events.service.js";
import { TimerRegistry } from "./timer-registry.js";

export class GsiService {
  private lastPayload: GsiPayload | undefined;
  private readonly recentPayloads: GsiPayload[] = [];
  private lastRoundNumber: number | undefined;
  private lastRoundKills = 0;
  private lastMatchDeaths = 0;
  private readonly recentRoundKd: number[] = [];
  private totalFlashedCount = 0;
  private totalBurningDamageCount = 0;
  private totalSmokedCount = 0;
  private lastFlashed = 0;
  private lastSmoked = 0;
  private lastBurning = 0;
  private lastHealth: number | undefined;
  private lastMapName: string | undefined;

  private resetMatchCounters() {
    this.lastRoundNumber = undefined;
    this.lastRoundKills = 0;
    this.lastMatchDeaths = 0;
    this.recentRoundKd.length = 0;
    this.totalFlashedCount = 0;
    this.totalBurningDamageCount = 0;
    this.totalSmokedCount = 0;
    this.lastFlashed = 0;
    this.lastSmoked = 0;
    this.lastBurning = 0;
    this.lastHealth = undefined;
  }

  private collectImpactCounters(payload: GsiPayload) {
    const state = payload.player?.state;
    if (!state) return;

    const flashed = state.flashed ?? 0;
    const smoked = state.smoked ?? 0;
    const burning = state.burning ?? 0;
    const health = state.health;

    if (this.lastFlashed <= 0 && flashed > 0) this.totalFlashedCount += 1;
    if (this.lastSmoked <= 0 && smoked > 0) this.totalSmokedCount += 1;
    if (
      burning > 0 &&
      this.lastBurning > 0 &&
      typeof health === "number" &&
      typeof this.lastHealth === "number" &&
      health < this.lastHealth
    ) {
      this.totalBurningDamageCount += 1;
    }

    this.lastFlashed = flashed;
    this.lastSmoked = smoked;
    this.lastBurning = burning;
    this.lastHealth = health ?? this.lastHealth;
  }

  private finalizeRound(roundNumber?: number, stateRoundKills?: number, matchDeaths?: number) {
    if (typeof this.lastRoundNumber !== "number") {
      this.lastRoundNumber = roundNumber;
      this.lastRoundKills = stateRoundKills ?? 0;
      this.lastMatchDeaths = matchDeaths ?? 0;
      return;
    }

    if (typeof roundNumber === "number" && roundNumber !== this.lastRoundNumber) {
      const kills = this.lastRoundKills;
      const deathsThisRound = Math.max(0, (matchDeaths ?? this.lastMatchDeaths) - this.lastMatchDeaths);
      const kd = deathsThisRound === 0 ? kills : kills / deathsThisRound;
      this.recentRoundKd.unshift(Number(kd.toFixed(2)));
      if (this.recentRoundKd.length > 3) this.recentRoundKd.length = 3;
      this.lastRoundNumber = roundNumber;
    }

    this.lastRoundKills = stateRoundKills ?? this.lastRoundKills;
    this.lastMatchDeaths = matchDeaths ?? this.lastMatchDeaths;
  }

  constructor(
    private readonly registry: TimerRegistry,
    private readonly playerEvents: PlayerStateEventsService
  ) {}

  getLastPayload() {
    return this.lastPayload;
  }

  getRecentPayloads(limit = 10) {
    return this.recentPayloads.slice(0, Math.max(1, limit));
  }

  getRecentEvents(limit = 50) {
    return this.playerEvents.getRecentEvents(limit);
  }

  process(payload: GsiPayload) {
    if (this.lastMapName && payload.map?.name && this.lastMapName !== payload.map.name) this.resetMatchCounters();
    this.lastMapName = payload.map?.name ?? this.lastMapName;

    this.lastPayload = payload;
    this.recentPayloads.unshift(payload);
    if (this.recentPayloads.length > 10) this.recentPayloads.length = 10;
    const events = this.playerEvents.collect(payload);
    const activeWeapon = Object.values(payload.player?.weapons ?? {}).find((weapon) => weapon.state === "active");
    this.collectImpactCounters(payload);
    this.finalizeRound(payload.map?.round, payload.player?.state?.round_kills, payload.player?.match_stats?.deaths);
    const totalKills = payload.player?.match_stats?.kills;
    const totalDeaths = payload.player?.match_stats?.deaths;
    const totalKd =
      typeof totalKills === "number" && typeof totalDeaths === "number"
        ? Number((totalDeaths === 0 ? totalKills : totalKills / totalDeaths).toFixed(2))
        : undefined;
    this.registry.markGsiReceived({
      map: payload.map?.name,
      round: payload.map?.round,
      roundPhase: payload.round?.phase ?? payload.map?.phase,
      player: payload.player?.state
        ? {
            health: payload.player.state.health,
            armor: payload.player.state.armor,
            helmet: payload.player.state.helmet,
            defusekit: payload.player.state.defusekit,
            flashed: payload.player.state.flashed,
            smoked: payload.player.state.smoked,
            burning: payload.player.state.burning,
            money: payload.player.state.money,
            equipValue: payload.player.state.equip_value,
            roundKills: payload.player.state.round_kills,
            roundKillHs: payload.player.state.round_killhs,
            recentRoundKd: [...this.recentRoundKd],
            totalKills,
            totalDeaths,
            totalKd,
            totalFlashedCount: this.totalFlashedCount,
            totalBurningDamageCount: this.totalBurningDamageCount,
            totalSmokedCount: this.totalSmokedCount,
            activeWeapon: activeWeapon?.name
          }
        : undefined
    });
    return events;
  }
}
