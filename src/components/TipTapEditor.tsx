'use client'

import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

// Clean UI Icons
const H1Icon = () => <span className="font-bold text-xs tracking-wider">H1</span>
const H2Icon = () => <span className="font-bold text-xs tracking-wider">H2</span>
const ListIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
const TaskIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
const QuoteIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1.5.5 1.5 1.5L5 16c0 1.5-2 2.5-2 5h0z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.5c0 1 0 1.5 0 2l-.5 1c0 1.5-2 2.5-2 5h0z"></path></svg>
const CodeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
const DividerIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>

const SLASH_COMMANDS = [
  { title: 'Heading 1', icon: <H1Icon />, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run() } },
  { title: 'Heading 2', icon: <H2Icon />, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run() } },
  { title: 'Bullet List', icon: <ListIcon />, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleBulletList().run() } },
  { title: 'Task List', icon: <TaskIcon />, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleTaskList().run() } },
  { title: 'Blockquote', icon: <QuoteIcon />, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleBlockquote().run() } },
  { title: 'Code Block', icon: <CodeIcon />, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleCodeBlock().run() } },
  { title: 'Divider', icon: <DividerIcon />, command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setHorizontalRule().run() } },
]

export default function TipTapEditor({ value, onChange, placeholder = "Paste a link or write a note..." }: { value: string, onChange: (val: string) => void, placeholder?: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 })
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [range, setRange] = useState({ from: 0, to: 0 })

  const filteredCommands = SLASH_COMMANDS.filter(cmd => cmd.title.toLowerCase().includes(query.toLowerCase()))

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      
      const { state, view } = editor
      const { selection } = state
      const { $head } = selection
      
      // Only show the slash menu in an empty paragraph block
      if ($head.parent.type.name !== 'paragraph') {
        setMenuOpen(false)
        return
      }
      
      const textBefore = $head.parent.textBetween(0,$head.parentOffset, undefined, '\ufffc')
      
      // Match a standalone '/' at the end of a line
      const match = textBefore.match(/(?:^|\s)(\/([a-zA-Z]*))$/)
      if (match) {
        const coords = view.coordsAtPos(selection.from)
        setMenuCoords({ top: coords.top, left: coords.left })
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
        // Core styling mapped to your exact layout needs
        class: 'prose prose-sm dark:prose-invert focus:outline-none max-w-none text-[#171A17] dark:text-[#F3F0E9] prose-p:m-0 prose-p:leading-normal min-h-[24px]',
      }
    },
  })

  // Sync state clearing when the parent hits 'Send'
  useEffect(() => {
    if (value === '' && editor && editor.getHTML() !== '<p></p>') {
      editor.commands.setContent('')
    }
  }, [value, editor])

  // Move the key handler to the React level so it has perfect access to state and the editor instance
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
        e.stopPropagation() // Stops the form from accidentally submitting
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

  return (
    <div className="relative w-full flex-1 flex flex-col justify-center" onKeyDown={handleKeyDown}>
      <EditorContent editor={editor} className="w-full" />
      
      {/* Floating Menu - Renders upwards so it never goes off-screen in the bottom bar */}
      {menuOpen && filteredCommands.length > 0 && (
        <div 
          className="fixed z-[100] w-56 bg-[#FBF9F4] dark:bg-[#1A1D1A] border border-black/[0.08] dark:border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-xl py-2 flex flex-col overflow-hidden"
          style={{
            bottom: window.innerHeight - menuCoords.top + 16, // Pushes menu UP above the cursor
            left: menuCoords.left,
          }}
        >
          <div className="px-3 pb-2 mb-2 text-[10px] uppercase tracking-wider text-[#A0A6A0] border-b border-black/[0.04] dark:border-white/[0.04]">
            Basic Blocks
          </div>
          {filteredCommands.map((cmd, index) => (
            <button
              key={index}
              className={`flex items-center gap-3 px-3 py-2 mx-1 rounded-lg text-sm transition-colors text-left ${index === selectedIndex ? 'bg-black/[0.04] dark:bg-white/[0.04] text-[#171A17] dark:text-white font-medium' : 'text-[#636A63] dark:text-[#9DA59D] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#171A17] dark:hover:text-white'}`}
              onClick={() => {
                if (editor) {
                  cmd.command({ editor, range })
                }
                setMenuOpen(false)
              }}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded bg-white dark:bg-black/20 text-[#4D6A51] dark:text-[#8FAA91] shadow-sm border border-black/[0.04] dark:border-white/[0.04]">
                {cmd.icon}
              </div>
              <span>{cmd.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}