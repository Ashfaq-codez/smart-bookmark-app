import { ReactNode } from 'react'
import type { Editor } from '@tiptap/core'
import { H1Icon, H2Icon, ListIcon, TaskIcon, QuoteIcon, CodeIcon, TableIcon, DividerIcon } from './EditorIcons'

// Each block adds its own step to a chain that already holds "delete the typed /text".
// The slash menu then runs the whole chain once, so it is ONE edit and ONE Ctrl+Z undoes all of it.
type Chain = ReturnType<Editor['chain']>

const BLOCK_COMMANDS: { title: string; icon: ReactNode; apply: (chain: Chain) => Chain }[] = [
  { title: 'Heading 1', icon: <H1Icon />, apply: chain => chain.toggleHeading({ level: 1 }) },
  { title: 'Heading 2', icon: <H2Icon />, apply: chain => chain.toggleHeading({ level: 2 }) },
  { title: 'Bullet List', icon: <ListIcon />, apply: chain => chain.toggleBulletList() },
  { title: 'Task List', icon: <TaskIcon />, apply: chain => chain.toggleTaskList() },
  { title: 'Blockquote', icon: <QuoteIcon />, apply: chain => chain.toggleBlockquote() },
  { title: 'Code Block', icon: <CodeIcon />, apply: chain => chain.toggleCodeBlock() },
  { title: 'Table', icon: <TableIcon />, apply: chain => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }) },
  { title: 'Divider', icon: <DividerIcon />, apply: chain => chain.setHorizontalRule() },
]

export const SLASH_COMMANDS = BLOCK_COMMANDS.map(cmd => ({
  title: cmd.title,
  icon: cmd.icon,
  // `range` is the "/text" to remove; it must be read at the moment of choosing (see getSlashRange).
  command: ({ editor, range }: { editor: Editor; range: { from: number; to: number } }) =>
    cmd.apply(editor.chain().focus().deleteRange(range)).run(),
}))

export type SlashCommand = (typeof SLASH_COMMANDS)[number]

// Finds the "/query" text just before the cursor (null when there is none).
export const matchSlashTrigger = (editor: any) => {
  const { $head } = editor.state.selection
  if ($head.parent.type.name !== 'paragraph') return null
  const textBefore = $head.parent.textBetween(0, $head.parentOffset, undefined, '\ufffc')
  return textBefore.match(/(?:^|\s)(\/([a-zA-Z]*))$/)
}

// Resolve the "/query" trigger range from the live selection at the moment a command is chosen
export const getSlashRange = (editor: any) => {
  const { from } = editor.state.selection
  const match = matchSlashTrigger(editor)
  return match ? { from: from - match[1].length, to: from } : { from, to: from }
}
