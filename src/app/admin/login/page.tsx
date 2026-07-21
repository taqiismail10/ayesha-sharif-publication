import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  return (
    <main className="admin-theme admin-login container-px grid min-h-screen place-items-center bg-page py-10">
      <div className="admin-login-card w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="mb-6 text-center">
          <Image
            src="/logo/logo-horizontal-forest-transparent-trimmed.png"
            alt="Ayesha-Sharif Publication"
            width={1510}
            height={272}
            className="mx-auto h-auto w-[220px] object-contain"
          />
          <h1 className="mt-4 text-2xl font-extrabold text-navy">Admin Login</h1>
          <p className="mt-1 text-sm text-muted">
            Protected access for publication staff only.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
