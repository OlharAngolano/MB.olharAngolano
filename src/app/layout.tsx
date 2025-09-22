import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Olhar Angolano - Comunidade Exclusiva",
  description: "Área de membros exclusiva do Olhar Angolano. Conecte-se, aprenda e cresça com nossa comunidade.",
  keywords: ["Olhar Angolano", "comunidade", "membros", "YouTube", "Angola"],
  authors: [{ name: "Olhar Angolano" }],
  openGraph: {
    title: "Olhar Angolano - Comunidade Exclusiva",
    description: "Área de membros exclusiva do Olhar Angolano. Conecte-se, aprenda e cresça com nossa comunidade.",
    url: "https://olharangolano.com",
    siteName: "Olhar Angolano",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Olhar Angolano - Comunidade Exclusiva",
    description: "Área de membros exclusiva do Olhar Angolano. Conecte-se, aprenda e cresça com nossa comunidade.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
