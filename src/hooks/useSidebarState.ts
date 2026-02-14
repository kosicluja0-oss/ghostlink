import { useState, useCallback } from 'react';

const STORAGE_KEY = 'sidebar:open';

function getInitialState(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
  } catch {}
  return true;
}

export function useSidebarState() {
  const [open, setOpenState] = useState(getInitialState);

  const setOpen = useCallback((value: boolean) => {
    setOpenState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {}
  }, []);

  return { sidebarOpen: open, setSidebarOpen: setOpen };
}
