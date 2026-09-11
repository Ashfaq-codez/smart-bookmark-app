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

  const displayName = email ? email.split('@')[0] : 'PROFILE'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  return (
    <div className="relative w-full flex flex-col" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-[#111] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-3xl transition-colors font-black uppercase tracking-widest text-sm text-gray-900 dark:text-white cursor-pointer select-none">
        <span className="truncate max-w-[140px]">{displayName}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 left-0 top-full mt-4 bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-50 overflow-hidden border border-gray-100 dark:border-gray-800">
          <div className="p-6 bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">ACCOUNT</p>
            <p className="text-sm font-bold truncate mt-1">{email || 'USER'}</p>
          </div>

          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#222] transition-colors" onClick={toggleDarkMode}>
            <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Dark Mode</span>
            <button className={`w-12 h-7 rounded-full transition-colors relative flex items-center p-1 ${isDarkMode ? 'bg-fuchsia-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <button onClick={handleSignOut} className="w-full p-6 text-center text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer">
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}