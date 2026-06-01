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
