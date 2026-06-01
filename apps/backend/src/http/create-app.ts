import cors from "@fastify/cors";
import Fastify from "fastify";
import { z } from "zod";
import type { GsiPayload } from "../domain/gsi.js";
import { GsiSyncService } from "../modules/settings/gsi-sync.service.js";
import { SettingsService } from "../modules/settings/settings.service.js";
import { GsiService } from "../services/gsi-service.js";
import { TimerRegistry } from "../services/timer-registry.js";
import { WsHub } from "../ws/ws-hub.js";
export function createApp(input: {
  registry: TimerRegistry;
  gsi: GsiService;
  ws: WsHub;
  settingsService: SettingsService;
  gsiSyncService: GsiSyncService;
}) {
  const settingsSchema = z.object({ steamLibraryPath: z.string().min(1) });
  const app = Fastify({ logger: { level: "info" } });
  app.register(cors, { origin: true });
  app.get("/health", async () => ({ ok: true, name: "NovaStrike", snapshot: input.registry.getSnapshot() }));
  app.get("/settings", async () => {
    const settings = await input.settingsService.getSettings();
    const gsiSync = await input.gsiSyncService.sync(settings.steamLibraryPath);
    return { ok: true, settings, gsiSync };
  });
  app.post("/settings", async (request, reply) => {
    const parsed = settingsSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: "invalid_settings" });
    const settings = await input.settingsService.updateSettings(parsed.data);
    const gsiSync = await input.gsiSyncService.sync(settings.steamLibraryPath);
    return { ok: true, settings, gsiSync };
  });
  app.post("/settings/sync-gsi", async () => {
    const settings = await input.settingsService.getSettings();
    const gsiSync = await input.gsiSyncService.sync(settings.steamLibraryPath);
    return { ok: true, settings, gsiSync };
  });
  app.get("/dev/gsi/last", async () => {
    return { ok: true, payload: input.gsi.getLastPayload() ?? null };
  });
  app.get("/dev/gsi/recent", async () => {
    return { ok: true, payloads: input.gsi.getRecentPayloads(10) };
  });
  app.get("/dev/events/recent", async () => {
    return { ok: true, events: input.gsi.getRecentEvents(50) };
  });
  app.post("/gsi", async (request, reply) => {
    const events = input.gsi.process(request.body as GsiPayload);
    input.ws.broadcast({ type: "snapshot", payload: input.registry.getSnapshot() });
    if (events.length > 0) input.ws.broadcast({ type: "player:events", payload: events });
    return reply.code(200).send({ ok: true });
  });
  return app;
}
