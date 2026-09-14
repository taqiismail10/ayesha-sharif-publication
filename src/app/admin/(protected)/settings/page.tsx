import { Truck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminDeliveryOptions } from "@/lib/admin-content";
import { updateDeliverySettingsAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin(["super_admin", "admin"]);
  const deliveryOptions = await getAdminDeliveryOptions();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-extrabold text-navy">Settings</h1>
        <p className="mt-2 text-sm text-muted">
          Edit delivery charges used by cart, checkout, and order creation.
        </p>
      </div>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-cream text-gold">
            <Truck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-navy">Delivery charges</h2>
            <p className="text-sm text-muted">Amounts are stored in BDT.</p>
          </div>
        </div>
        <form
          action={updateDeliverySettingsAction}
          className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {deliveryOptions.map((area) => (
            <label key={area.value}>
              <span className="form-label">{area.label}</span>
              <input
                name={area.value}
                type="number"
                min={0}
                defaultValue={area.charge}
                className="form-input mt-1"
              />
            </label>
          ))}
          <div className="flex items-end">
            <button className="focus-ring min-h-12 w-full rounded-[4px] bg-forest px-5 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#1e3320]">
              Save settings
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
