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
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-b from-white/60 to-[#eef4f9]/60 dark:from-[#2a3f5a]/40 dark:to-[#1a2332]/40 hover:from-white hover:to-[#e1eef9] border border-[#a9cbed] dark:border-[#3a526b] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] rounded transition-colors font-sans font-medium text-xs text-[#2c4054] dark:text-gray-200 cursor-pointer">
        <span className="truncate max-w-[150px]">{displayName}</span>
        <span className="text-[9px] text-[#5e81a5]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full min-w-[200px] bg-white/95 dark:bg-[#151c28]/95 backdrop-blur-xl border border-white dark:border-[#2a3f5a] shadow-[0_8px_20px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] rounded flex flex-col overflow-hidden z-50">
          <div className="bg-gradient-to-b from-[#eaf2f9] to-[#d1e2f3] dark:from-[#213045] dark:to-[#1a2332] border-b border-[#a9cbed] dark:border-[#2a3f5a] px-4 py-2 flex flex-col gap-0.5">
            <p className="text-[9px] font-mono text-[#4a6b8c] tracking-widest uppercase">++ auth.id</p>
            <p className="text-xs font-semibold text-[#2c4054] dark:text-gray-200 truncate">{email || 'UNKNOWN'}</p>
          </div>

          <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#f2f7fc] dark:hover:bg-[#1a2332] transition-colors border-b border-[#eaf2f9] dark:border-[#2a3f5a]" onClick={toggleDarkMode}>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#5e81a5]">Theme</span>
            <button className={`w-8 h-4 rounded-full transition-colors relative flex items-center p-0.5 border ${isDarkMode ? 'bg-[#315174] border-[#2a3f5a]' : 'bg-[#e1eef9] border-[#a9cbed]'}`}>
              <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </button>
          </div>

          <button onClick={handleSignOut} className="w-full px-4 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-[#c53030] hover:bg-[#fdf2f3] dark:hover:bg-red-900/10 transition-colors cursor-pointer">
            Terminate Session
          </button>
        </div>
      )}
    </div>
  )
}