'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'

const H1Icon = () => <span className="font-bold text-xs tracking-wider">H1</span>
const H2Icon = () => <span className="font-bold text-xs tracking-wider">H2</span>
const ListIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
const TaskIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
const QuoteIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.5c0 1 0 1.5 0 2l-.5 1c0 1.5-2 2.5-2 5h0z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.5c0 1 0 1.5 0 2l-.5 1c0 1.5-2 2.5-2 5h0z"></path></svg>
const CodeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
const DividerIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
const TableIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="9" x2="9" y2="21"></line><line x1="15" y1="9" x2="15" y2="21"></line></svg>
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>

const SLASH_COMMANDS = [
  { title: 'Heading 1', icon: <H1Icon />, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run() } },
  { title: 'Heading 2', icon: <H2Icon />, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run() } },
  { title: 'Bullet List', icon: <ListIcon />, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleBulletList().run() } },
  { title: 'Task List', icon: <TaskIcon />, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleTaskList().run() } },
  { title: 'Blockquote', icon: <QuoteIcon />, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleBlockquote().run() } },
  { title: 'Code Block', icon: <CodeIcon />, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleCodeBlock().run() } },
  { title: 'Table', icon: <TableIcon />, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() } },
  { title: 'Divider', icon: <DividerIcon />, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setHorizontalRule().run() } },
]

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
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuCoords, setMenuCoords] = useState({ top: 0, bottom: 0, left: 0 })
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [range, setRange] = useState({ from: 0, to: 0 })
  const [mounted, setMounted] = useState(false)
  const [isTableActive, setIsTableActive] = useState(false)
  
  const placeholderRef = useRef("Paste a link or write a note...")

  useEffect(() => setMounted(true), [])

  const filteredCommands = SLASH_COMMANDS.filter(cmd => cmd.title.toLowerCase().includes(query.toLowerCase()))

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
    onBlur: () => { if (onBlur) onBlur(); setMenuOpen(false); },
    onTransaction: ({ editor }) => {
      setIsTableActive(editor.isActive('table'))
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      
      const { state, view } = editor
      const { selection } = state
      const { $head } = selection
      
      if ($head.parent.type.name !== 'paragraph') {
        setMenuOpen(false)
        return
      }
      
      const textBefore = $head.parent.textBetween(0,$head.parentOffset, undefined, '\ufffc')
      const match = textBefore.match(/(?:^|\s)(\/([a-zA-Z]*))$/)
      
      // ONLY trigger the slash menu if the editor is in expanded Focus Mode
      if (match && isExpanded) {
        const coords = view.coordsAtPos(selection.from)
        setMenuCoords({ top: coords.top, bottom: coords.bottom, left: coords.left })
        setQuery(match[2])
        setRange({ from: selection.from - match[1].length, to: selection.from })
        setSelectedIndex(0)
        setMenuOpen(true)
      } else {
        setMenuOpen(false)
      }
    },
    editorProps: {
      attributes: {
        class: 'prose sm:prose-sm focus:outline-none max-w-none prose-p:m-0 prose-p:leading-relaxed min-h-[24px] outline-none !text-[16px] sm:!text-sm tiptap',
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (menuOpen) {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        if (filteredCommands.length > 0 && editor) {
          filteredCommands[selectedIndex].command({ editor, range })
        }
        setMenuOpen(false)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setMenuOpen(false)
      }
    }
  }

  const getPortalPosition = () => {
    const spaceBelow = window.innerHeight - menuCoords.bottom
    const spaceAbove = menuCoords.top
    const menuHeight = 280
    
    if (spaceBelow >= menuHeight) {
      return {
        top: menuCoords.bottom + 8,
        left: Math.max(10, Math.min(menuCoords.left, window.innerWidth - 270)),
      }
    } else if (spaceAbove >= menuHeight) {
      return {
        bottom: window.innerHeight - menuCoords.top + 8,
        left: Math.max(10, Math.min(menuCoords.left, window.innerWidth - 270)),
      }
    } else {
      return {
        bottom: 20,
        left: Math.max(10, Math.min(menuCoords.left, window.innerWidth - 270)),
      }
    }
  }

  return (
    <div className={`relative w-full h-full flex flex-col min-h-0 ${isExpanded ? 'editor-expanded' : 'editor-collapsed'}`} onKeyDown={handleKeyDown}>
      
      {/* Strict Nuclear CSS to absolutely bypass Tailwind Prose colors in all states */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Expanded Modal - Light Mode Background (Needs Dark Text) */
        .editor-expanded .tiptap, .editor-expanded .tiptap * {
          color: #171A17 !important;
        }
        /* Expanded Modal - Dark Mode Background (Needs Light Text) */
        .dark .editor-expanded .tiptap, .dark .editor-expanded .tiptap * {
          color: #F3F0E9 !important;
        }

        /* Collapsed Capture Bar - Green Background (Needs White Text) */
        .editor-collapsed .tiptap, .editor-collapsed .tiptap * {
          color: #ffffff !important;
        }
        /* Collapsed Capture Bar - Light Beige Background (Needs Dark Text) */
        .dark .editor-collapsed .tiptap, .dark .editor-collapsed .tiptap * {
          color: #171A17 !important;
        }
        
        /* Placeholder specific overrides so they don't get fully opaque */
        .editor-expanded .tiptap p.is-editor-empty:first-child::before {
          color: rgba(23, 26, 23, 0.4) !important;
        }
        .dark .editor-expanded .tiptap p.is-editor-empty:first-child::before {
          color: rgba(243, 240, 233, 0.4) !important;
        }
        .editor-collapsed .tiptap p.is-editor-empty:first-child::before {
          color: rgba(255, 255, 255, 0.7) !important;
        }
        .dark .editor-collapsed .tiptap p.is-editor-empty:first-child::before {
          color: rgba(23, 26, 23, 0.5) !important;
        }
      `}} />

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
      
      {/* The Slash Menu (Now strictly portal-rendered and decoupled from editor colors) */}
      {mounted && menuOpen && filteredCommands.length > 0 && createPortal(
        <div 
          className="fixed z-[9999] w-64 bg-[#FBF9F4] dark:bg-[#1A1D1A] border border-black/[0.08] dark:border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-xl py-2 flex flex-col overflow-hidden max-h-[40vh] custom-scrollbar overflow-y-auto text-[#171A17] dark:text-[#F3F0E9]"
          style={getPortalPosition()}
        >
          <div className="px-3 pb-2 mb-2 text-[10px] uppercase tracking-wider text-[#A0A6A0] border-b border-black/[0.04] dark:border-white/[0.04] sticky top-0 bg-[#FBF9F4] dark:bg-[#1A1D1A] z-10">
            Basic Blocks
          </div>
          {filteredCommands.map((cmd, index) => (
            <button
              key={index}
              className={`flex items-center gap-3 px-3 py-2 mx-1 rounded-lg text-sm transition-colors text-left ${index === selectedIndex ? 'bg-black/[0.04] dark:bg-white/[0.04] text-[#171A17] dark:text-white font-medium' : 'text-[#636A63] dark:text-[#9DA59D] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#171A17] dark:hover:text-white'}`}
              onMouseDown={(e) => {
                e.preventDefault()
                if (editor) {
                  cmd.command({ editor, range })
                }
                setMenuOpen(false)
              }}
            >
              <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded bg-white dark:bg-black/20 text-[#4D6A51] dark:text-[#8FAA91] shadow-sm border border-black/[0.04] dark:border-white/[0.04]">
                {cmd.icon}
              </div>
              <span>{cmd.title}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}