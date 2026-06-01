import "server-only";

import { deliveryAreas, type DeliveryAreaOption } from "@/lib/constants";
import { hasUsableDatabaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type DeliverySettingValue = Record<string, number>;

export async function getDeliveryOptions(): Promise<DeliveryAreaOption[]> {
  if (!hasUsableDatabaseUrl()) return deliveryAreas;

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
