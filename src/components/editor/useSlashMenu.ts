import { useState, useCallback } from 'react'
import { SLASH_COMMANDS, SlashCommand, matchSlashTrigger, getSlashRange } from './editorCommands'

// State and keyboard handling for the "/" menu. The editor itself is passed in by the caller.
export function useSlashMenu() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuCoords, setMenuCoords] = useState({ top: 0, bottom: 0, left: 0 })
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filteredCommands = SLASH_COMMANDS.filter(cmd => cmd.title.toLowerCase().includes(query.toLowerCase()))

  const close = useCallback(() => setMenuOpen(false), [])

  // Called after every edit: opens the menu while "/word" is right before the cursor (only in the expanded editor).
  const updateFromEditor = (editor: any, enabled: boolean) => {
    const match = matchSlashTrigger(editor)
    if (match && enabled) {
      const coords = editor.view.coordsAtPos(editor.state.selection.from)
      setMenuCoords({ top: coords.top, bottom: coords.bottom, left: coords.left })
      setQuery(match[2])
      setSelectedIndex(0)
      setMenuOpen(true)
    } else {
      setMenuOpen(false)
    }
  }

  // The range is read from the editor at the moment of choosing, never saved earlier.
  const pick = (editor: any, cmd: SlashCommand) => {
    cmd.command({ editor, range: getSlashRange(editor) })
    setMenuOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent, editor: any) => {
    if (!menuOpen) return
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      if (filteredCommands.length > 0 && editor) pick(editor, filteredCommands[selectedIndex])
      setMenuOpen(false)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()   // this Esc only closes the menu; the pop-up around the editor stays open
      setMenuOpen(false)
    }
  }

  return { menuOpen, menuCoords, selectedIndex, filteredCommands, close, updateFromEditor, pick, handleKeyDown }
}
