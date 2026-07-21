"use client";

/**
 * FormSuccess
 * -----------
 * Inline success banner shown after a form action completes. Renders
 * nothing when `message` is empty / falsy so it can be used as a
 * permanent slot in the form layout.
 *
 *   <FormSuccess message={success} />
 *
 * It does not auto-dismiss; the host form is expected to clear
 * `success` (e.g. on the next field change) or it is acceptable to
 * keep it visible until the next submit.
 */

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import clsx from "clsx";

type FormSuccessProps = {
  message?: string | null;
  /** Optional sub-line under the title. */
  description?: string;
  /** When true, animates the entrance. Defaults to true. */
  animate?: boolean;
  className?: string;
};

export function FormSuccess({
  message,
  description,
  animate = true,
  className
}: FormSuccessProps) {
  const [shown, setShown] = useState(false);
  const prevMessageRef = useRef<string | null>(null);

  // When a new success message arrives, briefly re-trigger the entrance
  // animation so re-submits feel acknowledged.
  useEffect(() => {
    if (message && message !== prevMessageRef.current) {
      setShown(false);
      const id = requestAnimationFrame(() => setShown(true));
      prevMessageRef.current = message;
      return () => cancelAnimationFrame(id);
    }
    if (!message) {
      prevMessageRef.current = null;
      setShown(false);
    }
  }, [message]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        "flex items-start gap-2.5 rounded-md border border-emerald/30 bg-emerald/10 px-3 py-2.5 text-sm text-emerald",
        animate &&
          (shown
            ? "transition-opacity duration-200 ease-out opacity-100"
            : "opacity-0"),
        className
      )}
    >
      <CheckCircle2
        className="mt-0.5 h-4 w-4 shrink-0"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-5">{message}</p>
        {description ? (
          <p className="mt-0.5 text-xs leading-5 text-emerald/80">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}