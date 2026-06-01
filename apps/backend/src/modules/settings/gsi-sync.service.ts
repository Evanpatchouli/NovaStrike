import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GsiSyncResult } from "./settings.types.js";

const GSI_FILE_NAME = "gamestate_integration_novastrike.cfg";

export class GsiSyncService {
  private readonly sourceCfgPathCandidates: string[];

  constructor() {
    this.sourceCfgPathCandidates = [
      path.join(process.cwd(), "docs", GSI_FILE_NAME),
      path.resolve(process.cwd(), "..", "docs", GSI_FILE_NAME),
      path.resolve(process.cwd(), "..", "..", "docs", GSI_FILE_NAME)
    ];
  }

  async sync(steamLibraryPath: string): Promise<GsiSyncResult> {
    const trimmedPath = steamLibraryPath.trim();
    if (!trimmedPath) {
      return { status: "missing_steam_library_path", message: "请先在设置中配置 CS2 所在 Steam 库目录。" };
    }

    const targetDir = path.join(
      trimmedPath,
      "steamapps",
      "common",
      "Counter-Strike Global Offensive",
      "game",
      "csgo",
      "cfg"
    );
    const targetPath = path.join(targetDir, GSI_FILE_NAME);

    try {
      await access(targetDir);
    } catch {
      return {
        status: "missing_cs2_cfg_dir",
        message: `未找到 CS2 cfg 目录：${targetDir}。请检查 Steam 库目录配置。`,
        targetPath
      };
    }

    try {
      const sourcePath = await this.resolveSourceCfgPath();
      if (!sourcePath) {
        return {
          status: "failed",
          message: "未找到项目内 docs/gamestate_integration_novastrike.cfg，请检查项目目录结构。",
          targetPath
        };
      }
      const sourceContent = await readFile(sourcePath, "utf8");
      let currentTarget = "";
      try {
        currentTarget = await readFile(targetPath, "utf8");
      } catch {
        currentTarget = "";
      }

      if (!currentTarget) {
        await writeFile(targetPath, sourceContent, "utf8");
        return { status: "copied", message: "已复制 GSI 配置到 CS2 目录。", targetPath };
      }
      if (currentTarget !== sourceContent) {
        await writeFile(targetPath, sourceContent, "utf8");
        return { status: "updated", message: "检测到配置差异，已自动更新 GSI 配置。", targetPath };
      }
      return { status: "up_to_date", message: "GSI 配置已是最新。", targetPath };
    } catch (error) {
      return {
        status: "failed",
        message: `同步 GSI 配置失败：${String((error as Error).message)}`,
        targetPath
      };
    }
  }

  private async resolveSourceCfgPath() {
    for (const candidate of this.sourceCfgPathCandidates) {
      try {
        await access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }
    return undefined;
  }
}
