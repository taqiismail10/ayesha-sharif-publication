/** API-domain values mirrored from the public/admin NestJS contracts. */
export type AdminRole = "super_admin" | "admin" | "editor" | "order_manager";
export type BookStatus =
  | "draft"
  | "upcoming"
  | "pre_order"
  | "published"
  | "out_of_stock"
  | "archived";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";
export type PaymentMethod = "cash_on_delivery" | "bkash" | "nagad" | "rocket";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

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

/** Minimal admin API shapes; these are not database client models. */
export type Book = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  author: string;
  publisher: string;
  isbn13: string | null;
  edition: string | null;
  language: string;
  pages: number | null;
  binding: string | null;
  publicationDate: Date | null;
  shortDescription: string | null;
  description: string | null;
  regularPrice: number | string;
  salePrice: number | string;
  discountPercent: number;
  discountStart: Date | null;
  discountEnd: Date | null;
  stockQuantity: number;
  status: BookStatus;
  coverImage: string | null;
  galleryImages: string[];
  samplePdf: string | null;
  weight: number | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isRecommended: boolean;
  categoryId: string | null;
  updatedAt: Date;
};

export type BookTag = { bookId: string; tagId: string };
export type Category = { id: string; name: string; slug?: string };
export type Tag = { id: string; name: string; slug?: string };
