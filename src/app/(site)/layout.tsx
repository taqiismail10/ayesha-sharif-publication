import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { PageAtmosphere } from "@/components/site/page-atmosphere";
import { ScrollRail } from "@/components/site/scroll-rail";
import { CookieConsentBanner } from "@/components/site/cookie-consent-banner";
import { ToastProvider } from "@/components/ui/toast";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <a href="#main" className="skip-to-content">Skip to content</a>
      <Header />
      <div className="site-canvas">
        {/* 88px = pill height 56px + top float 20px + buffer 12px */}
        <main id="main" tabIndex={-1} className="site-main" style={{ paddingTop: "88px" }}>
          <PageAtmosphere />
          <div className="site-main-content">
            {children}
          </div>
        </main>
        <Footer />
      </div>
      {/* Scroll progress rail — desktop only, outside main flow */}
      <ScrollRail />
      <CookieConsentBanner />
    </ToastProvider>
  );
}