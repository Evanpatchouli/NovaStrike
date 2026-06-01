export type SettingsResponse = {
  ok: boolean;
  settings: { steamLibraryPath: string };
  gsiSync: { status: string; message: string; targetPath?: string };
};

const BASE_URL = "http://127.0.0.1:3000";

export async function getSettings(): Promise<SettingsResponse> {
  const response = await fetch(`${BASE_URL}/settings`);
  if (!response.ok) throw new Error(`GET /settings failed: ${response.status}`);
  return (await response.json()) as SettingsResponse;
}

export async function saveSettings(steamLibraryPath: string): Promise<SettingsResponse> {
  const response = await fetch(`${BASE_URL}/settings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ steamLibraryPath })
  });
  if (!response.ok) throw new Error(`POST /settings failed: ${response.status}`);
  return (await response.json()) as SettingsResponse;
}

export async function syncGsi(): Promise<SettingsResponse> {
  const response = await fetch(`${BASE_URL}/settings/sync-gsi`, { method: "POST" });
  if (!response.ok) throw new Error(`POST /settings/sync-gsi failed: ${response.status}`);
  return (await response.json()) as SettingsResponse;
}
