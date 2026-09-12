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

  const displayName = email ? email.split('@')[0] : 'USER'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  return (
    <div className="relative w-full flex flex-col" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-3 bg-white dark:bg-black border-4 border-black dark:border-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff] transition-all cursor-pointer rounded-none text-left active:shadow-none active:translate-x-[6px] active:translate-y-[6px]"
      >
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest">ID:</span>
          <span className="text-sm font-black text-black dark:text-white truncate uppercase">{displayName}</span>
        </div>
        <div className="w-8 h-8 bg-yellow-400 dark:bg-cyan-400 border-4 border-black dark:border-white flex items-center justify-center shadow-[inset_2px_2px_0_0_rgba(255,255,255,0.5)]">
          <span className="text-black text-xs font-black">▼</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-4 w-[260px] bg-white dark:bg-black border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] rounded-none flex flex-col overflow-hidden z-50">
          <div className="bg-yellow-400 dark:bg-cyan-400 border-b-4 border-black dark:border-white px-4 py-3 flex flex-col gap-1">
            <p className="text-[10px] font-black text-black tracking-widest uppercase">SYS.USER // EMAIL</p>
            <p className="text-sm font-black text-black truncate">{email || 'UNKNOWN'}</p>
          </div>

          <div className="px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors border-b-4 border-black dark:border-white group" onClick={toggleDarkMode}>
            <span className="text-[11px] font-black uppercase tracking-widest text-black dark:text-white group-hover:text-white dark:group-hover:text-black">INVERT THEME</span>
            <button className={`w-10 h-6 rounded-none transition-colors relative flex items-center p-0.5 border-4 ${isDarkMode ? 'bg-cyan-400 border-white' : 'bg-yellow-400 border-black'}`}>
              <div className={`w-3 h-3 bg-black dark:bg-white rounded-none transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <button onClick={handleSignOut} className="w-full px-4 py-4 text-left text-[11px] font-black uppercase tracking-widest bg-red-500 text-black hover:bg-black hover:text-red-500 dark:hover:text-red-500 transition-colors cursor-pointer flex items-center justify-between">
            <span>TERMINATE</span>
            <span className="font-black">X</span>
          </button>
        </div>
      )}
    </div>
  )
}