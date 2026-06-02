import { BookOpen } from "lucide-react";
import { bookStatusLabels } from "@/lib/constants";
import { getBooks } from "@/lib/data";
import { EmptyState } from "@/components/site/empty-state";
import { ProductCard } from "@/components/books/product-card";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function BookListView({
  searchParams,
  title,
  description
}: {
  searchParams: SearchParams;
  title: string;
  description: string;
}) {
  const q = pick(searchParams.q);
  const category = pick(searchParams.category);
  const tag = pick(searchParams.tag);
  const status = pick(searchParams.status);
  const min = pick(searchParams.min);
  const max = pick(searchParams.max);
  const sort = pick(searchParams.sort);
  const { books, categories, tags } = await getBooks({
    q,
    category,
    tag,
    status,
    min,
    max,
    sort
  });

  return (
    <div className="container-px mx-auto max-w-7xl py-8">
      <div className="mb-6">
        <div className="mb-3 h-1 w-14 rounded-full bg-gold" />
        <h1 className="font-heading text-3xl font-extrabold text-navy sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>

      <form className="premium-panel mb-7 grid gap-3 p-4 md:grid-cols-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Title, author, ISBN"
          className="form-input md:col-span-2"
        />
        <select name="category" defaultValue={category || ""} className="form-input">
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <select name="tag" defaultValue={tag || ""} className="form-input">
          <option value="">All tags</option>
          {tags.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status || ""} className="form-input">
          <option value="">All statuses</option>
          {(["published", "pre_order", "upcoming", "out_of_stock"] as const).map(
            (item) => (
              <option key={item} value={item}>
                {bookStatusLabels[item]}
              </option>
            )
          )}
        </select>
        <select name="sort" defaultValue={sort || "newest"} className="form-input">
          <option value="newest">Newest</option>
          <option value="price-low">Price low to high</option>
          <option value="price-high">Price high to low</option>
          <option value="best-selling">Best selling</option>
        </select>
        <input
          name="min"
          defaultValue={min}
          inputMode="numeric"
          placeholder="Min ৳"
          className="form-input"
        />
        <input
          name="max"
          defaultValue={max}
          inputMode="numeric"
          placeholder="Max ৳"
          className="form-input"
        />
        <button
          type="submit"
          className="focus-ring min-h-11 rounded-md bg-navy px-4 py-2 text-sm font-extrabold text-white md:col-span-2"
        >
          Apply filters
        </button>
      </form>

      {books.length ? (
        <div className="book-grid grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {books.map((book) => (
            <ProductCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No books found"
          description="Try a different search, category, tag, status, or price range."
        />
      )}
    </div>
  );
}
