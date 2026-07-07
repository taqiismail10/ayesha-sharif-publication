"use client";

/**
 * Tooltip
 * -------
 * Lightweight tooltip built on framer-motion. Wraps any child and
 * shows a bubble on hover (mouse/touch) or keyboard focus. Works with
 * disabled buttons because the wrapper owns the pointer/focus listeners.
 *
 *   <Tooltip content="Add to cart">
 *     <button>Add to cart</button>
 *   </Tooltip>
 *
 *   <Tooltip content="Out of stock">
 *     <button disabled>Buy now</button>
 *   </Tooltip>
 *
 * Honours prefers-reduced-motion (no slide animation, fade only).
 *
 * Accessibility:
 *   - aria-describedby is ALWAYS set on the trigger so screen-reader
 *     users know the tooltip exists before they hover/focus.
 *   - Native focusables (button, a, input) keep their native tabindex;
 *     only non-focusable children get tabIndex=0 so keyboard users
 *     can still discover the tooltip.
 *   - cloneElement REPLACES props, so we never put tabIndex / handlers
 *     on the child that would clobber consumer-supplied values; the
 *     wrapper is the single source of truth for hover/pointer events.
 */

import {
  cloneElement,
  isValidElement,
  useId,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type ReactElement,
  type ReactNode
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";

type TooltipProps = {
  content: ReactNode;
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
  /** When true, the tooltip never opens. */
  disabled?: boolean;
  className?: string;
};

const sideClasses: Record<NonNullable<TooltipProps["side"]>, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2"
};

const sideOffset: Record<NonNullable<TooltipProps["side"]>, number> = {
  top: 4,
  bottom: -4,
  left: 0,
  right: 0
};

/* Elements that are already natively focusable — for these we must NOT
 * override tabIndex (cloneElement REPLACES props). We only inject
 * tabIndex=0 for non-focusable wrappers (e.g. a span around an SVG icon). */
const NATIVELY_FOCUSABLE = new Set([
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "area"
]);

export function Tooltip({
  content,
  children,
  side = "top",
  delay = 200,
  disabled = false,
  className
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const openTimer = useRef<number | null>(null);
  const id = useId();
  const reduce = useReducedMotion();

  const cancelTimer = () => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  };

  const scheduleOpen = () => {
    if (disabled) return;
    cancelTimer();
    openTimer.current = window.setTimeout(() => setOpen(true), delay);
  };

  const openNow = () => {
    if (disabled) return;
    cancelTimer();
    setOpen(true);
  };

  const close = () => {
    cancelTimer();
    setOpen(false);
  };

  const contentId = `${id}-content`;
  const describedById = content ? contentId : undefined;

  let trigger: ReactElement = children;
  if (isValidElement(children)) {
    const childProps = children.props as Record<string, unknown>;
    const childOnFocus = childProps.onFocus as
      | ((e: ReactFocusEvent) => void)
      | undefined;
    const childOnBlur = childProps.onBlur as
      | ((e: ReactFocusEvent) => void)
      | undefined;
    const childDescribedBy = childProps["aria-describedby"] as
      | string
      | undefined;

    /* Compose aria-describedby: keep any existing value, append ours. */
    const composedDescribedBy = [childDescribedBy, describedById]
      .filter(Boolean)
      .join(" ") || undefined;

    const overrides: Record<string, unknown> = {
      "aria-describedby": composedDescribedBy
    };

    /* Only inject tabIndex=0 for non-natively-focusable children.
       Native elements already have a sensible default tabIndex and
       cloneElement would clobber a consumer-supplied value. */
    if (
      typeof childProps.tabIndex === "undefined" &&
      childProps.disabled !== true &&
      !NATIVELY_FOCUSABLE.has(
        typeof children.type === "string" ? children.type : ""
      )
    ) {
      overrides.tabIndex = 0;
    }

    /* Keyboard support: forward consumer handlers if any. Focus/blur
       always opens/closes the tooltip, including for disabled children
       (whose focus events don't fire — we catch those via capture on
       the wrapper below). */
    overrides.onFocus = (e: ReactFocusEvent) => {
      openNow();
      childOnFocus?.(e);
    };
    overrides.onBlur = (e: ReactFocusEvent) => {
      close();
      childOnBlur?.(e);
    };

    trigger = cloneElement(children, overrides as Partial<typeof children.props>);
  }

  const offset = sideOffset[side];

  return (
    <span
      className={clsx("relative inline-flex", className)}
      /* Wrapper owns ALL pointer events so we work for both enabled and
         disabled children (disabled buttons don't fire onMouse*). */
      onPointerEnter={scheduleOpen}
      onPointerLeave={close}
      onPointerDown={close}
      onFocusCapture={openNow}
      onBlurCapture={close}
    >
      {trigger}
      <AnimatePresence>
        {open && !disabled && content ? (
          <motion.span
            key="bubble"
            id={contentId}
            role="tooltip"
            initial={
              reduce
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    y: side === "top" || side === "bottom" ? offset : 0
                  }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              reduce
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    y: side === "top" || side === "bottom" ? offset : 0
                  }
            }
            transition={{ duration: reduce ? 0.01 : 0.15, ease: "easeOut" }}
            className={clsx(
              "pointer-events-none absolute z-50 min-w-[2.5rem] max-w-xs whitespace-nowrap rounded-md bg-navy px-2.5 py-1.5 text-center text-xs font-medium leading-4 text-white shadow-soft",
              sideClasses[side]
            )}
          >
            {content}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
