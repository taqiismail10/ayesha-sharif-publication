import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS } from "@/lib/cache-tags";
import { deliveryAreas, type DeliveryAreaOption } from "@/lib/constants";
import { fetchPublicApi } from "@/lib/public-api";

async function queryDeliveryOptions(): Promise<DeliveryAreaOption[]> {
  try {
    return await fetchPublicApi<DeliveryAreaOption[]>("/settings/delivery");
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
  return getCachedDeliveryOptions();
}
