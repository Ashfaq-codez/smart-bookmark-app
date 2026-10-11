import { Send, Paperclip, LoaderCircle, Menu, MessageSquare, Search, X, ArrowDownWideNarrow, ArrowUpNarrowWide, Plus, SlidersHorizontal } from 'lucide-react'

// Icons used by the list screen (lucide-react, sized and stroked like the hand-drawn ones they replaced).
export const SendIcon = () => <Send size={18} strokeWidth={2} />
export const PaperclipIcon = () => <Paperclip size={18} strokeWidth={2} />
export const SpinnerIcon = () => <LoaderCircle size={18} strokeWidth={2} className="animate-spin" />
export const MenuIcon = () => <Menu size={24} strokeWidth={1.5} />
export const FeedbackIcon = () => <MessageSquare size={18} strokeWidth={1.8} />
export const SearchIcon = ({ className }: { className?: string }) => <Search className={className} size={16} strokeWidth={2} />
export const ClearIcon = () => <X size={14} strokeWidth={2} />
export const SortDescIcon = () => <ArrowDownWideNarrow size={18} strokeWidth={2} />
export const SortAscIcon = () => <ArrowUpNarrowWide size={18} strokeWidth={2} />
export const PlusIcon = () => <Plus size={16} strokeWidth={2} />
export const SlidersIcon = () => <SlidersHorizontal size={16} strokeWidth={2} />
