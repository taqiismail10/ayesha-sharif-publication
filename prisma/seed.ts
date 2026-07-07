import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { DEFAULT_POLICIES } from "../src/lib/policy-definitions";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({ adapter });

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@ayeshasharif.com";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "super_admin", isActive: true },
    create: {
      name: "Super Admin",
      email: adminEmail,
      passwordHash,
      role: "super_admin",
      isActive: true
    }
  });

  const publishedAt = new Date();
  await Promise.all(
    DEFAULT_POLICIES.map((policy) =>
      prisma.policy.upsert({
        where: { slug: policy.slug },
        update: {},
        create: {
          ...policy,
          publishedTitle: policy.title,
          publishedContent: policy.content,
          status: "published",
          publishedAt
        }
      })
    )
  );

  const categoryNames = [
    "Academic Books",
    "Islamic Books",
    "Children Books",
    "Literature",
    "Admission Books"
  ];

  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.upsert({
        where: { slug: slugify(name) },
        update: { name, isActive: true },
        create: {
          name,
          slug: slugify(name),
          description: `${name} from Ayesha-Sharif Publication.`,
          isActive: true
        }
      })
    )
  );

  const tagNames = [
    "New",
    "Discount",
    "Upcoming",
    "Published",
    "Pre-order",
    "Best Seller",
    "Bangla",
    "English"
  ];

  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { slug: slugify(name) },
        update: { name, isActive: true },
        create: { name, slug: slugify(name), isActive: true }
      })
    )
  );

  const tagBySlug = new Map(tags.map((tag) => [tag.slug, tag]));
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

  const books = [
    {
      title: "Bangla Grammar Essentials",
      author: "Ayesha Rahman",
      category: "academic-books",
      regularPrice: "420",
      salePrice: "360",
      discountPercent: 14,
      stockQuantity: 48,
      status: "published" as const,
      labels: ["published", "new", "bangla"],
      isFeatured: true,
      isNewArrival: true,
      pages: 224,
      language: "Bangla"
    },
    {
      title: "Admission English Booster",
      author: "Sharif Hasan",
      category: "admission-books",
      regularPrice: "550",
      salePrice: "470",
      discountPercent: 15,
      stockQuantity: 62,
      status: "published" as const,
      labels: ["published", "best-seller", "english"],
      isBestSeller: true,
      pages: 312,
      language: "English"
    },
    {
      title: "Little Learners Alphabet",
      author: "Nusrat Jahan",
      category: "children-books",
      regularPrice: "260",
      salePrice: "220",
      discountPercent: 15,
      stockQuantity: 36,
      status: "published" as const,
      labels: ["published", "discount", "bangla"],
      isRecommended: true,
      pages: 80,
      language: "Bangla"
    },
    {
      title: "Stories of Bengal",
      author: "Mahmudul Karim",
      category: "literature",
      regularPrice: "390",
      salePrice: "390",
      discountPercent: 0,
      stockQuantity: 24,
      status: "published" as const,
      labels: ["published", "bangla"],
      isFeatured: true,
      pages: 176,
      language: "Bangla"
    },
    {
      title: "Daily Dua Companion",
      author: "Dr. Farhana Islam",
      category: "islamic-books",
      regularPrice: "320",
      salePrice: "280",
      discountPercent: 13,
      stockQuantity: 18,
      status: "published" as const,
      labels: ["published", "discount", "best-seller"],
      isBestSeller: true,
      pages: 144,
      language: "Bangla"
    },
    {
      title: "HSC Physics Quick Review",
      author: "Arif Chowdhury",
      category: "academic-books",
      regularPrice: "620",
      salePrice: "520",
      discountPercent: 16,
      stockQuantity: 0,
      status: "out_of_stock" as const,
      labels: ["published", "discount"],
      pages: 360,
      language: "Bangla"
    },
    {
      title: "Children's Moral Tales",
      author: "Maliha Sultana",
      category: "children-books",
      regularPrice: "300",
      salePrice: "255",
      discountPercent: 15,
      stockQuantity: 40,
      status: "published" as const,
      labels: ["published", "new", "bangla"],
      isNewArrival: true,
      pages: 96,
      language: "Bangla"
    },
    {
      title: "University Math Prep",
      author: "Sajid Ahmed",
      category: "admission-books",
      regularPrice: "700",
      salePrice: "640",
      discountPercent: 9,
      stockQuantity: 20,
      status: "pre_order" as const,
      labels: ["pre-order", "english"],
      isRecommended: true,
      pages: 420,
      language: "English"
    },
    {
      title: "Seerah for Young Readers",
      author: "Kamrul Islam",
      category: "islamic-books",
      regularPrice: "450",
      salePrice: "450",
      discountPercent: 0,
      stockQuantity: 0,
      status: "upcoming" as const,
      labels: ["upcoming", "bangla"],
      pages: 210,
      language: "Bangla"
    },
    {
      title: "Modern Bangla Essays",
      author: "Tahmina Akter",
      category: "literature",
      regularPrice: "480",
      salePrice: "410",
      discountPercent: 15,
      stockQuantity: 12,
      status: "published" as const,
      labels: ["published", "discount", "new"],
      isNewArrival: true,
      pages: 256,
      language: "Bangla"
    }
  ];

  for (const item of books) {
    const slug = slugify(item.title);
    const book = await prisma.book.upsert({
      where: { slug },
      update: {
        title: item.title,
        author: item.author,
        categoryId: categoryBySlug.get(item.category)?.id,
        regularPrice: item.regularPrice,
        salePrice: item.salePrice,
        discountPercent: item.discountPercent,
        stockQuantity: item.stockQuantity,
        status: item.status,
        isFeatured: item.isFeatured ?? false,
        isBestSeller: item.isBestSeller ?? false,
        isNewArrival: item.isNewArrival ?? false,
        isRecommended: item.isRecommended ?? false
      },
      create: {
        title: item.title,
        slug,
        subtitle: "A practical book for Bangladeshi readers",
        author: item.author,
        publisher: "Ayesha-Sharif Publication",
        isbn13: `978984${Math.floor(1000000 + Math.random() * 8999999)}`,
        edition: "1st Edition",
        language: item.language,
        pages: item.pages,
        binding: "Paperback",
        publicationDate: new Date("2026-01-15"),
        shortDescription:
          "A clear, reader-friendly title prepared for everyday learning and reference.",
        description:
          "This sample book entry demonstrates the catalogue structure for Ayesha-Sharif Publication. Replace this text with the final back-cover copy, author note, and table-of-contents summary before launch.",
        regularPrice: item.regularPrice,
        salePrice: item.salePrice,
        discountPercent: item.discountPercent,
        discountStart: item.discountPercent ? new Date("2026-01-01") : null,
        discountEnd: item.discountPercent ? new Date("2026-12-31") : null,
        stockQuantity: item.stockQuantity,
        status: item.status,
        coverImage: null,
        galleryImages: [],
        samplePdf: null,
        weight: 300,
        isFeatured: item.isFeatured ?? false,
        isBestSeller: item.isBestSeller ?? false,
        isNewArrival: item.isNewArrival ?? false,
        isRecommended: item.isRecommended ?? false,
        categoryId: categoryBySlug.get(item.category)?.id
      }
    });

    await prisma.bookTag.deleteMany({ where: { bookId: book.id } });
    await prisma.bookTag.createMany({
      data: item.labels
        .map((label) => tagBySlug.get(label))
        .filter(Boolean)
        .map((tag) => ({ bookId: book.id, tagId: tag!.id })),
      skipDuplicates: true
    });
  }

  await prisma.banner.createMany({
    data: [
      {
        title: "Quality books from Ayesha-Sharif Publication",
        subtitle: "Delivered to your doorstep across Bangladesh.",
        image: "/banners/homepage-banner.png",
        link: "/books",
        position: "homepage_hero",
        isActive: true
      },
      {
        title: "Launch discount on selected books",
        subtitle: "Simple ordering, manual payment, and cash on delivery.",
        image: "/banners/discount-banner.jpg",
        link: "/books?tag=discount",
        position: "discount",
        isActive: true
      }
    ],
    skipDuplicates: true
  });

  await prisma.siteSetting.upsert({
    where: { key: "delivery_charges" },
    update: {
      value: {
        inside_dhaka: 70,
        outside_dhaka: 120,
        inside_chattogram: 60,
        outside_chattogram: 120,
        other: 120
      }
    },
    create: {
      key: "delivery_charges",
      value: {
        inside_dhaka: 70,
        outside_dhaka: 120,
        inside_chattogram: 60,
        outside_chattogram: 120,
        other: 120
      }
    }
  });

  await prisma.siteSetting.upsert({
    where: { key: "contact" },
    update: {
      value: {
        phone: "+8801XXXXXXXXX",
        whatsapp: "+8801XXXXXXXXX",
        email: "hello@ayeshasharif.com",
        facebook: "https://facebook.com/ayeshasharifpublication",
        address: "Office address, Dhaka, Bangladesh"
      }
    },
    create: {
      key: "contact",
      value: {
        phone: "+8801XXXXXXXXX",
        whatsapp: "+8801XXXXXXXXX",
        email: "hello@ayeshasharif.com",
        facebook: "https://facebook.com/ayeshasharifpublication",
        address: "Office address, Dhaka, Bangladesh"
      }
    }
  });

  console.log(`Seeded database. Admin: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
