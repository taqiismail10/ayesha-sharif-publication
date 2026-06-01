import type { BookStatus } from "@prisma/client";
import { slugify } from "@/lib/format";
import type { BookCardData, BookDetailData } from "@/types";

export const sampleCategories = [
  { id: "sample-category-academic", name: "Academic Books", slug: "academic-books" },
  { id: "sample-category-islamic", name: "Islamic Books", slug: "islamic-books" },
  { id: "sample-category-children", name: "Children Books", slug: "children-books" },
  { id: "sample-category-literature", name: "Literature", slug: "literature" },
  { id: "sample-category-admission", name: "Admission Books", slug: "admission-books" }
];

export const sampleTags = [
  { id: "sample-tag-new", name: "New", slug: "new" },
  { id: "sample-tag-discount", name: "Discount", slug: "discount" },
  { id: "sample-tag-upcoming", name: "Upcoming", slug: "upcoming" },
  { id: "sample-tag-published", name: "Published", slug: "published" },
  { id: "sample-tag-pre-order", name: "Pre-order", slug: "pre-order" },
  { id: "sample-tag-best-seller", name: "Best Seller", slug: "best-seller" },
  { id: "sample-tag-bangla", name: "Bangla", slug: "bangla" },
  { id: "sample-tag-english", name: "English", slug: "english" }
];

const byCategory = (slug: string) =>
  sampleCategories.find((category) => category.slug === slug) || null;

