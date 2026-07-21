import { redirect } from "next/navigation";

export default function LegacyCustomerProfilePage() {
  redirect("/account/settings#profile");
}
