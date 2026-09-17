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
    const handleScroll = () => { setIsOpen(false); };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
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
    <div 
      className="relative flex flex-col font-sans group z-50" 
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#E8EFE5] dark:bg-[#202820] text-[#4D6A51] dark:text-[#8FAA91] text-sm font-serif font-medium transition-colors hover:scale-105"
      >
        {firstLetter}
      </button>

      {/* Hover Dropdown popping to the right of the button */}
      {isOpen && (
        <div className="absolute left-full bottom-0 ml-3 w-64 bg-[#FBF9F4] dark:bg-[#151815] border border-[#D7D0C4] dark:border-[#343A34] shadow-[0_20px_60px_rgba(0,0,0,0.08)] flex flex-col z-50 transition-colors duration-500 rounded-2xl overflow-hidden">
          
          <div className="p-5 border-b border-[#D7D0C4] dark:border-[#292E29]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#737B73] dark:text-[#8F998F] font-bold mb-1">Account</p>
            <p className="text-sm font-serif truncate text-[#171A17] dark:text-[#F3F0E9]">{email}</p>
          </div>

          <div className="p-5 border-b border-[#D7D0C4] dark:border-[#292E29]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#737B73] dark:text-[#8F998F] font-bold mb-3">Integrations</p>
            {!apiKey ? (
              <button 
                onClick={generateApiKey}
                disabled={isGenerating}
                className="w-full py-2 px-3 border border-[#D7D0C4] dark:border-[#343A34] bg-white dark:bg-[#191D19] text-[#171A17] dark:text-[#F3F0E9] text-[10px] uppercase tracking-widest hover:bg-[#F5F1E8] dark:hover:bg-[#202820] transition-colors cursor-pointer rounded-lg"
              >
                {isGenerating ? 'Generating...' : 'New iOS Shortcut Key'}
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="p-3 bg-[#F5F1E8] dark:bg-[#191D19] border border-[#D7D0C4] dark:border-[#343A34] text-[11px] font-mono break-all text-[#171A17] dark:text-[#F3F0E9] rounded-lg">
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

          <button onClick={handleSignOut} className="w-full p-5 text-left text-[10px] uppercase tracking-widest text-[#E53E3E] hover:bg-[#F5F1E8] dark:hover:bg-[#202820] transition-colors cursor-pointer font-bold">
            Sign Out
          </button>
          
        </div>
      )}
    </div>
  )
}