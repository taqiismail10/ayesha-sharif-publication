import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "Ayesha-Sharif Publication",
    template: "%s | Ayesha-Sharif Publication"
  },
  description:
    "Quality books from Ayesha-Sharif Publication, delivered to your doorstep.",
  icons: {
    icon: "/favicon/favicon.ico"
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
      <body suppressHydrationWarning>
        {children}
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
