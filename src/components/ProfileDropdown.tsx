'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface ProfileDropdownProps { email: string; }

// Utility to generate a SHA-256 hash using the Web Crypto API
async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function ProfileDropdown({ email }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const firstLetter = email ? email.charAt(0).toUpperCase() : 'A'

  useEffect(() => {
    const handleScroll = () => {
      setIsOpen(false); 
    };
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
    <div className="relative flex flex-col font-sans" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1B221B] dark:bg-[#2D3748] text-white text-sm font-serif hover:opacity-80 transition-opacity"
      >
        {firstLetter}
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-4 w-64 bg-white dark:bg-[#2D3748] border border-[#E3DDD2] dark:border-[#4A5568] shadow-2xl flex flex-col z-50 transition-colors duration-500 rounded-xl overflow-hidden">
          
          <div className="p-5 border-b border-[#E3DDD2] dark:border-[#4A5568]">
            <p className="text-[10px] uppercase tracking-widest text-[#718096] dark:text-[#A0AEC0] mb-1">Account</p>
            <p className="text-sm font-serif truncate text-[#2D3748] dark:text-[#E2E8F0]">{email}</p>
          </div>

          <div className="p-5 border-b border-[#E3DDD2] dark:border-[#4A5568]">
            <p className="text-[10px] uppercase tracking-widest text-[#718096] dark:text-[#A0AEC0] mb-3">Integrations</p>
            {!apiKey ? (
              <button 
                onClick={generateApiKey}
                disabled={isGenerating}
                className="w-full py-2 px-3 border border-[#E3DDD2] dark:border-[#4A5568] bg-[#FAF9F5] dark:bg-[#1A202C] text-[#2D3748] dark:text-[#E2E8F0] text-[10px] uppercase tracking-widest hover:bg-[#E8E1D7] dark:hover:bg-[#151815] transition-colors cursor-pointer rounded-lg"
              >
                {isGenerating ? 'Generating...' : 'New iOS Shortcut Key'}
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="p-3 bg-[#FAF9F5] dark:bg-[#1A202C] border border-[#E3DDD2] dark:border-[#4A5568] text-[11px] font-mono break-all text-[#2D3748] dark:text-[#E2E8F0] rounded-lg">
                  {apiKey}
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="w-full py-2 px-3 bg-[#1B221B] dark:bg-[#E2E8F0] text-white dark:text-[#1A202C] text-[10px] uppercase tracking-widest hover:opacity-80 transition-opacity cursor-pointer rounded-lg"
                >
                  {hasCopied ? 'Copied' : 'Copy Secret Key'}
                </button>
              </div>
            )}
          </div>

          <button onClick={handleSignOut} className="w-full p-5 text-left text-[10px] uppercase tracking-widest text-[#C53030] dark:text-[#FC8181] hover:bg-[#FFF5F5] dark:hover:bg-[#742A2A]/20 transition-colors cursor-pointer">
            Sign Out
          </button>
          
        </div>
      )}
    </div>
  )
}