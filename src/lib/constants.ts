import type {
  AdminRole,
  BookStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus
} from "@prisma/client";

export const brand = {
  name: "Ayesha-Sharif Publication",
  tagline: "Quality books from Ayesha-Sharif Publication, delivered to your doorstep.",
  publisher: "Ayesha-Sharif Publication",
  colors: {
    navy: "#10233F",
    cream: "#F7F1E3",
    gold: "#C9A227",
    emerald: "#0F766E",
    danger: "#B42318",
    ink: "#111827",
    muted: "#6B7280",
    line: "#E5E7EB",
    page: "#FFFCF6"
  }
};

export const publicNav = [
  { href: "/", label: "Home" },
  { href: "/books", label: "Books" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

export const policyLinks = [
  { href: "/delivery-policy", label: "Delivery Policy" },
  { href: "/payment-policy", label: "Payment Policy" },
  { href: "/return-policy", label: "Return Policy" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" }
];

export const defaultContact = {
  phone: "+8801XXXXXXXXX",
  whatsapp: "+8801XXXXXXXXX",
  email: "hello@ayeshasharif.com",
  facebook: "https://facebook.com/ayeshasharifpublication",
  address: "Office address, Dhaka, Bangladesh"
};

export type DeliveryAreaOption = {
  value: string;
  label: string;
  charge: number;
};

export const deliveryAreas: DeliveryAreaOption[] = [
  { value: "inside_dhaka", label: "Inside Dhaka", charge: 70 },
  { value: "outside_dhaka", label: "Outside Dhaka", charge: 120 },
  { value: "inside_chattogram", label: "Inside Chattogram", charge: 60 },
  { value: "outside_chattogram", label: "Outside Chattogram", charge: 120 },
  { value: "other", label: "Other districts", charge: 120 }
];

export const paymentInstructions: Record<PaymentMethod, string> = {
  cash_on_delivery: "Pay in cash after receiving the books.",
  bkash:
    "Send payment to the merchant bKash number shown on the invoice, then enter your transaction ID.",
  nagad:
    "Send payment to the merchant Nagad number shown on the invoice, then enter your transaction ID.",
  rocket:
    "Send payment to the merchant Rocket number shown on the invoice, then enter your transaction ID."
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash_on_delivery: "Cash on Delivery",
  bkash: "Manual bKash",
  nagad: "Manual Nagad",
  rocket: "Manual Rocket"
};

export const bookStatusLabels: Record<BookStatus, string> = {
  draft: "Draft",
  upcoming: "Upcoming",
  pre_order: "Pre-order",
  published: "Published",
  out_of_stock: "Out of stock",
  archived: "Archived"
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned"
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  pending: "Pending verification",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded"
};

export const adminRoleLabels: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
  order_manager: "Order Manager"
};

export const manualPaymentMethods: PaymentMethod[] = ["bkash", "nagad", "rocket"];
