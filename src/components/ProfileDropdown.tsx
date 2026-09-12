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
    const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  return (
    <div className="relative flex flex-col font-sans" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-2 text-xs uppercase tracking-widest hover:opacity-50 transition-opacity cursor-pointer text-black dark:text-white"
      >
        <span>{displayName}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-4 w-64 bg-white dark:bg-[#050505] border border-gray-300 dark:border-gray-800 shadow-xl flex flex-col z-50 transition-colors duration-500">
          <div className="p-5 border-b border-gray-200 dark:border-gray-800">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Account</p>
            <p className="text-sm font-serif truncate text-black dark:text-white">{email}</p>
          </div>

          <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#111] transition-colors border-b border-gray-200 dark:border-gray-800" onClick={toggleDarkMode}>
            <span className="text-[10px] uppercase tracking-widest text-black dark:text-white">Theme Edition</span>
            <div className={`w-10 h-5 border border-gray-300 dark:border-gray-700 rounded-full flex items-center p-0.5 transition-colors duration-500 ${isDarkMode ? 'bg-[#111]' : 'bg-gray-50'}`}>
              <div className={`w-3.5 h-3.5 rounded-full transition-transform duration-500 ${isDarkMode ? 'bg-white translate-x-5' : 'bg-black translate-x-0'}`} />
            </div>
          </div>

          <button onClick={handleSignOut} className="w-full p-5 text-left text-[10px] uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer">
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}