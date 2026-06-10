export function PolicyPage({
  title,
  intro,
  points
}: {
  title: string;
  intro: string;
  points: string[];
}) {
  return (
    <div className="container-px mx-auto max-w-4xl py-10">
      <div className="rounded-lg border border-line bg-white p-6 shadow-card sm:p-8">
        <h1 className="font-serif text-3xl font-normal text-forest">{title}</h1>
        <p className="mt-3 leading-7 text-gray-soft">{intro}</p>
        <div className="mt-6 grid gap-4">
          {points.map((point) => (
            <p key={point} className="rounded-md bg-cream p-4 text-sm leading-6 text-ink">
              {point}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
