type DecimalLike = {
  toString(): string;
};

export function toNumber(value: number | string | DecimalLike | null | undefined) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

export function formatCurrency(
  value: number | string | DecimalLike | null | undefined
) {
  const amount = toNumber(value);
  return `৳${amount.toLocaleString("en-BD", {
    maximumFractionDigits: 0
  })}`;
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function percentOff(regularPrice: number, salePrice: number) {
  if (!regularPrice || salePrice >= regularPrice) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(value: string | null | undefined, length = 120) {
  if (!value) return "";
  if (value.length <= length) return value;
  return `${value.slice(0, length).trim()}...`;
}
