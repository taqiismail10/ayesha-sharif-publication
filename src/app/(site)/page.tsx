import { getHomeData } from "@/lib/data";
import { BookSection } from "@/components/books/book-section";
import { HeroSection } from "@/components/site/hero-section";
import {
  CategoriesSection,
  TrustStrip,
} from "@/components/home/storytelling-sections";

export const revalidate = 300;

export default async function HomePage() {
  const { featured, categories, newArrivals, bestSellers } =
    await getHomeData();

  return (
    <main>
      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Featured Books — max 8 */}
      <div className="mx-auto max-w-[1200px] px-6">
        <BookSection
          overline="— Featured —"
          title="Featured books"
          subtitle="Selected titles from our first catalogue."
          books={featured.slice(0, 8)}
          href="/books"
        />
      </div>

      {/* 3. Categories browse */}
      <CategoriesSection categories={categories} />

      {/* 4. New Arrivals — max 4 */}
      <div className="mx-auto max-w-[1200px] px-6">
        <BookSection
          overline="— New —"
          title="New arrivals"
          subtitle="Freshly added books for readers and students."
          books={newArrivals.slice(0, 4)}
          href="/books?sort=newest"
        />
      </div>

      {/* 5. Best Sellers — max 4 */}
      <div className="mx-auto max-w-[1200px] px-6">
        <BookSection
          overline="— Best Sellers —"
          title="Best sellers"
          subtitle="Popular titles from the collection."
          books={bestSellers.slice(0, 4)}
          href="/books?sort=best-selling"
        />
      </div>

      {/* 6. Trust strip */}
      <TrustStrip />
    </main>
  );
}
