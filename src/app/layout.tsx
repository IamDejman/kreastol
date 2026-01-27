import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/Toast";
import { GlobalModals } from "@/components/layout/GlobalModals";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "optional",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "optional",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1E3A8A",
};

export const metadata: Metadata = {
  title: "No13teen - Book Your Stay",
  description: "Guests will enjoy a serene environment during their stay",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "No13teen",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-body antialiased">
        <Providers>
          {children}
          <Toaster />
          <GlobalModals />
        </Providers>
      </body>
    </html>
  );
}
