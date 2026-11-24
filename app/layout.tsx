import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KnowledgeHub-AI | Your Personal AI Tutor",
  description:
    "Learn smarter with personalised AI companions and real-time voice conversations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="antialiased">
        <div className="dashboard-layout">
          <Navbar />

          <div className="dashboard-content">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}