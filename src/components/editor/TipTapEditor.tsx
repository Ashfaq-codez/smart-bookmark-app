'use client'

import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'

import { TrashIcon } from './EditorIcons'
import SlashMenu from './SlashMenu'
import { useSlashMenu } from './useSlashMenu'

export default function TipTapEditor({ 
  value, 
  onChange, 
  onFocus, 
  onBlur, 
  isExpanded = false 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  onFocus?: () => void, 
  onBlur?: () => void,
  isExpanded?: boolean 
}) {
  const slash = useSlashMenu()
  const [mounted, setMounted] = useState(false)
  const [isTableActive, setIsTableActive] = useState(false)
  
  const placeholderRef = useRef("Paste a link or write a note...")

  useEffect(() => setMounted(true), [])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: () => placeholderRef.current }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onFocus: () => { if (onFocus) onFocus() },
    onBlur: () => { if (onBlur) onBlur(); slash.close(); },
    onTransaction: ({ editor }) => {
      setIsTableActive(editor.isActive('table'))
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      
      slash.updateFromEditor(editor, isExpanded)   // ONLY opens the slash menu in the expanded Focus Mode
    },
    editorProps: {
      attributes: {
        class: 'prose sm:prose-sm dark:prose-invert focus:outline-none max-w-none prose-p:m-0 prose-p:leading-relaxed min-h-[24px] outline-none !text-[16px] sm:!text-sm tiptap',
      }
    },
  })

  // Dynamic Rotating Placeholder Logic
  useEffect(() => {
    if (!isExpanded) {
      placeholderRef.current = "Paste a link or write a note..."
      if (editor && !editor.isDestroyed) editor.view.dispatch(editor.state.tr)
      return
    }

    const texts = ["Paste a link or write a note...", "Type '/' for edit tools", "Save a quick thought..."]
    let idx = 0
    const interval = setInterval(() => {
      idx = (idx + 1) % texts.length
      placeholderRef.current = texts[idx]
      if (editor && !editor.isDestroyed) {
        editor.view.dispatch(editor.state.tr)
      }
    }, 3500)
    
    return () => clearInterval(interval)
  }, [editor, isExpanded])

  useEffect(() => {
    if (value === '' && editor && editor.getHTML() !== '<p></p>') {
      editor.commands.setContent('')
    }
  }, [value, editor])

  return (
    <div className={`relative w-full h-full flex flex-col min-h-0`} onKeyDown={(e) => slash.handleKeyDown(e, editor)}>

      {/* Manual Table Deletion Floating Button */}
      {isTableActive && (
        <div className="absolute top-2 right-2 z-50">
          <button
            onClick={(e) => {
              e.preventDefault();
              editor?.chain().focus().deleteTable().run();
            }}
            className="flex items-center gap-1.5 bg-white dark:bg-[#1A1D1A] text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg shadow-md border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <TrashIcon /> Remove Table
          </button>
        </div>
      )}

      <EditorContent editor={editor} className={`flex-1 w-full overflow-visible md:overflow-y-auto custom-scrollbar ${isExpanded ? 'p-4 md:p-6' : ''}`} />
      
      {/* The Slash Menu */}
      {mounted && slash.menuOpen && slash.filteredCommands.length > 0 && (
        <SlashMenu
          commands={slash.filteredCommands}
          selectedIndex={slash.selectedIndex}
          coords={slash.menuCoords}
          onPick={(cmd) => { if (editor) slash.pick(editor, cmd) }}
        />
      )}
    </div>
  )
}