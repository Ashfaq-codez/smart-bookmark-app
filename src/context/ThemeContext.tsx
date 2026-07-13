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
        className="min-h-screen w-full transition-colors duration-300 bg-cover bg-center bg-fixed dark:bg-gray-900"
        style={{ 
          // Apply the solid color. If dark mode is active, let the Tailwind dark:bg-gray-900 class take over.
          backgroundColor: isDarkMode ? undefined : bgTheme.hex,
          // Apply the image on top if one exists and we aren't in dark mode
          backgroundImage: (bgTheme.url && !isDarkMode) ? `url('${bgTheme.url}')` : 'none' 
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