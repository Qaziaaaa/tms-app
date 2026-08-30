import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { APP_FULL_NAME } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_FULL_NAME,
  description: "Manage attendance, assignments, marks, and reports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
