"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { assertAdminRole } from "@/lib/auth";
import { revalidatePublicPolicy } from "@/lib/cache-invalidation";
import { publishPolicy, savePolicyDraft } from "@/lib/policy-admin";
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
    const admin = await assertAdminRole(["super_admin", "admin"]);
    const values = policyDraftSchema.parse(valuesFrom(formData));
    await savePolicyDraft(values, admin.id);
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
    const admin = await assertAdminRole(["super_admin", "admin"]);
    const values = policyPublishSchema.parse(valuesFrom(formData));
    await publishPolicy(values, admin.id);
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