export const sampleBooks: BookDetailData[] = [
  {
    id: "sample-book-grammar",
    title: "Bangla Grammar Essentials",
    slug: "bangla-grammar-essentials",
    subtitle: "A practical book for Bangladeshi students",
    author: "Ayesha Rahman",
    publisher: "Ayesha-Sharif Publication",
    isbn13: "9789841000001",
    edition: "1st Edition",
    language: "Bangla",
    pages: 224,
    binding: "Paperback",
    publicationDate: "2026-01-15T00:00:00.000Z",
    shortDescription:
      "A clear grammar guide designed for school, college, and admission preparation.",
    description:
      "This sample book entry previews how real books will appear once the database is connected. Replace the title, cover, description, and metadata from the admin panel after launch.",
    regularPrice: 420,
    salePrice: 360,
    discountPercent: 14,
    stockQuantity: 48,
    status: "published",
    coverImage: null,
    galleryImages: [],
    samplePdf: null,
    weight: 300,
    category: byCategory("academic-books"),
    tags: ["New", "Published", "Bangla"],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isRecommended: true
  },
  {
    id: "sample-book-english",
    title: "Admission English Booster",
    slug: "admission-english-booster",
    subtitle: "Compact preparation for university admission",
    author: "Sharif Hasan",
    publisher: "Ayesha-Sharif Publication",
    isbn13: "9789841000002",
    edition: "1st Edition",
    language: "English",
    pages: 312,
    binding: "Paperback",
    publicationDate: "2026-01-15T00:00:00.000Z",
    shortDescription:
      "Focused English practice with exam-friendly explanations and model questions.",
    description:
      "A sample admission title for previewing the bookstore layout before the database is ready.",
    regularPrice: 550,
    salePrice: 470,
    discountPercent: 15,
    stockQuantity: 62,
    status: "published",
    coverImage: null,
    galleryImages: [],
    samplePdf: null,
    weight: 420,
    category: byCategory("admission-books"),
    tags: ["Best Seller", "Published", "English"],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isRecommended: true
  },
  {
    id: "sample-book-alphabet",
    title: "Little Learners Alphabet",
    slug: "little-learners-alphabet",
    subtitle: "Early learning for children",
    author: "Nusrat Jahan",
    publisher: "Ayesha-Sharif Publication",
    isbn13: "9789841000003",
    edition: "1st Edition",
    language: "Bangla",
    pages: 80,
    binding: "Paperback",
    publicationDate: "2026-01-15T00:00:00.000Z",
    shortDescription:
      "A colourful, parent-friendly alphabet book for young Bangladeshi learners.",
    description:
      "A sample children book entry used when the database is not connected.",
    regularPrice: 260,
    salePrice: 220,
    discountPercent: 15,
    stockQuantity: 36,
    status: "published",
    coverImage: null,
    galleryImages: [],
    samplePdf: null,
    weight: 180,
    category: byCategory("children-books"),
    tags: ["Discount", "Published", "Bangla"],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    isRecommended: true
  },
  {
    id: "sample-book-dua",
    title: "Daily Dua Companion",
    slug: "daily-dua-companion",
    subtitle: "A simple daily reference",
    author: "Dr. Farhana Islam",
    publisher: "Ayesha-Sharif Publication",
    isbn13: "9789841000004",
    edition: "1st Edition",
    language: "Bangla",
    pages: 144,
    binding: "Paperback",
    publicationDate: "2026-01-15T00:00:00.000Z",
    shortDescription:
      "Daily duas with clean Bangla explanations for family reading.",
    description:
      "A sample Islamic book entry for previewing the public storefront.",
    regularPrice: 320,
    salePrice: 280,
    discountPercent: 13,
    stockQuantity: 18,
    status: "published",
    coverImage: null,
    galleryImages: [],
    samplePdf: null,
    weight: 220,
    category: byCategory("islamic-books"),
    tags: ["Discount", "Best Seller", "Published"],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isRecommended: false
  },
  {
    id: "sample-book-stories",
    title: "Stories of Bengal",
    slug: "stories-of-bengal",
    subtitle: "Short stories for thoughtful readers",
    author: "Mahmudul Karim",
    publisher: "Ayesha-Sharif Publication",
    isbn13: "9789841000005",
    edition: "1st Edition",
    language: "Bangla",
    pages: 176,
    binding: "Paperback",
    publicationDate: "2026-01-15T00:00:00.000Z",
    shortDescription:
      "Literary stories with a clean reading experience and premium presentation.",
    description:
      "A sample literature entry used for frontend preview without database access.",
    regularPrice: 390,
    salePrice: 390,
    discountPercent: 0,
    stockQuantity: 24,
    status: "published",
    coverImage: null,
    galleryImages: [],
    samplePdf: null,
    weight: 280,
    category: byCategory("literature"),
    tags: ["Published", "Bangla"],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: false,
    isRecommended: false
  },
  {
    id: "sample-book-seerah",
    title: "Seerah for Young Readers",
    slug: "seerah-for-young-readers",
    subtitle: "Coming soon",
    author: "Kamrul Islam",
    publisher: "Ayesha-Sharif Publication",
    isbn13: "9789841000006",
    edition: "1st Edition",
    language: "Bangla",
    pages: 210,
    binding: "Paperback",
    publicationDate: "2026-07-01T00:00:00.000Z",
    shortDescription:
      "An upcoming book for younger readers and families.",
    description:
      "Upcoming sample title. The real publication date, cover, and description can be managed from admin later.",
    regularPrice: 450,
    salePrice: 450,
    discountPercent: 0,
    stockQuantity: 0,
    status: "upcoming",
    coverImage: null,
    galleryImages: [],
    samplePdf: null,
    weight: 300,
    category: byCategory("islamic-books"),
    tags: ["Upcoming", "Bangla"],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isRecommended: true
  },
  {
    id: "sample-book-math",
    title: "University Math Prep",
    slug: "university-math-prep",
    subtitle: "Pre-order now",
    author: "Sajid Ahmed",
    publisher: "Ayesha-Sharif Publication",
    isbn13: "9789841000007",
    edition: "1st Edition",
    language: "English",
    pages: 420,
    binding: "Paperback",
    publicationDate: "2026-06-10T00:00:00.000Z",
    shortDescription:
      "Pre-order admission mathematics practice for university candidates.",
    description:
      "A sample pre-order book showing how upcoming purchasable books will behave.",
    regularPrice: 700,
    salePrice: 640,
    discountPercent: 9,
    stockQuantity: 20,
    status: "pre_order",
    coverImage: null,
    galleryImages: [],
    samplePdf: null,
    weight: 500,
    category: byCategory("admission-books"),
    tags: ["Pre-order", "English"],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isRecommended: true
  },
  {
    id: "sample-book-physics",
    title: "HSC Physics Quick Review",
    slug: "hsc-physics-quick-review",
    subtitle: "Currently out of stock",
    author: "Arif Chowdhury",
    publisher: "Ayesha-Sharif Publication",
    isbn13: "9789841000008",
    edition: "1st Edition",
    language: "Bangla",
    pages: 360,
    binding: "Paperback",
    publicationDate: "2026-01-15T00:00:00.000Z",
    shortDescription:
      "A fast revision guide for HSC physics students.",
    description:
      "A sample out-of-stock title for checking disabled purchase states.",
    regularPrice: 620,
    salePrice: 520,
    discountPercent: 16,
    stockQuantity: 0,
    status: "out_of_stock",
    coverImage: null,
    galleryImages: [],
    samplePdf: null,
    weight: 450,
    category: byCategory("academic-books"),
    tags: ["Discount", "Published"],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isRecommended: false
  }
];

