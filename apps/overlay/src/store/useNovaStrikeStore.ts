import type { AppSnapshot, PlayerEvent, ServerMessage } from "@nova-strike/shared";
import { create } from "zustand";
type NovaStrikeState = {
  snapshot: AppSnapshot;
  events: PlayerEvent[];
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
  applyMessage: (message: ServerMessage) => void;
};
export const useNovaStrikeStore = create<NovaStrikeState>((set) => ({
  snapshot: { connected: false },
  events: [],
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
  applyMessage: (message) => {
    if (message.type === "snapshot") set({ snapshot: message.payload });
    if (message.type === "player:events") set((state) => ({ events: [...message.payload, ...state.events].slice(0, 100) }));
  }
}));
