import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Anup Thakur | AI Persona - Chat & Schedule",
  description: "Chat with Anup Thakur's AI representative. Ask about his background, projects, skills, or book an interview slot directly.",
  openGraph: {
    title: "Anup Thakur | AI Persona",
    description: "AI-powered representative for Anup Thakur - Full Stack Developer & AI Engineer",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
