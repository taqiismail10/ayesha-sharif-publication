import { redirect } from "next/navigation";

export default function CustomerPrivacyRedirectPage() {
  redirect("/account/settings#privacy");
}
