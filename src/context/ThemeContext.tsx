"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  bgImage: string;
  setBgImage: (url: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [bgImage, setBgImage] = useState('/background.jpg'); // Your default background

  // Load saved preferences on initial mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedBg = localStorage.getItem('bgImage');
    
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    if (savedBg) {
      setBgImage(savedBg);
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

  const handleSetBgImage = (url: string) => {
    setBgImage(url);
    localStorage.setItem('bgImage', url);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, bgImage, setBgImage }}>
      {/* We apply the background image here so it wraps the whole app effortlessly */}
      <div
        className="min-h-screen w-full transition-colors duration-300 bg-cover bg-center bg-fixed dark:bg-gray-900"
        style={{ backgroundImage: `url('${bgImage}')` }}
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