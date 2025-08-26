import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { initDatabase } from '@/lib/database';
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'CHAK Dosimetry Tracker',
  description: 'Dosimetry Tracking System for Christian Health Association of Kenya',
};

// Initialize database on server start
initDatabase().catch(console.error);


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}