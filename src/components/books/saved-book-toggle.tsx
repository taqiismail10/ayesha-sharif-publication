"use client";

import { useCallback } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSavedBookStatus } from "@/lib/saved-books-client";
import { useToast } from "@/components/ui/toast";

type SavedBookToggleProps = {
  bookId: string;
  title: string;
  variant?: "compact" | "detail" | "text";
  className?: string;
  savedLabel?: string;
  unsavedLabel?: string;
  mode?: "toggle" | "remove";
  onStatusChange?: (isSaved: boolean) => void;
};

function classesForVariant(variant: SavedBookToggleProps["variant"]) {
  if (variant === "detail") {
    return "focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[4px] border border-line bg-white px-4 py-3 text-sm font-medium text-forest transition-[border-color,background-color,color,box-shadow,transform] duration-150 hover:border-gold/60 hover:bg-cream";
  }
  if (variant === "text") {
    return "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[4px] border border-line bg-white px-4 py-2.5 text-sm font-medium text-forest transition-[border-color,background-color,color,box-shadow,transform] duration-150 hover:border-gold/60 hover:bg-cream";
  }
  return "focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-[4px] border border-line/70 bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-forest transition-[border-color,background-color,color,box-shadow,transform] duration-150 hover:border-gold/60 hover:bg-cream";
}

export function SavedBookToggle({
  bookId,
  title,
  variant = "compact",
  className = "",
  savedLabel = "Saved",
  unsavedLabel = "Save",
  mode = "toggle",
  onStatusChange,
}: SavedBookToggleProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { loaded, isSaved, isPending, remove, toggle } =
    useSavedBookStatus(bookId);
  const presentedAsSaved = mode === "remove" || isSaved;

  const handleClick = useCallback(async () => {
    const result = await (mode === "remove" ? remove() : toggle());

    if (result === "saved") {
      toast.success({
        title: "Book saved",
        description: title,
        duration: 2200,
      });
      onStatusChange?.(true);
      return;
    }

    if (result === "removed") {
      toast.info({
        title: "Removed from saved books",
        description: title,
        duration: 2200,
      });
      onStatusChange?.(false);
      return;
    }

    if (result === "login_required") {
      toast.info({
        title: "Sign in to save books",
        description: "Log in to keep books in your account.",
        duration: 2600,
      });
      const redirectTo = pathname || "/books";
      router.push(`/account/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    toast.error({
      title: "Could not update saved books",
      description: "Please try again.",
    });
  }, [mode, onStatusChange, pathname, remove, router, title, toast, toggle]);

  const Icon = mode === "remove" ? Trash2 : presentedAsSaved ? BookmarkCheck : Bookmark;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending || (mode === "remove" && !loaded)}
      aria-pressed={presentedAsSaved}
      aria-label={
        presentedAsSaved ? `Remove ${title} from saved books` : `Save ${title}`
      }
      title={presentedAsSaved ? `Remove ${title} from saved books` : `Save ${title}`}
      className={`${classesForVariant(variant)} ${className}`.trim()}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{presentedAsSaved ? savedLabel : unsavedLabel}</span>
    </button>
  );
}

export function SavedBooksBrowseLink() {
  return (
    <Link
      href="/books"
      className="focus-ring inline-flex w-fit text-sm font-bold text-forest underline decoration-gold/70 underline-offset-4"
    >
      Browse books
    </Link>
  );
}
