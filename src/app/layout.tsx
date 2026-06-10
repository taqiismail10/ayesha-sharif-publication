import type { Metadata } from "next";
import { Crimson_Text, Inter, Noto_Serif_Bengali } from "next/font/google";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll";
import "./globals.css";

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});

/**
 * Noto Serif Bengali — high-quality editorial Bengali serif.
 * Loaded in its own bundle to keep the Latin serif/sans bundles lean.
 * Exposed as --font-bengali; applied to all Bengali display headings.
 */
const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ["bengali"],
  weight: ["400", "600"],
  variable: "--font-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "Ayesha-Sharif Publication",
    template: "%s | Ayesha-Sharif Publication"
  },
  description:
    "Quality books from Ayesha-Sharif Publication, delivered to your doorstep.",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-simplified.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-simplified-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-simplified-16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/logo/logo-icon-simplified-256.png", sizes: "256x256", type: "image/png" }
    ]
  },
  openGraph: {
    title: "Ayesha-Sharif Publication",
    description:
      "Quality books from Ayesha-Sharif Publication, delivered to your doorstep.",
    siteName: "Ayesha-Sharif Publication",
    images: ["/banners/homepage-banner.png"]
  }
};

const extensionHydrationCleanup = `
  (function () {
    function unwrapHighlights(root) {
      var spans = root.querySelectorAll ? root.querySelectorAll('span.dict-highlight') : [];
      spans.forEach(function (span) {
        span.replaceWith(document.createTextNode(span.textContent || ''));
      });
    }

    function cleanExtensionMutations() {
      if (document.body) {
        document.body.removeAttribute('data-dictozo-extension-installed');
        document.body.removeAttribute('cz-shortcut-listen');
      }

      unwrapHighlights(document);

      document.querySelectorAll('[style*="font-family"]').forEach(function (node) {
        if (!node.style || !node.style.fontFamily) return;
        // Preserve our intentional CSS-variable font references (e.g. var(--font-serif)).
        // Only strip font-family injected by browser extensions (no var() reference).
        if (node.style.fontFamily.indexOf('var(--font-') !== -1) return;
        node.style.removeProperty('font-family');
        if (!(node.getAttribute('style') || '').trim()) {
          node.removeAttribute('style');
        }
      });
    }

    cleanExtensionMutations();

    var isCleaning = false;
    var observer = new MutationObserver(function () {
      if (isCleaning) return;
      isCleaning = true;
      try {
        cleanExtensionMutations();
      } finally {
        isCleaning = false;
      }
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'data-dictozo-extension-installed', 'cz-shortcut-listen']
    });
  })();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${crimsonText.variable} ${inter.variable} ${notoSerifBengali.variable}`}>
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
        {/* Extension cleanup runs outside the Lenis wrapper so Lenis's
            own DOM mutations are never touched by the cleanup observer */}
        <script
          id="extension-hydration-cleanup"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: extensionHydrationCleanup
          }}
        />
      </body>
    </html>
  );
}
