import { env } from "./config/env.js";
import { createApp } from "./http/create-app.js";
import { GsiSyncService } from "./modules/settings/gsi-sync.service.js";
import { SettingsService } from "./modules/settings/settings.service.js";
import { GsiService } from "./services/gsi-service.js";
import { PlayerStateEventsService } from "./services/player-state-events.service.js";
import { TimerRegistry } from "./services/timer-registry.js";
import { WsHub } from "./ws/ws-hub.js";
const registry = new TimerRegistry();
const settingsService = new SettingsService();
const gsiSyncService = new GsiSyncService();
const playerEvents = new PlayerStateEventsService();
const ws = new WsHub({ host: env.wsHost, port: env.wsPort });
const gsi = new GsiService(registry, playerEvents);
const app = createApp({ registry, gsi, ws, settingsService, gsiSyncService });
ws.onConnection((socket) => {
  ws.send(socket, { type: "snapshot", payload: registry.getSnapshot() });
  ws.send(socket, { type: "player:events", payload: gsi.getRecentEvents(30) });
});
setInterval(() => {
  registry.sweep();
  ws.broadcast({ type: "snapshot", payload: registry.getSnapshot() });
  ws.broadcast({ type: "heartbeat", payload: { now: Date.now() } });
}, 250);

const settings = await settingsService.getSettings();
const gsiSyncResult = await gsiSyncService.sync(settings.steamLibraryPath);
app.log.info({ gsiSyncResult }, "GSI config startup check");

await app.listen({ host: env.httpHost, port: env.httpPort });
app.log.info(`NovaStrike backend listening on http://${env.httpHost}:${env.httpPort}`);
app.log.info(`NovaStrike websocket listening on ws://${env.wsHost}:${env.wsPort}`);
