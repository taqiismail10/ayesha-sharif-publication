import { JetBrains_Mono } from "next/font/google";
import "./audit.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`audit-page ${jetbrainsMono.variable}`}>
      {children}
    </div>
  );
}
