'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'

function ShareHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleShare = async () => {
      const sharedUrl = searchParams.get('url') || searchParams.get('text')
      const title = searchParams.get('title')

      // Redirect to the dashboard if no URL is found
      if (!sharedUrl) return router.push('/dashboard')

      try {
        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: sharedUrl, title })
        })
        
        if (res.ok || res.status === 409) toast.success('Captured to Space')
        else toast.error('Failed to capture')
      } catch {
        toast.error('Network error')
      } finally {
        // Successfully land the user back inside the app
        router.push('/dashboard')
      }
    }
    handleShare()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8] dark:bg-[#1A202C]">
      <div className="w-8 h-8 border-4 border-[#2B6CB0] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function ShareCatcher() {
  return <Suspense><ShareHandler /></Suspense>
}