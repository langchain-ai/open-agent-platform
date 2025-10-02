export interface StandaloneConfig {
  deploymentUrl: string;
  assistantId: string;
}

const CONFIG_KEY = "standalone-chat-config";

export function getConfig(): StandaloneConfig | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(CONFIG_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveConfig(config: StandaloneConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function clearConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONFIG_KEY);
}
