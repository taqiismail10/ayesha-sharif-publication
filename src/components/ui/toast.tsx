"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  type LucideIcon
} from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

export type ToastInput = {
  title: string;
  description?: string;
  duration?: number;
  icon?: LucideIcon;
};

export type Toast = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration: number;
  icon?: LucideIcon;
  createdAt: number;
};

type ToastApi = {
  show: (variant: ToastVariant, input: ToastInput) => string;
  success: (input: ToastInput | string) => string;
  error: (input: ToastInput | string) => string;
  info: (input: ToastInput | string) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const ToastContext = createContext<ToastApi | null>(null);

function normaliseInput(value: ToastInput | string): ToastInput {
  return typeof value === "string" ? { title: value } : value;
}

const DEFAULT_DURATION = 4500;
const MAX_VISIBLE = 6;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const show = useCallback<ToastApi["show"]>(
    (variant, input) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const normalised = normaliseInput(input);
      const duration =
        normalised.duration === undefined
          ? DEFAULT_DURATION
          : normalised.duration;
      const next: Toast = {
        id,
        variant,
        title: normalised.title,
        description: normalised.description,
        duration,
        icon: normalised.icon,
        createdAt: Date.now()
      };
      setToasts((current) => {
        const merged = [...current, next];
        return merged.length > MAX_VISIBLE
          ? merged.slice(merged.length - MAX_VISIBLE)
          : merged;
      });
      return id;
    },
    []
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      clear,
      success: (input) => show("success", normaliseInput(input)),
      error: (input) => show("error", normaliseInput(input)),
      info: (input) => show("info", normaliseInput(input))
    }),
    [show, dismiss, clear]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    const noop = () => "";
    return {
      show: noop,
      success: noop,
      error: noop,
      info: noop,
      dismiss: () => undefined,
      clear: () => undefined
    };
  }
  return ctx;
}

const variantStyles: Record<
  ToastVariant,
  { container: string; iconWrap: string; iconClass: string; Icon: LucideIcon }
> = {
  success: {
    container: "border-emerald/30 bg-white",
    iconWrap: "bg-emerald/10",
    iconClass: "text-emerald",
    Icon: CheckCircle2
  },
  error: {
    container: "border-danger/30 bg-white",
    iconWrap: "bg-danger/10",
    iconClass: "text-danger",
    Icon: AlertCircle
  },
  info: {
    container: "border-navy/20 bg-white",
    iconWrap: "bg-navy/5",
    iconClass: "text-navy",
    Icon: Info
  }
};

function Toaster({
  toasts,
  onDismiss
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const successAndInfo = toasts.filter(
    (toast) => toast.variant === "success" || toast.variant === "info"
  );
  const errors = toasts.filter((toast) => toast.variant === "error");

  return (
    <>
      <ToastRegion
        toasts={successAndInfo}
        onDismiss={onDismiss}
        variant="polite"
        prefersReducedMotion={!!prefersReducedMotion}
        side="top-right"
      />
      <ToastRegion
        toasts={errors}
        onDismiss={onDismiss}
        variant="assertive"
        prefersReducedMotion={!!prefersReducedMotion}
        side="bottom-right"
      />
    </>
  );
}

function ToastRegion({
  toasts,
  onDismiss,
  variant,
  prefersReducedMotion,
  side
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  variant: "polite" | "assertive";
  prefersReducedMotion: boolean;
  side: "top-right" | "bottom-right";
}) {
  if (!toasts.length) return null;
  const positionClass =
    side === "top-right"
      ? "top-4 right-4 sm:top-6 sm:right-6"
      : "bottom-4 right-4 sm:bottom-6 sm:right-6";

  return (
    <div
      role={variant === "assertive" ? "alert" : "status"}
      aria-live={variant === "assertive" ? "assertive" : "polite"}
      aria-atomic="false"
      className={`pointer-events-none fixed z-[100] flex w-full max-w-sm flex-col gap-2 ${positionClass}`}
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={onDismiss}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
  prefersReducedMotion
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
  prefersReducedMotion: boolean;
}) {
  const styles = variantStyles[toast.variant];
  const Icon = toast.icon ?? styles.Icon;
  const [isPaused, setIsPaused] = useState(false);
  const elapsedRef = useRef<number>(0);
  const startedAtRef = useRef<number>(typeof performance !== "undefined" ? performance.now() : 0);
  const pauseTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!toast.duration || typeof window === "undefined") return;
    if (isPaused) {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      elapsedRef.current += now - startedAtRef.current;
      if (pauseTimer.current !== null) {
        window.clearTimeout(pauseTimer.current);
        pauseTimer.current = null;
      }
      return;
    }
    const remaining = Math.max(0, toast.duration - elapsedRef.current);
    if (remaining === 0) {
      onDismiss(toast.id);
      return;
    }
    startedAtRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
    pauseTimer.current = window.setTimeout(
      () => onDismiss(toast.id),
      remaining
    );
    return () => {
      if (pauseTimer.current !== null) {
        window.clearTimeout(pauseTimer.current);
        pauseTimer.current = null;
      }
    };
  }, [isPaused, toast.duration, toast.id, onDismiss]);

  const motionProps = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.18 }
      }
    : {
        initial: { opacity: 0, x: 24, scale: 0.98 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: 24, scale: 0.98 },
        transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const }
      };

  const handleDismiss = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id]);
  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  return (
    <motion.div
      {...motionProps}
      role={toast.variant === "error" ? "alert" : "status"}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-3 pr-2 shadow-soft transition-shadow duration-150 hover:shadow-md ${styles.container}`}
    >
      <span
        className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${styles.iconWrap}`}
        aria-hidden="true"
      >
        <Icon className={`h-4 w-4 ${styles.iconClass}`} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-forest">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-xs leading-5 text-muted">
            {toast.description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="focus-ring -mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-soft transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-cream hover:text-forest motion-safe:active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A574] focus-visible:ring-offset-2"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </motion.div>
  );
}
