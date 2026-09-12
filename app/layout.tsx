import type { Metadata, Viewport } from "next";
import RegisterSW from "./register-sw";
import UserBar from "./user-bar";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gym CRM",
  description: "CRM для тренажёрного зала: клиенты, абонементы, чек-ины",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gym CRM",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="ru">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <RegisterSW />
        {user && <UserBar email={user.email} role={user.role} />}
        {children}
      </body>
    </html>
  );
}
