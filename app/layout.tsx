import type React from "react";
import "@/app/globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "لوحة البيانات",
  description: "إدارة وعرض جميع البيانات والإشعارات",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
