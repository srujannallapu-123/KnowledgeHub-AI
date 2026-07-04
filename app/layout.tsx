import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";

import { ClerkProvider } from '@clerk/nextjs'
import { shadcn } from '@clerk/ui/themes'

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KnowledgeHub-AI",
  description: "Real-time AI Teaching Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <ClerkProvider appearance={{ theme: shadcn }}>
        <body className={`${bricolage.variable} antialiased`}>
          <ClerkProvider appearance={{variables: {colorPrimary: '#EB7410'}}}>
          <Navbar/>
          {children}
          </ClerkProvider>
        </body>
      </ClerkProvider>
    </html>
  );
}
