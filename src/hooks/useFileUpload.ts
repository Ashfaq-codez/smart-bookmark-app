import { useState, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { requestUploadBookmark } from '@/lib/bookmarkRequests'
import { createClient } from '@/utils/supabase/client'

// Picking a file: upload it to storage, then ask the server to create its bookmark (the server checks the save limit).
export function useFileUpload() {
  const supabase = createClient()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const fileExt = file.name.split('.').pop()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Unauthenticated")

      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('attachments').upload(fileName, file)
      if (uploadError) throw uploadError

      // The server checks the save limit and creates the bookmark. If it says no, the file is not kept.
      const result = await requestUploadBookmark({ path: fileName, type: file.type, title: file.name })
      if (result !== 'saved') {
        await supabase.storage.from('attachments').remove([fileName])
        toast.error(result === 'limited'
          ? 'You are saving very fast. Please wait a minute, then try again.'
          : 'Upload failed.')
        return
      }
      toast.success('Document archived successfully')
    } catch (err) {
      toast.error('Upload failed.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return { isUploading, fileInputRef, handleFileUpload }
}
