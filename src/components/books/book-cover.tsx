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
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-md border border-line bg-cream shadow-soft ${className}`}
    >
      {image ? (
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full flex-col justify-between bg-[linear-gradient(160deg,#10233F_0%,#10233F_58%,#F7F1E3_58%,#F7F1E3_100%)] p-5 text-white">
          <BookOpen className="h-8 w-8 text-gold" aria-hidden="true" />
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
