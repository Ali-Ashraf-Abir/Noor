import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Noor — Islamic Prayer Times, Fasting & 99 Names",
  description: "Accurate prayer times, fasting schedule (Sahur & Iftar), and the 99 beautiful names of Allah — personalised for your location.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="pattern-bg theme-transition min-h-screen flex flex-col">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 pt-16 md:pt-[4.5rem]">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}