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
  const initial = email ? email.charAt(0).toUpperCase() : 'U'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  return (
    <div className="relative w-full flex flex-col" ref={dropdownRef}>
      
      {/* ─── GLOSSY FLOATING PILL BUTTON ─── */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center gap-3 p-1.5 pr-4 bg-white/70 dark:bg-[#151c28]/80 backdrop-blur-xl hover:bg-white/90 dark:hover:bg-[#1a2332]/90 border border-white/80 dark:border-[#2a3f5a] rounded-full shadow-[0_4px_12px_rgba(44,64,84,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all cursor-pointer text-left group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#609ad3] to-[#3a75b0] dark:from-[#3a526b] dark:to-[#1a2536] flex items-center justify-center text-white font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.2)] text-sm border border-[#2f5b89] dark:border-[#0d1620] group-hover:scale-105 transition-transform">
          {initial}
        </div>
        <span className="text-sm font-bold text-[#2c4054] dark:text-gray-200 truncate flex-1">{displayName}</span>
        <span className="text-[#5e81a5] dark:text-[#4a6b8c] text-[10px] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] dark:drop-shadow-none">▼</span>
      </button>

      {/* ─── FROSTED GLASS DROPDOWN ─── */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-[240px] bg-white/95 dark:bg-[#080d14]/95 backdrop-blur-2xl border border-white dark:border-[#2a3f5a] shadow-[0_10px_40px_rgba(44,64,84,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] rounded-xl flex flex-col overflow-hidden z-50">
          
          <div className="bg-gradient-to-b from-[#eaf2f9]/90 to-[#d1e2f3]/90 dark:from-[#1a2536]/90 dark:to-[#111824]/90 border-b border-[#a9cbed] dark:border-[#2a3f5a] px-4 py-3 flex flex-col gap-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-none">
            <p className="text-[9px] font-mono text-[#4a6b8c] dark:text-[#5e81a5] tracking-widest uppercase drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] dark:drop-shadow-none">++ connection.id</p>
            <p className="text-xs font-semibold text-[#2c4054] dark:text-gray-200 truncate mt-0.5">{email || 'UNKNOWN'}</p>
          </div>

          <div className="px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-[#f2f7fc] dark:hover:bg-[#151c28] transition-colors border-b border-[#eaf2f9] dark:border-[#1a2536]" onClick={toggleDarkMode}>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#5e81a5] dark:text-[#8ea4bd]">UI.Theme</span>
            <button className={`w-10 h-5 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] transition-colors relative flex items-center p-0.5 border ${isDarkMode ? 'bg-[#315174] border-[#2a3f5a]' : 'bg-[#e1eef9] border-[#a9cbed]'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <button onClick={handleSignOut} className="w-full px-4 py-4 text-left text-[10px] font-mono uppercase tracking-widest text-[#c53030] dark:text-[#f87171] hover:bg-gradient-to-b hover:from-[#fdf2f3] hover:to-[#fadadd] dark:hover:from-[#3b1515] dark:hover:to-[#2a0e0e] transition-colors cursor-pointer flex items-center justify-between group">
            <span>Terminate Session</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">⏏</span>
          </button>
        </div>
      )}
    </div>
  )
}