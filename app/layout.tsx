import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bloby",
  description: "Emotional Support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta property="og:title" content="Bloby" />
        <meta property="og:description" content="Say hello Bloby" />
        <meta
          property="og:image"
          content="https://github-shaun-md.s3.us-west-2.amazonaws.com/bannerBloby.png"
        />
        <meta property="og:url" content="https://support-blob.vercel.app/" />
        <meta property="og:type" content="website" />

        <meta name="theme-color" content="#7EF0C7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
