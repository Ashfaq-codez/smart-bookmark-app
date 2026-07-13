"use client";

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { createClient } from '@/utils/supabase/client';

// Preloaded background options. Ensure these files exist in your /public folder!
const BACKGROUND_OPTIONS = [
  { 
    id: 'solid-yellow', 
    name: 'Pure Yellow', 
    url: '', // Empty URL means it falls back to the hex color
    hexColor: '#a0beff' 
  },
  { 
    id: 'retro-grid', 
    name: 'Retro Grid', 
    url: '/backgrounds/3.gif', // Your existing GIF
    hexColor: '#bfdbfe' 
  },
  { 
    id: 'animated-waves', 
    name: 'Animated Waves', 
    url: '/backgrounds/background.jpg', 
    hexColor: '#e5e7eb' 
  }
];

export default function ProfileDropdown({ email }: { email: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode, toggleDarkMode, bgTheme, setBgTheme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 font-bold text-black bg-white border-2 rounded-[2rem] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all"
      >
        <span>{email.split('@')[0]}</span> {/* Displays just the name part of the email */}
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* The Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 w-64 mt-4 bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col p-4 gap-4">
          
          {/* User Info */}
          <div className="pb-2 border-b-2 border-black">
            <p className="text-sm font-bold text-gray-500 uppercase">Signed in as</p>
            <p className="text-black truncate font-mono">{email}</p>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-black">Dark Mode</span>
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full border-2 border-black transition-colors relative ${isDarkMode ? 'bg-black' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white border-2 border-black rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Background Selector */}
          <div className="flex flex-col gap-3">
            <span className="font-bold text-gray-900 dark:text-white text-sm">Background</span>
            
            {/* FIX: Added 'p-1' to the container so the hover shadows don't get clipped by overflow */}
            <div className="flex gap-3 overflow-x-auto pb-3 p-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:dark:bg-gray-700 [&::-webkit-scrollbar-thumb]:bg-gray-900 [&::-webkit-scrollbar-thumb]:dark:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full">
              {BACKGROUND_OPTIONS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setBgTheme({ url: bg.url, hex: bg.hexColor })}
                  title={bg.name}
                  className={`
                    relative shrink-0 w-16 h-12 rounded-lg border-2 border-gray-900 dark:border-gray-500 
                    overflow-hidden transition-all bg-cover bg-center
                    ${bgTheme.url === bg.url && bgTheme.hex === bg.hexColor 
                      ? 'scale-110 shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)] z-10' 
                      : 'hover:scale-105 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_rgba(255,255,255,0.2)] z-0'}
                  `}
                  style={{ 
                    backgroundColor: bg.hexColor,
                    backgroundImage: bg.url ? `url('${bg.url}')` : 'none'
                  }}
                >
                  {/* FIX: Centered the checkmark perfectly with flexbox */}
                  {bgTheme.url === bg.url && bgTheme.hex === bg.hexColor && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 mt-2 font-bold text-white bg-red-500 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all"
          >
            SIGN OUT
          </button>
        </div>
      )}
    </div>
  );
}