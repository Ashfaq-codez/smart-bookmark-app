"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeState = { url: string; hex: string };

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  bgTheme: ThemeState;
  setBgTheme: (theme: ThemeState) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Default to a solid Neo-Brutalist yellow if no image is present
  const [bgTheme, setBgTheme] = useState<ThemeState>({ url: '', hex: '#fef08a' }); 

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedUrl = localStorage.getItem('bgUrl');
    const savedHex = localStorage.getItem('bgHex');
    
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    if (savedHex) {
      setBgTheme({ url: savedUrl || '', hex: savedHex });
    }
  }, []);

  const toggleDarkMode = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSetBgTheme = (theme: ThemeState) => {
    setBgTheme(theme);
    localStorage.setItem('bgUrl', theme.url);
    localStorage.setItem('bgHex', theme.hex);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, bgTheme, setBgTheme: handleSetBgTheme }}>
      <div
        // ADDED: dark:bg-blend-multiply to smoothly dim the image in dark mode
        className="min-h-screen w-full transition-colors duration-300 bg-cover bg-center bg-fixed dark:bg-gray-900 dark:bg-blend-multiply"
        style={{ 
          backgroundColor: isDarkMode ? undefined : bgTheme.hex,
          // FIX: Removed the '!isDarkMode' block so the image renders in both modes
          backgroundImage: bgTheme.url ? `url('${bgTheme.url}')` : 'none' 
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};