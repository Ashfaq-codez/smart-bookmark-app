import { List, SquareCheckBig, Quote, Code, Minus, Grid3x3, Trash } from 'lucide-react'

// Small icons used by the editor's slash menu and table button (lucide-react).
export const H1Icon = () => <span className="font-bold text-xs tracking-wider">H1</span>
export const H2Icon = () => <span className="font-bold text-xs tracking-wider">H2</span>
export const ListIcon = () => <List size={14} strokeWidth={2} />
export const TaskIcon = () => <SquareCheckBig size={14} strokeWidth={2} />
export const QuoteIcon = () => <Quote size={14} strokeWidth={2} />
export const CodeIcon = () => <Code size={14} strokeWidth={2} />
export const DividerIcon = () => <Minus size={14} strokeWidth={2} />
export const TableIcon = () => <Grid3x3 size={14} strokeWidth={2} />
export const TrashIcon = () => <Trash size={14} strokeWidth={2} />
