"use client";

import { Eye, EyeOff } from "lucide-react";

export function PasswordToggleButton({
  isVisible,
  label,
  onToggle,
}: {
  isVisible: boolean;
  label: string;
  onToggle: () => void;
}) {
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <button
      type="button"
      aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
      aria-pressed={isVisible}
      className="focus-ring absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-gray-soft transition hover:bg-cream hover:text-forest"
      onClick={onToggle}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
