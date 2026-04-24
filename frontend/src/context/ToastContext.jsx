import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
} from "react";
import { AnimatePresence } from "framer-motion";
import { Toast } from "../components/ui/Toast";

const ToastContext = createContext(null);

const DEFAULT_DURATION_MS = 4000;

const defaultTitleForType = (type) => {
  switch (type) {
    case "error":
      return "Error";
    case "info":
      return "Info";
    default:
      return "Success";
  }
};

function normalizeToastInput(input, maybeType) {
  if (input != null && typeof input === "object" && !Array.isArray(input)) {
    const type = ["success", "error", "info"].includes(input.type)
      ? input.type
      : "success";
    const message = String(input.message ?? input.text ?? "").trim();
    const titleRaw = String(input.title ?? "").trim();
    const title = titleRaw || defaultTitleForType(type);
    return { type, title, message };
  }

  const type = ["success", "error", "info"].includes(maybeType)
    ? maybeType
    : "success";
  const message = String(input ?? "").trim();
  return {
    type,
    title: defaultTitleForType(type),
    message,
  };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const baseId = useId();

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (input, maybeType) => {
      const { type, title, message } = normalizeToastInput(input, maybeType);
      if (!message) return;

      const id = `${baseId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((current) => [
        ...current,
        { id, type, title, message, duration: DEFAULT_DURATION_MS },
      ]);
    },
    [baseId],
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div
        className="pointer-events-none fixed top-4 right-0 z-[200] flex max-h-[min(100vh-1rem,640px)] w-full flex-col items-end gap-3 overflow-y-auto overflow-x-hidden pl-6 pr-4 sm:pr-6"
        aria-live="polite"
        aria-relevant="additions text"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <Toast
              key={item.id}
              id={item.id}
              type={item.type}
              title={item.title}
              message={item.message}
              duration={item.duration}
              onDismiss={() => dismissToast(item.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
      dismissToast: () => {},
    };
  }
  return ctx;
}
