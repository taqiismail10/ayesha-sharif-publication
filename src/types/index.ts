import type {
  AdminRole,
  BookStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus
} from "@prisma/client";

export type Money = number;

export type BookCardData = {
  id: string;
  title: string;
  slug: string;
  author: string;
  regularPrice: Money;
  salePrice: Money;
  discountPercent: number;
  stockQuantity: number;
  status: BookStatus;
  coverImage: string | null;
  category: { name: string; slug: string } | null;
  tags: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isRecommended: boolean;
};

export type BookDetailData = BookCardData & {
  subtitle: string | null;
  publisher: string;
  isbn13: string | null;
  edition: string | null;
  language: string;
  pages: number | null;
  binding: string | null;
  publicationDate: string | null;
  shortDescription: string | null;
  description: string | null;
  galleryImages: string[];
  samplePdf: string | null;
  weight: number | null;
};

export type CartItem = {
  bookId: string;
  title: string;
  slug: string;
  author: string;
  coverImage: string | null;
  regularPrice: number;
  salePrice: number;
  stockQuantity: number;
  quantity: number;
};

export type AdminSession = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  exp: number;
};

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  stockReduced: boolean;
  createdAt: string;
};
