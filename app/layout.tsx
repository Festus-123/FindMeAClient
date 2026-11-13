import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Header from "./_components/Header";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Find Me A Client",
  description: "Post a job, role or service for 24 hours and meet the people who want it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Applies the saved (or system) theme before first paint so there is no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("fmc-theme");if(!t&&matchMedia("(prefers-color-scheme: dark)").matches)t="dark";document.documentElement.dataset.theme=t==="dark"?"dark":"light"}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-8">{children}</main>
      </body>
    </html>
  );
}
