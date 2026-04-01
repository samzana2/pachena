import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pachena — Company Reviews for Africa",
  description:
    "Anonymous but verified employee reviews, salary data, and a public job board for African companies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
