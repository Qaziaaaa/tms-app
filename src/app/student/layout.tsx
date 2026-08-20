import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Portal - TMS",
};

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
