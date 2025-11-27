import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AuthGuard from "@/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedLink",
  description:
    "Professional frontend for MedLink: purchase-request, approval and finance management UI.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "MedLink",
    description:
      "Professional frontend for MedLink: purchase-request, approval and finance management UI.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://assessment-advanced-fe.vercel.app",
    siteName: "MedLink",
    images: [
      {
        url: "/favicon.svg",
        width: 800,
        height: 600,
        alt: "MedLink",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MedLink — Frontend",
    description:
      "Professional frontend for MedLink: purchase-request, approval and finance management UI.",
    images: ["/favicon.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthGuard>{children}</AuthGuard>
        <Toaster position="top-center"></Toaster>
      </body>
    </html>
  );
}
