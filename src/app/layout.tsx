import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-ignore: side-effect import for global CSS
import './globals.css';
import { Toaster } from "react-hot-toast"; // <-- 1. Imported Toaster

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Bookmark App",
  description: "A smart bookmark application for organizing and managing your bookmarks",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Place this at the bottom of the body */}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
              fontWeight: 'bold',
            },
          }} 
        />
      </body>
    </html>
  )
}