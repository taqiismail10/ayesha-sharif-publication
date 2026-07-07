export function PolicyPage({
  title,
  content,
  updatedAt,
}: {
  title: string;
  content: string;
  updatedAt?: Date | null;
}) {
  const sections = content
    .split(/\r?\n\s*\r?\n/)
    .map((section) => section.trim())
    .filter(Boolean);
  const showUpdatedAt = updatedAt && updatedAt.getTime() > 0;

  return (
    <div className="container-px mx-auto max-w-4xl py-10">
      <div className="rounded-lg border border-line bg-white p-6 shadow-card sm:p-8">
        <h1 className="font-serif text-3xl font-normal text-forest">{title}</h1>
        {showUpdatedAt ? (
          <p className="mt-2 text-xs uppercase tracking-[0.08em] text-gray-soft">
            Last updated {new Intl.DateTimeFormat("en-BD", { dateStyle: "long" }).format(updatedAt)}
          </p>
        ) : null}
        <div className="mt-6 grid gap-4">
          {sections.map((section, index) => (
            <p key={`${index}-${section.slice(0, 32)}`} className="whitespace-pre-line rounded-md bg-cream p-4 text-sm leading-7 text-ink">
              {section}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
