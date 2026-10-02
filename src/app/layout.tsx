import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VAHL — Mørketid, Kaliber 01",
  description:
    "A hand-wound watch from a three-person workshop in Tromsø. A constant-force remontoir moves its seconds hand once a second, in one exact step. 24 pieces a year, by request.",
};

export const viewport: Viewport = {
  themeColor: "#d8d5ce",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>
        <noscript>
          <style>{`.stage,.track,.cursor{display:none!important}.spacer{height:auto!important;padding:18vh var(--gutter) 0}.sr-copy{position:static!important;width:auto!important;height:auto!important;clip:auto!important;clip-path:none!important;overflow:visible!important;white-space:normal!important;max-width:60ch}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
