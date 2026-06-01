import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NovaStrikeSettings } from "./settings.types.js";

const DEFAULT_SETTINGS: NovaStrikeSettings = {
  steamLibraryPath: ""
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
        steamLibraryPath: typeof parsed.steamLibraryPath === "string" ? parsed.steamLibraryPath : ""
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async updateSettings(input: Partial<NovaStrikeSettings>): Promise<NovaStrikeSettings> {
    const current = await this.getSettings();
    const next: NovaStrikeSettings = {
      steamLibraryPath: typeof input.steamLibraryPath === "string" ? input.steamLibraryPath.trim() : current.steamLibraryPath
    };
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(next, null, 2), "utf8");
    return next;
  }
}
