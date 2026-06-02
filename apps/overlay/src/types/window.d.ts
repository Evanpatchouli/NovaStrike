export {};

declare global {
  interface Window {
    novaWindow?: {
      getAlwaysOnTop: () => Promise<boolean>;
      toggleAlwaysOnTop: () => Promise<boolean>;
      getCloseBehavior: () => Promise<"close" | "hide">;
      setCloseBehavior: (behavior: "close" | "hide") => Promise<"close" | "hide">;
      getOverlayHeaderVisible: () => Promise<boolean>;
      setOverlayHeaderVisible: (visible: boolean) => Promise<boolean>;
      onOverlayHeaderVisibleChange: (handler: (visible: boolean) => void) => () => void;
      getAppVersion: () => Promise<string>;
      getRuntimeConfig: () => Promise<{ steamLibraryPath: string; httpPort: number; wsPort: number }>;
      getBackendStatus: () => Promise<{ ok: boolean; message: string }>;
      applyRuntimeConfig: (
        config: Partial<{ steamLibraryPath: string; httpPort: number; wsPort: number }>
      ) => Promise<{ ok: boolean; message: string; config?: { steamLibraryPath: string; httpPort: number; wsPort: number } }>;
      checkUpdates: () => Promise<{
        ok: boolean;
        hasUpdate: boolean;
        currentVersion: string;
        latestVersion?: string;
        notes?: string;
        downloadUrl?: string;
        message: string;
      }>;
      minimize: () => Promise<void>;
      toggleMaximize: () => Promise<boolean>;
      close: () => Promise<void>;
    };
  }
}
