import type { Metadata } from "next";
import type { ComponentType } from "react";
import Link from "next/link";
import {
  BookMarked,
  BookOpen,
  CircleHelp,
  PackageCheck,
} from "lucide-react";
import { fetchCustomerApi, requireCustomer } from "@/lib/customer-auth";
import { AccountCartOverviewCard } from "@/components/account/account-cart-summary";

export const metadata: Metadata = {
  title: "My Account",
  description: "Your Ayesha-Sharif Publication account dashboard.",
};

export default async function CustomerAccountDashboardPage() {
  const customer = await requireCustomer();
  const dashboardResponse = await fetchCustomerApi("/customers/me/dashboard");
  const dashboard = dashboardResponse?.ok
    ? ((await dashboardResponse.json()) as {
        ordersCount?: number;
        savedBooksCount?: number;
      })
    : {};
  const orderCount = dashboard.ordersCount ?? 0;
  const savedCount = dashboard.savedBooksCount ?? 0;

  const displayName = customer.profile?.displayName || customer.name || "Reader";

  return (
    <div className="container-px mx-auto max-w-7xl py-8">
      <div className="mb-6">
        <p className="story-kicker">Reader account</p>
        <h1 className="font-serif text-3xl font-medium text-forest">
          My Account
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Welcome back, {displayName}. Use these quick actions to keep shopping,
          review your orders, and reach support.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardCard
          icon={BookOpen}
          title="Browse Books"
          value="Start here"
          detail="Find your next book"
          actionLabel="Browse books"
          actionHref="/books"
        />
        <DashboardCard
          icon={PackageCheck}
          title="Orders"
          value={orderCount.toString()}
          detail="Track your purchases"
          actionLabel="View orders"
          actionHref="/account/orders"
        />
        <DashboardCard
          icon={BookMarked}
          title="Saved Books"
          value={savedCount.toString()}
          detail="Books you want to revisit"
          actionLabel="View saved books"
          actionHref="/account/saved-books"
        />
        <AccountCartOverviewCard
          title="Cart"
          helperText="Continue checkout"
          emptyLabel="Empty"
          linkLabel="Open cart"
          href="/cart"
        />
        <DashboardCard
          icon={CircleHelp}
          title="Support"
          value="Need help?"
          detail="Help with delivery, payment, and returns"
          actionLabel="Contact support"
          actionHref="/contact"
        />
      </div>
    </div>
  );
}

function DashboardCard({
  icon: Icon,
  title,
  value,
  detail,
  actionLabel,
  actionHref,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  value: string;
  detail: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex min-h-[188px] flex-col rounded-lg border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-soft">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-page text-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <Icon className="h-5 w-5" aria-hidden={true} />
      </span>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-muted">
        {title}
      </p>
      <p className="mt-2 text-2xl font-medium text-forest">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
      <Link
        href={actionHref}
        className="focus-ring mt-auto inline-flex w-fit pt-4 text-sm font-bold text-forest underline decoration-gold/70 underline-offset-4"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
