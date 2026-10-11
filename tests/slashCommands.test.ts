// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { SLASH_COMMANDS, getSlashRange } from '@/components/editor/editorCommands'

// A real (headless) editor with the same extensions the app uses, so undo behaves like in the browser.
let editor: Editor
function makeEditor(html: string) {
  editor = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, TaskList, TaskItem.configure({ nested: true }), Table.configure({ resizable: true }), TableRow, TableHeader, TableCell],
    content: html,
  })
  editor.commands.focus('end')
  return editor
}
afterEach(() => editor?.destroy())

const BEFORE = '<p>hello /he</p>'

describe('slash commands', () => {
  it('has a command for every block in the menu', () => {
    expect(SLASH_COMMANDS.map(c => c.title)).toEqual(
      ['Heading 1', 'Heading 2', 'Bullet List', 'Task List', 'Blockquote', 'Code Block', 'Table', 'Divider'])
  })

  for (const cmd of SLASH_COMMANDS) {
    describe(cmd.title, () => {
      it('removes the typed /text and changes the block', () => {
        makeEditor(BEFORE)
        cmd.command({ editor, range: getSlashRange(editor) })
        expect(editor.getHTML()).not.toContain('/he')
        expect(editor.getHTML()).not.toBe(BEFORE)
        expect(editor.getText()).toContain('hello')
      })

      it('is undone completely by ONE undo (the /text comes back too)', () => {
        makeEditor(BEFORE)
        cmd.command({ editor, range: getSlashRange(editor) })
        editor.commands.undo()
        expect(editor.getHTML()).toBe(BEFORE)
      })

      it('makes exactly one edit', () => {
        makeEditor(BEFORE)
        let edits = 0
        editor.on('update', () => { edits++ })
        cmd.command({ editor, range: getSlashRange(editor) })
        expect(edits).toBe(1)
      })
    })
  }

  it('uses the range at the moment of choosing, even if the cursor moved since typing', () => {
    makeEditor('<p>one</p><p>two /he</p>')
    editor.commands.focus('end')
    const range = getSlashRange(editor)
    SLASH_COMMANDS[0].command({ editor, range })
    expect(editor.getHTML()).toContain('<h1>two </h1>')
    expect(editor.getHTML()).toContain('<p>one</p>')
    expect(editor.getHTML()).not.toContain('/he')
  })
})
