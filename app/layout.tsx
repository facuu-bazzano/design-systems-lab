import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.PAGES_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Laboratorio de Sistemas de Diseño",
  description: "Explorá, configurá y exportá las foundations de tu próximo sistema de diseño.",
  icons: {
    icon: [
      { url: `${basePath}/brand/logo-for-light-mode.png`, media: "(prefers-color-scheme: light)" },
      { url: `${basePath}/brand/logo-for-dark-mode.png`, media: "(prefers-color-scheme: dark)" },
    ],
    shortcut: `${basePath}/brand/logo-for-light-mode.png`,
    apple: `${basePath}/brand/logo-for-dark-mode.png`,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body suppressHydrationWarning>{children}</body></html>;
}
