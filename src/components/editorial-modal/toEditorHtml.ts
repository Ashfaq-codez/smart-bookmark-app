// Plain-text notes (e.g. saved before HTML capture, or from inputs) have no block tags,
// so TipTap collapses their newlines into one paragraph. Convert them to real paragraphs/line breaks.
export const toEditorHtml = (raw: string): string => {
  if (!raw) return ''
  if (/<(p|br|ul|ol|li|h[1-6]|blockquote|pre|hr|div|table)\b/i.test(raw)) return raw
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return raw
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('')
}
