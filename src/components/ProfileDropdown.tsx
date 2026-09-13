'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from '@/context/ThemeContext'

interface ProfileDropdownProps { email: string; }

export default function ProfileDropdown({ email }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { isDarkMode, toggleDarkMode } = useTheme()

  const displayName = email ? email.split('@')[0] : 'Author'

  useEffect(() => {
    const handleScroll = () => {
      // Assuming your state variable is called 'isOpen' or 'isMenuOpen'
      setIsOpen(false); 
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  return (
    <div className="relative flex flex-col font-sans" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#2B6CB0] dark:text-[#90CDF4] hover:opacity-70 transition-opacity cursor-pointer font-medium"
      >
        <span>{displayName}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-4 w-64 bg-white dark:bg-[#2D3748] border border-[#E5E0D8] dark:border-[#4A5568] shadow-xl flex flex-col z-50 transition-colors duration-500 rounded-sm">
          <div className="p-5 border-b border-[#E5E0D8] dark:border-[#4A5568]">
            <p className="text-[10px] uppercase tracking-widest text-[#718096] dark:text-[#A0AEC0] mb-1">Account</p>
            <p className="text-sm font-serif truncate text-[#2D3748] dark:text-[#E2E8F0]">{email}</p>
          </div>

          <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#FDFCF8] dark:hover:bg-[#1A202C] transition-colors border-b border-[#E5E0D8] dark:border-[#4A5568]" onClick={toggleDarkMode}>
            <span className="text-[10px] uppercase tracking-widest text-[#2D3748] dark:text-[#E2E8F0]">Theme Edition</span>
            <div className={`w-10 h-5 border border-[#CBD5E0] dark:border-[#718096] rounded-full flex items-center p-0.5 transition-colors duration-500 ${isDarkMode ? 'bg-[#2A4365]' : 'bg-[#EBF8FF]'}`}>
              <div className={`w-3.5 h-3.5 rounded-full transition-transform duration-500 ${isDarkMode ? 'bg-[#90CDF4] translate-x-5' : 'bg-[#2B6CB0] translate-x-0'}`} />
            </div>
          </div>

          <button onClick={handleSignOut} className="w-full p-5 text-left text-[10px] uppercase tracking-widest text-[#C53030] dark:text-[#FC8181] hover:bg-[#FFF5F5] dark:hover:bg-[#742A2A]/20 transition-colors cursor-pointer">
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}