export function toBookCard(book: BookDetailData): BookCardData {
  return {
    id: book.id,
    title: book.title,
    slug: book.slug,
    author: book.author,
    regularPrice: book.regularPrice,
    salePrice: book.salePrice,
    discountPercent: book.discountPercent,
    stockQuantity: book.stockQuantity,
    status: book.status,
    coverImage: book.coverImage,
    category: book.category,
    tags: book.tags,
    isFeatured: book.isFeatured,
    isBestSeller: book.isBestSeller,
    isNewArrival: book.isNewArrival,
    isRecommended: book.isRecommended
  };
}

export function getSampleHomeData() {
  const categoryCounts = sampleCategories.map((category) => ({
    ...category,
    _count: {
      books: sampleBooks.filter((book) => book.category?.slug === category.slug).length
    }
  }));

  return {
    featured: sampleBooks.filter((book) => book.isFeatured).map(toBookCard),
    newArrivals: sampleBooks.filter((book) => book.isNewArrival).map(toBookCard),
    discountBooks: sampleBooks
      .filter((book) => book.discountPercent > 0)
      .map(toBookCard),
    upcoming: sampleBooks
      .filter((book) => ["upcoming", "pre_order"].includes(book.status))
      .map(toBookCard),
    bestSellers: sampleBooks.filter((book) => book.isBestSeller).map(toBookCard),
    categories: categoryCounts
  };
}

export function getSampleBooks(params: {
  q?: string;
  category?: string;
  tag?: string;
  status?: string;
  min?: string;
  max?: string;
  sort?: string;
}) {
  const publicStatuses: BookStatus[] = [
    "published",
    "pre_order",
    "upcoming",
    "out_of_stock"
  ];
  let books = sampleBooks.filter((book) => publicStatuses.includes(book.status));

  if (params.status && publicStatuses.includes(params.status as BookStatus)) {
    books = books.filter((book) => book.status === params.status);
  }

  if (params.q) {
    const query = params.q.toLowerCase();
    books = books.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn13?.toLowerCase().includes(query)
    );
  }

  if (params.category) {
    books = books.filter((book) => book.category?.slug === params.category);
  }

  if (params.tag) {
    books = books.filter((book) =>
      book.tags.some((tag) => slugify(tag) === params.tag)
    );
  }

  if (params.min) {
    books = books.filter((book) => book.salePrice >= Number(params.min));
  }

  if (params.max) {
    books = books.filter((book) => book.salePrice <= Number(params.max));
  }

  if (params.sort === "price-low") {
    books = [...books].sort((a, b) => a.salePrice - b.salePrice);
  } else if (params.sort === "price-high") {
    books = [...books].sort((a, b) => b.salePrice - a.salePrice);
  } else if (params.sort === "best-selling") {
    books = [...books].sort(
      (a, b) => Number(b.isBestSeller) - Number(a.isBestSeller)
    );
  }

  return {
    books: books.map(toBookCard),
    categories: sampleCategories,
    tags: sampleTags
  };
}

export function getSampleBookBySlug(slug: string) {
  const book = sampleBooks.find((item) => item.slug === slug);
  if (!book) return null;

  const related = sampleBooks
    .filter(
      (item) =>
        item.id !== book.id &&
        (item.category?.slug === book.category?.slug ||
          item.tags.some((tag) => book.tags.includes(tag)))
    )
    .slice(0, 4)
    .map(toBookCard);

  return { book, related };
}
