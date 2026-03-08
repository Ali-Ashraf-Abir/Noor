import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Noor — Your Deen Buddy",
  description: "Accurate prayer times, fasting schedule (Sahur & Iftar), and the 99 beautiful names of Allah ,Hadith collection, Quran, Trackers and more. Your all-in-one Islamic companion app.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="pattern-bg theme-transition min-h-screen flex flex-col">
       <AuthProvider> <ThemeProvider>
          <Navbar />
          <main className="flex-1 pt-16 md:pt-[4.5rem]">{children}</main>
          <Footer />
        </ThemeProvider></AuthProvider>
      </body>
    </html>
  );
}