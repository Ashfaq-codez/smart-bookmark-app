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

  const displayName = email ? email.split('@')[0] : 'Profile'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
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
        className="w-full h-full flex items-center justify-center px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-mono font-bold text-xs text-gray-900 dark:text-gray-100 cursor-pointer select-none"
      >
        <span className="truncate max-w-[110px] md:max-w-[140px]">{displayName}</span>
        <span className="ml-1 text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-900 border-3 border-gray-900 dark:border-gray-700 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] rounded-xl z-50 overflow-hidden">
          <div className="p-3 border-b-2 border-gray-200 dark:border-gray-800">
            <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 uppercase">Signed in as</p>
            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{email || 'User'}</p>
          </div>

          <div className="p-2 border-b-2 border-gray-200 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" onClick={toggleDarkMode}>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Dark Mode</span>
            <button
              className={`w-9 h-5 rounded-full border-2 border-gray-900 dark:border-gray-300 transition-colors relative ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white border border-gray-900 dark:border-gray-700 rounded-full transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full p-3 text-left text-xs font-black uppercase tracking-wider text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}