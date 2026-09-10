"use server";

import { redirect } from "next/navigation";
import {
  clearCustomerSession
} from "@/lib/customer-auth";

export type CustomerActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

export async function registerCustomerAction(
  previousState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  void previousState;
  void formData;
  return {
    error:
      "Email verification is required. Start again from the registration page."
  };
}

export async function logoutCustomerAction() {
  await clearCustomerSession();
  redirect("/");
}
