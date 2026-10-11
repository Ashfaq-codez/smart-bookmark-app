import { H1Icon, H2Icon, ListIcon, TaskIcon, QuoteIcon, CodeIcon, TableIcon, DividerIcon } from './EditorIcons'

export const TOOLBAR_COMMANDS = [
  { title: 'Heading 1', icon: <H1Icon />, command: ({ editor }: any) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
  { title: 'Heading 2', icon: <H2Icon />, command: ({ editor }: any) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
  { title: 'Bullet List', icon: <ListIcon />, command: ({ editor }: any) => editor.chain().focus().toggleBulletList().run() },
  { title: 'Task List', icon: <TaskIcon />, command: ({ editor }: any) => editor.chain().focus().toggleTaskList().run() },
  { title: 'Blockquote', icon: <QuoteIcon />, command: ({ editor }: any) => editor.chain().focus().toggleBlockquote().run() },
  { title: 'Code Block', icon: <CodeIcon />, command: ({ editor }: any) => editor.chain().focus().toggleCodeBlock().run() },
  { title: 'Table', icon: <TableIcon />, command: ({ editor }: any) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { title: 'Divider', icon: <DividerIcon />, command: ({ editor }: any) => editor.chain().focus().setHorizontalRule().run() },
]

export const SLASH_COMMANDS = [
  ...TOOLBAR_COMMANDS.map(cmd => ({
    ...cmd,
    command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).run(); cmd.command({ editor }); }
  }))
]

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
