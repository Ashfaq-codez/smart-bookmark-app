import { createPortal } from 'react-dom'
import { SlashCommand } from './editorCommands'

type Coords = { top: number; bottom: number; left: number }

const getPortalPosition = (menuCoords: Coords) => {
  const spaceBelow = window.innerHeight - menuCoords.bottom
  const spaceAbove = menuCoords.top
  const menuHeight = 280
  const left = Math.max(10, Math.min(menuCoords.left, window.innerWidth - 270))

  if (spaceBelow >= menuHeight) return { top: menuCoords.bottom + 8, left }
  if (spaceAbove >= menuHeight) return { bottom: window.innerHeight - menuCoords.top + 8, left }
  return { bottom: 20, left }
}

// The floating list of blocks that appears when you type "/".
export default function SlashMenu({ commands, selectedIndex, coords, onPick }: {
  commands: SlashCommand[]
  selectedIndex: number
  coords: Coords
  onPick: (cmd: SlashCommand) => void
}) {
  return createPortal(
    <div 
      className="fixed z-[9999] w-64 bg-[#FBF9F4] dark:bg-[#1A1D1A] border border-black/[0.08] dark:border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-xl py-2 flex flex-col overflow-hidden max-h-[40vh] custom-scrollbar overflow-y-auto text-[#171A17] dark:text-[#F3F0E9]"
      style={getPortalPosition(coords)}
    >
      <div className="px-3 pb-2 mb-2 text-[10px] uppercase tracking-wider text-[#A0A6A0] border-b border-black/[0.04] dark:border-white/[0.04] sticky top-0 bg-[#FBF9F4] dark:bg-[#1A1D1A] z-10">
        Basic Blocks
      </div>
      {commands.map((cmd, index) => (
        <button
          key={index}
          className={`flex items-center gap-3 px-3 py-2 mx-1 rounded-lg text-sm transition-colors text-left ${index === selectedIndex ? 'bg-black/[0.04] dark:bg-white/[0.04] text-[#171A17] dark:text-white font-medium' : 'text-[#636A63] dark:text-[#9DA59D] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#171A17] dark:hover:text-white'}`}
          onMouseDown={(e) => {
            e.preventDefault()
            onPick(cmd)
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
  )
}
