import { BookOpen } from "lucide-react";

type BookCoverProps = {
  title: string;
  author?: string;
  image?: string | null;
  priority?: boolean;
  className?: string;
};

export function BookCover({
  title,
  author,
  image,
  className = ""
}: BookCoverProps) {
  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-md border border-white/70 bg-cream shadow-book ${className}`}
    >
      {image ? (
        <>
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/25 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0" />
        </>
      ) : (
        <div className="relative flex h-full flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#10233F_0%,#10233F_54%,#18375F_54%,#F7F1E3_55%,#F7F1E3_100%)] p-5 text-white">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gold/20 blur-2xl" />
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/25 to-transparent" />
          <BookOpen className="relative h-8 w-8 text-gold" aria-hidden="true" />
          <div>
            <p className="mb-3 inline-flex rounded-sm bg-gold px-2 py-1 text-[11px] font-bold uppercase text-navy">
              ASP
            </p>
            <h3 className="text-xl font-extrabold leading-tight">{title}</h3>
            {author ? (
              <p className="mt-3 text-sm font-medium text-white/75">{author}</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
