import type { PlayerEvent } from "@nova-strike/shared";
import type { GsiPayload } from "../domain/gsi.js";

function makeEvent(kind: PlayerEvent["kind"], message: string, at = Date.now()): PlayerEvent {
  return { id: `${kind}:${at}:${Math.floor(Math.random() * 1000)}`, at, kind, message };
}

export class PlayerStateEventsService {
  private readonly recentEvents: PlayerEvent[] = [];

  getRecentEvents(limit = 50) {
    return this.recentEvents.slice(0, Math.max(1, limit));
  }

  collect(payload: GsiPayload): PlayerEvent[] {
    const now = Date.now();
    const events: PlayerEvent[] = [];
    const prevState = payload.previously?.player?.state;
    const state = payload.player?.state;

    if (prevState && state) {
      if (typeof prevState.health === "number" && typeof state.health === "number" && prevState.health !== state.health) {
        events.push(makeEvent("health_change", `生命值 ${prevState.health} -> ${state.health}`, now));
      }
      if (typeof prevState.money === "number" && typeof state.money === "number" && prevState.money !== state.money) {
        events.push(makeEvent("money_change", `经济 ${prevState.money} -> ${state.money}`, now));
      }
      if (typeof prevState.flashed === "number" && typeof state.flashed === "number" && prevState.flashed !== state.flashed) {
        events.push(makeEvent("status_change", `致盲值 ${prevState.flashed} -> ${state.flashed}`, now));
      }
      if (typeof prevState.burning === "number" && typeof state.burning === "number" && prevState.burning !== state.burning) {
        events.push(makeEvent("status_change", `燃烧值 ${prevState.burning} -> ${state.burning}`, now));
      }
      if (typeof prevState.smoked === "number" && typeof state.smoked === "number" && prevState.smoked !== state.smoked) {
        events.push(makeEvent("status_change", `烟雾影响 ${prevState.smoked} -> ${state.smoked}`, now));
      }
    }

    const prevWeapons = payload.previously?.player?.weapons;
    const weapons = payload.player?.weapons;
    if (prevWeapons && weapons) {
      const activeWeapon = Object.values(weapons).find((weapon) => weapon.state === "active");
      for (const [slot, prevWeapon] of Object.entries(prevWeapons)) {
        const currentWeapon = weapons[slot];
        if (prevWeapon.state === "active" && currentWeapon?.state === "holstered" && activeWeapon?.name) {
          events.push(makeEvent("weapon_switch", `切换武器：${currentWeapon.name ?? slot} -> ${activeWeapon.name}`, now));
        }
      }
    }

    if (events.length > 0) {
      this.recentEvents.unshift(...events);
      if (this.recentEvents.length > 200) this.recentEvents.length = 200;
    }

    return events;
  }
}
