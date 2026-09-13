import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-ignore: side-effect import for global CSS
import "@/app/globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = { 
  title: "Smart Bookmark App", 
  description: "A smart bookmark application for organizing and managing your bookmarks",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { 
  return ( 
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js') }`,
          }}
        />
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              border: '4px solid #111827',
              borderRadius: '1rem',
              background: '#ffffff',
              color: '#111827',
              fontWeight: '900',
              boxShadow: '6px 6px 0px 0px rgba(17,24,39,1)',
            },
            error: {
              style: {
                background: '#fca5a5',
                color: '#7f1d1d',
              },
              iconTheme: {
                primary: '#7f1d1d',
                secondary: '#fca5a5',
              },
            },
            success: {
              style: {
                background: '#86efac',
                color: '#14532d',
              },
              iconTheme: {
                primary: '#14532d',
                secondary: '#86efac',
              },
            },
          }}
        />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}