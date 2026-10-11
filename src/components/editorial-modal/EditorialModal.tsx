'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark } from '@/types'
import { CloseIcon } from '../BookmarkIcons'
import PreviewPane from './PreviewPane'
import MetaPane from './MetaPane'
import DeleteConfirm from './DeleteConfirm'
import { useModalEdits } from './useModalEdits'
import { useModalKeys, useSwipeDown } from './useModalKeys'

interface EditorialModalProps {
  bookmark: Bookmark;
  isVisible: boolean;
  displayType: string;
  previewImageUrl?: string;
  folderHierarchy?: Record<string, string[]>;
  onClose: () => void;
  onSave: (id: number, updates: Partial<Bookmark>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isPinned?: boolean;
  onTogglePin?: (id: number, pin: boolean) => void;
  onFullscreenImage: (url: string) => void;
  getDomain: (url: string) => string;
  onCyclePreview?: () => void;
}

export default function EditorialModal({ 
  bookmark, isVisible, displayType, previewImageUrl, folderHierarchy, 
  onClose, onSave, onDelete, isPinned, onTogglePin, onFullscreenImage, getDomain, onCyclePreview 
}: EditorialModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const edits = useModalEdits(bookmark, onSave)
  const { handleAutoSave } = edits

  useModalKeys({ showDeleteConfirm, setShowDeleteConfirm, handleAutoSave, onClose, onDelete, bookmarkId: bookmark.id })
  const swipe = useSwipeDown(() => { handleAutoSave(); onClose() })

  return createPortal(
    <div className={`fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-6 lg:p-10 bg-[#FBF9F4]/80 dark:bg-[#080A08]/90 backdrop-blur-md transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} onMouseDown={() => { handleAutoSave(); onClose(); }}>
      
      <div 
        className={`relative w-full h-[100dvh] md:h-[90vh] flex flex-col md:flex-row bg-[#FAF9F5] dark:bg-[#0F120F] border-0 md:border border-black/[0.04] dark:border-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:shadow-2xl rounded-none md:rounded-3xl overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-full md:translate-y-0 md:scale-95'}`} 
        onMouseDown={(e) => e.stopPropagation()}
      >

        {/* Drag Handle Top Bar on Mobile */}
        <div className="absolute top-0 left-0 w-full h-12 z-[60] md:hidden flex items-start justify-center pt-3 touch-none" {...swipe}>
          <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full pointer-events-none" />
        </div>

        <button onClick={() => { handleAutoSave(); onClose(); }} className="absolute top-4 right-4 z-[100] p-2 text-[#171A17]/50 dark:text-white/50 hover:text-[#171A17] dark:hover:text-white transition-all cursor-pointer items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-full shadow-sm hover:bg-black/10 dark:hover:bg-white/10">
          <CloseIcon />
        </button>

        {/* Seamless Mobile Scroll Wrapper */}
        <div className="flex-1 w-full h-full overflow-y-auto md:overflow-hidden flex flex-col md:flex-row custom-scrollbar pt-12 md:pt-0">
          <PreviewPane
            bookmark={bookmark} displayType={displayType} previewImageUrl={previewImageUrl} edits={edits}
            onFullscreenImage={onFullscreenImage} getDomain={getDomain} onCyclePreview={onCyclePreview}
          />
          <MetaPane
            bookmark={bookmark} displayType={displayType} edits={edits} folderHierarchy={folderHierarchy}
            isPinned={isPinned} onTogglePin={onTogglePin} onRequestDelete={() => setShowDeleteConfirm(true)}
          />
        </div>

        {showDeleteConfirm && (
          <DeleteConfirm
            onConfirm={() => { setShowDeleteConfirm(false); onDelete(bookmark.id); onClose(); }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    </div>,
    document.body
  )
}
