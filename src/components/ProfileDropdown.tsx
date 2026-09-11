'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from '@/context/ThemeContext'

interface ProfileDropdownProps {
  email: string;
}

export default function ProfileDropdown({ email }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { isDarkMode, toggleDarkMode } = useTheme()

  const displayName = email ? email.split('@')[0] : 'PROFILE'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="relative w-full h-full flex items-stretch" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full flex items-center justify-between px-4 py-2 hover:bg-yellow-400 dark:hover:bg-cyan-700 transition-colors font-black uppercase text-sm text-black dark:text-white cursor-pointer select-none border-4 border-transparent hover:border-black dark:hover:border-white"
      >
        <span className="truncate max-w-[120px]">{displayName}</span>
        <span className="ml-2 text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 left-0 top-full mt-2 bg-white dark:bg-[#1a1a1a] border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] z-50 overflow-hidden">
          <div className="p-4 border-b-4 border-black dark:border-white bg-pink-300 dark:bg-pink-800">
            <p className="text-[10px] font-black text-black uppercase">SIGNED IN AS</p>
            <p className="text-sm font-black text-black truncate">{email || 'USER'}</p>
          </div>

          <div className="p-4 border-b-4 border-black dark:border-white flex items-center justify-between cursor-pointer hover:bg-yellow-200 dark:hover:bg-cyan-900 transition-colors" onClick={toggleDarkMode}>
            <span className="text-xs font-black uppercase text-black dark:text-white">Dark Mode</span>
            <button
              className={`w-10 h-5 border-4 border-black dark:border-white transition-colors relative ${isDarkMode ? 'bg-black' : 'bg-white'}`}
            >
              <div className={`absolute top-0 w-3 h-3 bg-white dark:bg-black border-r-4 border-black dark:border-white transition-transform ${isDarkMode ? 'translate-x-[16px] border-l-4 border-r-0' : 'translate-x-0'}`} />
            </button>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full p-4 text-center text-sm font-black uppercase text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-black dark:hover:bg-red-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}