"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { adminApi, assertAdminRole } from "@/lib/auth";
import { revalidatePublicPolicy } from "@/lib/cache-invalidation";
import { policyDraftSchema, policyPublishSchema } from "@/lib/policy-definitions";

export type PolicyActionState = {
  success?: boolean;
  message?: string;
  error?: string;
  requestId?: string;
};

function valuesFrom(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? ""),
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
  };
}

function failure(error: unknown, fallback: string): PolicyActionState {
  if (error instanceof ZodError) {
    return { error: error.issues[0]?.message ?? fallback, requestId: crypto.randomUUID() };
  }
  return { error: fallback, requestId: crypto.randomUUID() };
}

export async function savePolicyDraftAction(
  _previous: PolicyActionState,
  formData: FormData,
): Promise<PolicyActionState> {
  try {
    await assertAdminRole(["super_admin", "admin"]);
    const values = policyDraftSchema.parse(valuesFrom(formData));
    const response = await adminApi(`/admin/policies/${values.slug}/draft`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: values.title, content: values.content }) });
    if (!response.ok) throw new Error("Unable to save the policy draft.");
    revalidatePath("/admin/policies");
    return {
      success: true,
      message: "Draft saved. The published policy is unchanged.",
      requestId: crypto.randomUUID(),
    };
  } catch (error) {
    return failure(error, "Unable to save the policy draft.");
  }
}

export async function publishPolicyAction(
  _previous: PolicyActionState,
  formData: FormData,
): Promise<PolicyActionState> {
  try {
    await assertAdminRole(["super_admin", "admin"]);
    const values = policyPublishSchema.parse(valuesFrom(formData));
    const response = await adminApi(`/admin/policies/${values.slug}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: values.title, content: values.content }) });
    if (!response.ok) throw new Error("Unable to publish the policy.");
    revalidatePublicPolicy(values.slug);
    revalidatePath("/admin/policies");
    return {
      success: true,
      message: "Policy published successfully.",
      requestId: crypto.randomUUID(),
    };
  } catch (error) {
    return failure(error, "Unable to publish the policy.");
  }
}
