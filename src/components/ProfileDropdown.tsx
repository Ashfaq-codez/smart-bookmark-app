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
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-3 bg-transparent hover:bg-[#00111a] rounded transition-colors font-mono text-sm text-gray-300 cursor-pointer border border-transparent hover:border-cyan-900">
        <span className="truncate max-w-[150px]">{displayName}</span>
        <span className="text-[10px] text-cyan-600">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 left-0 top-full mt-2 bg-black border border-cyan-500/50 rounded shadow-[0_4px_20px_rgba(6,182,212,0.2)] z-50 overflow-hidden">
          <div className="p-4 border-b border-cyan-900/50 bg-[#000a10]">
            <p className="text-[9px] font-mono text-cyan-700 uppercase tracking-widest">CONNECTION_ID</p>
            <p className="text-xs font-mono text-cyan-300 truncate mt-1">{email || 'UNKNOWN'}</p>
          </div>

          <div className="p-4 border-b border-cyan-900/50 flex items-center justify-between cursor-pointer hover:bg-[#00111a] transition-colors" onClick={toggleDarkMode}>
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">UI_THEME</span>
            <button className={`w-9 h-4 rounded border transition-colors relative flex items-center p-0.5 ${isDarkMode ? 'bg-cyan-900 border-cyan-500' : 'bg-gray-800 border-gray-600'}`}>
              <div className={`w-2.5 h-2.5 bg-cyan-400 rounded transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <button onClick={handleSignOut} className="w-full p-4 text-center text-[10px] font-mono uppercase tracking-widest text-red-500 hover:bg-red-900/20 transition-colors cursor-pointer">
            TERMINATE_SESSION
          </button>
        </div>
      )}
    </div>
  )
}