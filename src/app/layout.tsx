import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import '@/app/globals.css';
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        
        {/* 2. Added the Toaster with Neo-Brutalist styling */}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              border: '2px solid #111827', // border-gray-900
              boxShadow: '4px 4px 0px 0px rgba(17,24,39,1)',
              borderRadius: '0.75rem', // rounded-xl
              fontWeight: 'bold',
              color: '#111827',
            },
          }} 
        />
      </body>
    </html>
  );
}