export type ToastType = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};

type Listener = (toasts: ToastItem[]) => void;

const listeners = new Set<Listener>();
let items: ToastItem[] = [];

function emit() {
  const snapshot = [...items];
  for (const l of listeners) l(snapshot);
}

function add(type: ToastType, message: string) {
  const id = Math.random().toString(36).slice(2, 9);
  items = [...items, { id, type, message }];
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, 4000);
}

export const toast = {
  success: (message: string) => add("success", message),
  error: (message: string) => add("error", message),
  info: (message: string) => add("info", message),
  warning: (message: string) => add("warning", message),
};

export function subscribeToToasts(listener: Listener) {
  listeners.add(listener);
  listener([...items]);
  return () => {
    listeners.delete(listener);
  };
}
