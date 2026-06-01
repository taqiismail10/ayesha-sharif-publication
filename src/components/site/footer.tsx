import Image from "next/image";
import Link from "next/link";
import { Facebook, Mail, Phone } from "lucide-react";
import { defaultContact, policyLinks, publicNav } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-12 bg-navy text-white">
      <div className="container-px mx-auto grid max-w-7xl gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image
            src="/logo/logo-white.png"
            alt="Ayesha-Sharif Publication"
            width={150}
            height={56}
            className="mb-4 h-14 w-auto object-contain"
          />
          <p className="text-sm leading-6 text-white/75">
            Premium but simple book publishing and ordering for Bangladeshi
            readers.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-extrabold uppercase text-gold">Explore</h3>
          <div className="grid gap-2 text-sm text-white/80">
            {publicNav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
            <Link href="/admin/login" className="hover:text-white">
              Admin Login
            </Link>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-extrabold uppercase text-gold">Policies</h3>
          <div className="grid gap-2 text-sm text-white/80">
            {policyLinks.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-extrabold uppercase text-gold">Contact</h3>
          <div className="grid gap-3 text-sm text-white/80">
            <p className="flex items-center gap-2" suppressHydrationWarning>
              <Phone className="h-4 w-4 text-gold" aria-hidden="true" />
              <span suppressHydrationWarning>{defaultContact.phone}</span>
            </p>
            <p className="flex items-center gap-2" suppressHydrationWarning>
              <Mail className="h-4 w-4 text-gold" aria-hidden="true" />
              <span suppressHydrationWarning>{defaultContact.email}</span>
            </p>
            <p className="flex items-center gap-2" suppressHydrationWarning>
              <Facebook className="h-4 w-4 text-gold" aria-hidden="true" />
              <span suppressHydrationWarning>Facebook page placeholder</span>
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © 2026 Ayesha-Sharif Publication. All rights reserved.
      </div>
    </footer>
  );
}
