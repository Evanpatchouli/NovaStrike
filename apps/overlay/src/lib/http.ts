export type SettingsResponse = {
  ok: boolean;
  settings: { steamLibraryPath: string; httpPort: number; wsPort: number };
  gsiSync: { status: string; message: string; targetPath?: string };
};

let runtimeConfig = { httpPort: 37653, wsPort: 37654 };

export async function initRuntimeConfig(): Promise<void> {
  const config = await window.novaWindow?.getRuntimeConfig();
  if (config) runtimeConfig = { httpPort: config.httpPort, wsPort: config.wsPort };
}

export function setRuntimeConfig(next: { httpPort: number; wsPort: number }): void {
  runtimeConfig = { httpPort: next.httpPort, wsPort: next.wsPort };
}

export function getRuntimeConfig(): { httpPort: number; wsPort: number } {
  return runtimeConfig;
}

function getBaseUrl() {
  return `http://127.0.0.1:${runtimeConfig.httpPort}`;
}

export async function getSettings(): Promise<SettingsResponse> {
  const response = await fetch(`${getBaseUrl()}/settings`);
  if (!response.ok) throw new Error(`GET /settings failed: ${response.status}`);
  return (await response.json()) as SettingsResponse;
}

export async function saveSettings(input: { steamLibraryPath: string; httpPort: number; wsPort: number }): Promise<SettingsResponse> {
  const response = await fetch(`${getBaseUrl()}/settings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(`POST /settings failed: ${response.status}`);
  return (await response.json()) as SettingsResponse;
}

export async function syncGsi(): Promise<SettingsResponse> {
  const response = await fetch(`${getBaseUrl()}/settings/sync-gsi`, { method: "POST" });
  if (!response.ok) throw new Error(`POST /settings/sync-gsi failed: ${response.status}`);
  return (await response.json()) as SettingsResponse;
}
