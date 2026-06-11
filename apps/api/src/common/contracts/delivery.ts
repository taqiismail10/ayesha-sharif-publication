/**
 * Delivery areas + default charges — ported from src/lib/constants.ts.
 * Runtime values can be overridden by the SiteSetting key "delivery_charges"
 * (admin-editable), exactly like src/lib/settings.ts did.
 */

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
  { value: "other", label: "Other districts", charge: 120 },
];

/** Unknown area falls back to 120 — same as src/lib/order-utils.ts. */
export function deliveryChargeFor(
  deliveryArea: string,
  options: DeliveryAreaOption[] = deliveryAreas,
) {
  return options.find((area) => area.value === deliveryArea)?.charge ?? 120;
}
