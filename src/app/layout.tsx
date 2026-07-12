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
            // Default styling for all standard toasts
            style: {
              border: '4px solid #111827',
              borderRadius: '1rem',
              background: '#ffffff',
              color: '#111827',
              fontWeight: '900',
              boxShadow: '6px 6px 0px 0px rgba(17,24,39,1)',
            },
            // Specific styling for toast.error()
            error: {
              style: {
                background: '#fca5a5', // Punchy red (red-300)
                color: '#7f1d1d', // Dark red text
              },
              iconTheme: {
                primary: '#7f1d1d',
                secondary: '#fca5a5',
              },
            },
            // Specific styling for toast.success() if you use it later
            success: {
              style: {
                background: '#86efac', // Punchy green (green-300)
                color: '#14532d',
              },
              iconTheme: {
                primary: '#14532d',
                secondary: '#86efac',
              },
            },
          }}
        />
      </body>
    </html>
  )
}