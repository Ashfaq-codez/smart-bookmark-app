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
    <div className="relative w-full flex flex-col font-sans" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#0a0a0a] border-b border-black dark:border-white transition-colors cursor-pointer text-left hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black group"
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 group-hover:opacity-100">ID.</span>
          <span className="text-sm font-black uppercase tracking-tight truncate">{displayName}</span>
        </div>
        <span className="text-xl font-bold leading-none">+</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full w-full bg-white dark:bg-[#0a0a0a] border-b border-x border-black dark:border-white flex flex-col z-50">
          <div className="p-4 border-b border-black dark:border-white flex flex-col gap-1">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-50">Email</p>
            <p className="text-xs font-semibold truncate">{email || 'UNKNOWN'}</p>
          </div>

          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors border-b border-black dark:border-white" onClick={toggleDarkMode}>
            <span className="text-[10px] font-bold uppercase tracking-widest">Invert Theme</span>
            <div className={`w-8 h-4 border border-current flex items-center p-0.5 ${isDarkMode ? 'justify-end bg-white' : 'justify-start bg-black'}`}>
              <div className={`w-2.5 h-2.5 ${isDarkMode ? 'bg-black' : 'bg-white'}`} />
            </div>
          </div>

          <button onClick={handleSignOut} className="w-full p-4 text-left text-[10px] font-bold uppercase tracking-widest text-[#ff0000] hover:bg-[#ff0000] hover:text-white transition-colors cursor-pointer flex items-center justify-between">
            <span>Terminate</span>
          </button>
        </div>
      )}
    </div>
  )
}