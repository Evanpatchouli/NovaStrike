import { useEffect, useState } from "react";

export function usePersistedCollapsed(key: string, initialValue = false) {
  const storageKey = `novastrike:card-collapsed:${key}`;
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "1") return true;
    if (saved === "0") return false;
    return initialValue;
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, collapsed ? "1" : "0");
  }, [collapsed, storageKey]);

  return [collapsed, setCollapsed] as const;
}
