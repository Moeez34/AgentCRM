import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, Lobster } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const lobster = Lobster({
  weight: "400",
  variable: "--font-lobster",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentCRM | AI-Native SaaS CRM",
  description: "Autonomous lead generation, scoring, and RAG workflow automation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${plusJakartaSans.variable} ${lobster.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-neutral-100">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
