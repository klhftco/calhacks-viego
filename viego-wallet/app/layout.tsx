import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { IslandProvider } from "@/context/IslandContext";
import { AuthProvider } from "@/contexts/AuthContext";

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50">
          <AuthProvider>
            <IslandProvider>
              <Navigation />
              <main className="pb-20">
                {children}
              </main>
            </IslandProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
