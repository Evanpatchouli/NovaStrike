export type NovaStrikeSettings = {
  steamLibraryPath: string;
  httpPort: number;
  wsPort: number;
};

export type GsiSyncStatus = "missing_steam_library_path" | "missing_cs2_cfg_dir" | "copied" | "updated" | "up_to_date" | "failed";

export type GsiSyncResult = {
  status: GsiSyncStatus;
  message: string;
  targetPath?: string;
};
