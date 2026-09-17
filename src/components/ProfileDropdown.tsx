'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface ProfileDropdownProps { email: string; isCollapsed?: boolean; }

async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function ProfileDropdown({ email, isCollapsed }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const firstLetter = email ? email.charAt(0).toUpperCase() : 'A'

  useEffect(() => {
    const handleScroll = () => { setIsOpen(false); };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { 
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false) 
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => { 
    await supabase.auth.signOut(); 
    window.location.href = '/' 
  }

  const generateApiKey = async () => {
    setIsGenerating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('api_keys').delete().eq('user_id', user.id)

      const newToken = crypto.randomUUID().replace(/-/g, '')
      const hashedToken = await sha256(newToken)
      
      const { error } = await supabase
        .from('api_keys')
        .insert([{ user_id: user.id, token: hashedToken }])

      if (error) throw error
      
      setApiKey(newToken)
      setHasCopied(false)
    } catch (error) {
      console.error('Failed to generate API key:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    if (!apiKey) return
    await navigator.clipboard.writeText(apiKey)
    setHasCopied(true)
    setTimeout(() => setHasCopied(false), 2000)
  }

  useEffect(() => {
    if (!isOpen) {
      setApiKey(null)
      setHasCopied(false)
    }
  }, [isOpen])

  return (
    <div className="relative flex flex-col font-sans z-50" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E8EFE5] dark:bg-[#202820] text-[#4D6A51] dark:text-[#8FAA91] text-sm font-serif font-medium transition-colors hover:bg-[#DDE6DB] dark:hover:bg-[#2A342A]"
      >
        {firstLetter}
      </button>

      {isOpen && (
        <div className={`absolute ${isCollapsed ? 'left-full bottom-0 ml-4' : 'left-0 bottom-full mb-4'} w-64 bg-white dark:bg-[#1A1D1A] border border-black/[0.04] dark:border-white/[0.04] shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex flex-col z-50 transition-colors duration-500 rounded-2xl overflow-hidden`}>
          
          <div className="p-5 border-b border-black/[0.04] dark:border-white/[0.04]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#737B73] dark:text-[#8F998F] font-bold mb-1">Account</p>
            <p className="text-sm font-serif truncate text-[#171A17] dark:text-[#F3F0E9]">{email}</p>
          </div>

          <div className="p-5 border-b border-black/[0.04] dark:border-white/[0.04]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#737B73] dark:text-[#8F998F] font-bold mb-3">Integrations</p>
            {!apiKey ? (
              <button 
                onClick={generateApiKey}
                disabled={isGenerating}
                className="w-full py-2 px-3 border border-black/[0.04] dark:border-white/[0.04] bg-[#FBF9F4] dark:bg-[#151815] text-[#171A17] dark:text-[#F3F0E9] text-[10px] uppercase tracking-widest hover:bg-[#F5F1E8] dark:hover:bg-[#202520] transition-colors cursor-pointer rounded-lg"
              >
                {isGenerating ? 'Generating...' : 'New iOS Shortcut Key'}
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="p-3 bg-[#FBF9F4] dark:bg-[#151815] border border-black/[0.04] dark:border-white/[0.04] text-[11px] font-mono break-all text-[#171A17] dark:text-[#F3F0E9] rounded-lg">
                  {apiKey}
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="w-full py-2 px-3 bg-[#4D6A51] dark:bg-[#E2E8F0] text-white dark:text-[#1A202C] text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer rounded-lg"
                >
                  {hasCopied ? 'Copied' : 'Copy Secret Key'}
                </button>
              </div>
            )}
          </div>

          <button onClick={handleSignOut} className="w-full p-5 text-left text-[10px] uppercase tracking-widest text-[#E53E3E] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer font-bold">
            Sign Out
          </button>
          
        </div>
      )}
    </div>
  )
}