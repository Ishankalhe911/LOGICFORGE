import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LogicForge",
  description: "AI Cognitive Remediation Engine for Engineers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}