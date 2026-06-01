export type GsiWeapon = {
  name?: string;
  type?: string;
  state?: "active" | "holstered" | "reloading" | string;
  ammo_reserve?: number;
  ammo_clip?: number;
  ammo_clip_max?: number;
};
export type GsiPlayerState = {
  health?: number;
  armor?: number;
  helmet?: boolean;
  defusekit?: boolean;
  flashed?: number;
  smoked?: number;
  burning?: number;
  money?: number;
  equip_value?: number;
  round_kills?: number;
  round_killhs?: number;
};
export type GsiPlayerMatchStats = {
  kills?: number;
  assists?: number;
  deaths?: number;
  mvps?: number;
  score?: number;
};
export type GsiPayload = {
  provider?: { name?: string; appid?: number; version?: number; timestamp?: number };
  map?: { name?: string; phase?: string; round?: number };
  round?: { phase?: string };
  phase_countdowns?: { phase?: string; phase_ends_in?: string };
  player?: {
    steamid?: string;
    name?: string;
    activity?: string;
    state?: GsiPlayerState;
    match_stats?: GsiPlayerMatchStats;
    weapons?: Record<string, GsiWeapon>;
  };
  previously?: {
    map?: { phase?: string };
    round?: { phase?: string };
    player?: {
      state?: Partial<GsiPlayerState>;
      weapons?: Record<string, Partial<GsiWeapon>>;
    };
  };
};
