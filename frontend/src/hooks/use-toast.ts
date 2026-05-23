// Minimal toast hook - replace with your full shadcn/ui use-toast if available
import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastIdCounter = 0;
const listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function emitChange() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(opts: Omit<Toast, "id">) {
  const id = String(++toastIdCounter);
  toasts = [...toasts, { ...opts, id }];
  emitChange();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emitChange();
  }, 4000);
}

export function useToast() {
  const [_toasts, setToasts] = useState<Toast[]>([]);
  // subscribe on mount
  useState(() => {
    listeners.push(setToasts);
    return () => {
      const idx = listeners.indexOf(setToasts);
      if (idx > -1) listeners.splice(idx, 1);
    };
  });

  return {
    toast: useCallback((opts: Omit<Toast, "id">) => toast(opts), []),
    toasts: _toasts,
  };
}
