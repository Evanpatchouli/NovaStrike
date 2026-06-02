import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NovaStrikeSettings } from "./settings.types.js";

const DEFAULT_SETTINGS: NovaStrikeSettings = {
  steamLibraryPath: "",
  httpPort: 37653,
  wsPort: 37654
};

export class SettingsService {
  private readonly filePath: string;

  constructor(filePath = path.join(process.cwd(), ".codex", "runtime", "settings.json")) {
    this.filePath = filePath;
  }

  async getSettings(): Promise<NovaStrikeSettings> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<NovaStrikeSettings>;
      return {
        steamLibraryPath: typeof parsed.steamLibraryPath === "string" ? parsed.steamLibraryPath : "",
        httpPort:
          typeof parsed.httpPort === "number" && Number.isInteger(parsed.httpPort) && parsed.httpPort > 0 && parsed.httpPort <= 65535
            ? parsed.httpPort
            : DEFAULT_SETTINGS.httpPort,
        wsPort:
          typeof parsed.wsPort === "number" && Number.isInteger(parsed.wsPort) && parsed.wsPort > 0 && parsed.wsPort <= 65535
            ? parsed.wsPort
            : DEFAULT_SETTINGS.wsPort
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async updateSettings(input: Partial<NovaStrikeSettings>): Promise<NovaStrikeSettings> {
    const current = await this.getSettings();
    const next: NovaStrikeSettings = {
      steamLibraryPath: typeof input.steamLibraryPath === "string" ? input.steamLibraryPath.trim() : current.steamLibraryPath,
      httpPort:
        typeof input.httpPort === "number" && Number.isInteger(input.httpPort) && input.httpPort > 0 && input.httpPort <= 65535
          ? input.httpPort
          : current.httpPort,
      wsPort:
        typeof input.wsPort === "number" && Number.isInteger(input.wsPort) && input.wsPort > 0 && input.wsPort <= 65535
          ? input.wsPort
          : current.wsPort
    };
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(next, null, 2), "utf8");
    return next;
  }
}
