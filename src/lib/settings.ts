import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS } from "@/lib/cache-tags";
import { deliveryAreas, type DeliveryAreaOption } from "@/lib/constants";
import { hasUsableDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type DeliverySettingValue = Record<string, number>;

async function queryDeliveryOptions(): Promise<DeliveryAreaOption[]> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "delivery_charges" }
    });
    const value = (setting?.value || {}) as DeliverySettingValue;
    return deliveryAreas.map((area) => ({
      ...area,
      charge: Number(value[area.value] ?? area.charge)
    }));
  } catch {
    return deliveryAreas;
  }
}

const getCachedDeliveryOptions = unstable_cache(
  queryDeliveryOptions,
  ["public-delivery-options"],
  {
    revalidate: CACHE_REVALIDATE_SECONDS.settings,
    tags: [CACHE_TAGS.settings]
  }
);

export async function getDeliveryOptions(): Promise<DeliveryAreaOption[]> {
  if (!hasUsableDatabaseUrl()) return deliveryAreas;
  return getCachedDeliveryOptions();
}
