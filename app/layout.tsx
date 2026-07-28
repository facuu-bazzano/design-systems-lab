import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.PAGES_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Laboratorio de Sistemas de Diseño",
  description: "Explorá, configurá y exportá las foundations de tu próximo sistema de diseño.",
  icons: { icon: `${basePath}/favicon.svg`, shortcut: `${basePath}/favicon.svg` },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
