import Image from "next/image";
import { BookOpen } from "lucide-react";

type BookCoverProps = {
  title: string;
  author?: string;
  image?: string | null;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

export function BookCover({
  title,
  author,
  image,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  className = ""
}: BookCoverProps) {
  const displayTitle = title.length > 56 ? `${title.slice(0, 54)}...` : title;
  const unoptimized = image?.toLowerCase().endsWith(".svg") ?? false;

  return (
    <div
      className={`book-cover-stage relative aspect-[3/4] w-full ${className}`}
    >
      <div className="book-cover-frame relative h-full w-full overflow-hidden rounded-md border border-white/80 bg-cream shadow-book">
        {image ? (
          <>
            <Image
              src={image}
              alt={title}
              fill
              sizes={sizes}
              priority={priority}
              unoptimized={unoptimized}
              className="book-cover-image object-cover"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-9 bg-gradient-to-r from-black/32 via-black/10 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/12 to-white/0" />
            <div className="pointer-events-none absolute inset-x-2 top-2 h-12 rounded-sm bg-gradient-to-b from-white/18 to-transparent" />
          </>
        ) : (
          <div className="fallback-cover relative flex h-full flex-col justify-between overflow-hidden p-5 text-white">
            <div className="absolute inset-y-0 left-0 w-9 bg-gradient-to-r from-black/42 via-black/18 to-transparent" />
            <div className="absolute left-9 top-0 h-full w-px bg-white/14" />
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/20 blur-2xl" />
            <div className="absolute -bottom-14 right-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute right-5 top-8 grid gap-1.5 opacity-45">
              <span className="h-px w-20 bg-gold/80" />
              <span className="h-px w-16 bg-gold/70" />
              <span className="h-px w-24 bg-gold/50" />
            </div>

            <div className="relative flex items-start justify-between gap-3">
              <BookOpen className="h-8 w-8 text-gold" aria-hidden="true" />
              <span className="rounded-sm border border-gold/40 bg-gold px-2 py-1 text-[11px] font-black uppercase tracking-normal text-forest shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
                ASP
              </span>
            </div>

            <div className="relative">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-gold">
                Ayesha-Sharif Publication
              </p>
              <h3 className="max-w-[13rem] text-xl font-black leading-tight text-white">
                {displayTitle}
              </h3>
              {author ? (
                <p className="mt-3 text-sm font-semibold leading-snug text-white/75">
                  {author}
                </p>
              ) : null}
              <div className="mt-5 grid gap-1.5 opacity-60">
                <span className="h-px w-3/4 bg-white/70" />
                <span className="h-px w-1/2 bg-white/45" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
