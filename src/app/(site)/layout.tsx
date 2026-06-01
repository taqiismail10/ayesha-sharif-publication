import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="relative overflow-hidden soft-grid-bg">{children}</main>
      <Footer />
    </>
  );
}
