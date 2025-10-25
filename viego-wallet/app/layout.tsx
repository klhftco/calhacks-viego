import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Viego Wallet - Student Financial Companion",
  description: "Gamified student wallet with budgeting, savings, and merchant acceptance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <Navigation />
          <main className="pb-20">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
