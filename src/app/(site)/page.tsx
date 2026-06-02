import { getHomeData } from "@/lib/data";
import { BookSection } from "@/components/books/book-section";
import { PremiumHero } from "@/components/home/premium-hero";
import {
  CategoryStorySection,
  FutureLearningSection,
  HelpOrderingSection,
  OrderingStepsSection,
  ReaderTrustSection
} from "@/components/home/storytelling-sections";

export const revalidate = 300;

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <div>
      <PremiumHero books={data.featured} />

      <ReaderTrustSection />
      <OrderingStepsSection />
      <CategoryStorySection categories={data.categories} />

      <div className="container-px mx-auto max-w-7xl">
        <BookSection
          title="Featured books"
          subtitle="Selected titles from our first catalogue."
          books={data.featured}
          href="/books"
        />
        <BookSection
          title="New arrivals"
          subtitle="Freshly added books for readers and students."
          books={data.newArrivals}
          href="/books?sort=newest"
        />
        <BookSection
          title="Discount books"
          subtitle="Launch offers and limited-time savings."
          books={data.discountBooks}
          href="/books?tag=discount"
        />
        <BookSection
          title="Upcoming books"
          subtitle="Planned titles and pre-order-ready books."
          books={data.upcoming}
          href="/books?status=upcoming"
        />
        <BookSection
          title="Best sellers"
          subtitle="Popular titles from the collection."
          books={data.bestSellers}
          href="/books?sort=best-selling"
        />
      </div>

      <FutureLearningSection />
      <HelpOrderingSection />
    </div>
  );
}
