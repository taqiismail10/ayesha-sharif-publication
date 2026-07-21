import type { Metadata } from "next";
import { Anek_Bangla, Crimson_Text, Inter, Montserrat, Noto_Serif_Bengali } from "next/font/google";
import "./globals.css";

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

/**
 * Noto Serif Bengali — heavy editorial Bengali display serif.
 * Used for the hero brand line (আয়েশা-শরীফ পাবলিকেশন্স) so the headline
 * reads as a poster-style serif block, matching the reference composition.
 */
const bengaliDisplay = Noto_Serif_Bengali({
  subsets: ["bengali"],
  weight: ["700", "900"],
  variable: "--font-bengali-display",
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
/**
 * Montserrat — geometric Latin display sans for the MAIN English hero title
 * (outline + solid split, like the SUST CSE / CARNIVAL 2026 reference).
 * text-stroke renders cleanly on Latin capitals — simple closed shapes,
 * unlike Bengali conjuncts/matras which break under stroke rendering.
 * Consumed ONLY by .hero-title.
 */
const displayFont = Montserrat({
  subsets: ["latin"],
  weight: ["800", "900"],
  variable: "--font-display",
  display: "swap",
});

/**
 * Anek Bangla — clean geometric Bengali sans. Now used for the SOLID Bengali
 * subtitle under the English hero title (no outline/stroke on Bengali ever).
 */
const heroBangla = Anek_Bangla({
  subsets: ["bengali"],
  weight: ["800"],
  variable: "--font-hero-bangla",
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
      if (root.matches && root.matches('span.dict-highlight')) {
        root.replaceWith(document.createTextNode(root.textContent || ''));
        return;
      }

      var spans = root.querySelectorAll ? root.querySelectorAll('span.dict-highlight') : [];
      spans.forEach(function (span) {
        span.replaceWith(document.createTextNode(span.textContent || ''));
      });
    }

    function stripInjectedFont(node) {
      if (!node || !node.style || !node.style.fontFamily) return;
      // Preserve our intentional CSS-variable font references (e.g. var(--font-serif)).
      // Only strip font-family injected by browser extensions (no var() reference).
      if (node.style.fontFamily.indexOf('var(--font-') !== -1) return;
      node.style.removeProperty('font-family');
      if (!(node.getAttribute('style') || '').trim()) {
        node.removeAttribute('style');
      }
    }

    function cleanTree(root) {
      if (!root || root.nodeType !== 1 && root.nodeType !== 9) return;
      unwrapHighlights(root);
      stripInjectedFont(root);
      var styled = root.querySelectorAll ? root.querySelectorAll('[style*="font-family"]') : [];
      styled.forEach(stripInjectedFont);
    }

    function cleanBodyAttributes() {
      if (document.body) {
        document.body.removeAttribute('data-dictozo-extension-installed');
        document.body.removeAttribute('cz-shortcut-listen');
      }
    }

    // One complete cleanup after hydration. Later work is scoped to only the
    // nodes an extension adds or marks, so normal app style updates stay cheap.
    cleanBodyAttributes();
    cleanTree(document);

    var observer;
    var observerOptions = {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'data-dictozo-extension-installed', 'cz-shortcut-listen']
    };

    observer = new MutationObserver(function (records) {
      observer.disconnect();
      try {
        records.forEach(function (record) {
          if (record.type === 'attributes') {
            if (record.target === document.body) cleanBodyAttributes();
            if (record.attributeName === 'class') unwrapHighlights(record.target);
            return;
          }

          record.addedNodes.forEach(function (node) {
            cleanTree(node);
          });
        });
      } finally {
        observer.observe(document.documentElement, observerOptions);
      }
    });

    observer.observe(document.documentElement, observerOptions);
  })();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${crimsonText.variable} ${inter.variable} ${displayFont.variable} ${heroBangla.variable} ${bengaliDisplay.variable}`}>
        {children}
        {/* Remove browser-extension mutations that can cause hydration drift. */}
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
