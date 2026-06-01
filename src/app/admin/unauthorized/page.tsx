import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="container-px grid min-h-screen place-items-center bg-page py-10">
      <div className="max-w-md rounded-lg border border-line bg-white p-8 text-center">
        <h1 className="text-2xl font-extrabold text-danger">Unauthorized</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Your admin role does not have permission to access this section.
        </p>
        <Link
          href="/admin"
          className="mt-5 inline-flex rounded-md bg-navy px-5 py-3 text-sm font-extrabold text-white"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
