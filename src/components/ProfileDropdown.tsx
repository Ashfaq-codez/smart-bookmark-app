"use client";

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { createClient } from '@/utils/supabase/client';

// Preloaded background options. Ensure these files exist in your /public folder!
const BACKGROUND_OPTIONS = [
  { name: 'Default', url: '/background.jpg', hexColor: '#fef08a' }, // yellow-200 equivalent
  { name: 'Grid', url: '/grid-bg.png', hexColor: '#bfdbfe' },      // blue-200 equivalent
  { name: 'Dots', url: '/dots-bg.png', hexColor: '#fecaca' }       // red-200 equivalent
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
        className="flex items-center gap-2 px-4 py-2 font-bold text-black bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all"
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
          <div className="flex flex-col gap-2">
            <span className="font-bold text-black">Backgrounds</span>
            <div className="flex gap-2">
              {BACKGROUND_OPTIONS.map((bg) => (
                <button
                  key={bg.name}
                  onClick={() => setBgTheme({ url: bg.url, hex: bg.hexColor })}
                  title={bg.name}
                  className={`w-8 h-8 rounded-full border-2 border-gray-900 transition-transform ${bgTheme.hex === bg.hexColor ? 'scale-125 shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'hover:scale-110'}`}
                  style={{ backgroundColor: bg.hexColor }}
                />
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