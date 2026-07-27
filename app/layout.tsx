import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.PAGES_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Laboratorio de Sistemas de DiseÃ±o",
  description: "ExplorÃ¡, configurÃ¡ y exportÃ¡ las foundations de tu prÃ³ximo sistema de diseÃ±o.",
  icons: { icon: `${basePath}/favicon.svg`, shortcut: `${basePath}/favicon.svg` },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
