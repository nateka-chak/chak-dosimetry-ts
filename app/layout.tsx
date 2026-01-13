import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { initDatabase } from '@/lib/database';
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import Providers from "./Providers";

const gillSans = localFont({
  src: "../public/fonts/GillSansMT.ttf",
  variable: "--font-gillsans",
  weight: "400",
  style: "normal",
});


export const metadata: Metadata = {
  title: 'CBSL Inventory Tracker',
  description: 'Inventory Tracking System for Christian Health Association of Kenya',
};

export const icon = {
  icon: '/chak-dosimetry-ts/CHAKlogo.png',
};

export const revalidate = 0;

initDatabase().catch(console.error);


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={gillSans.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}