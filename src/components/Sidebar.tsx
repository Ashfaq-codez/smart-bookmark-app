'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import ProfileDropdown from './ProfileDropdown'
import FolderRow, { ROW_END_SLOT } from './FolderRow'
import { Plus, X, Folder, House, Moon, Sun, PanelLeftOpen, PanelLeftClose, Compass, ArrowRight } from 'lucide-react'

const PlusIcon = () => <Plus size={14} strokeWidth={1.5} />
const SmallXIcon = ({ className }: { className?: string }) => <X className={className} size={14} strokeWidth={1.5} />
const FolderIcon = () => <Folder size={18} strokeWidth={1.5} />
const SmallFolderIcon = () => <Folder size={14} strokeWidth={1.5} />
const HomeIcon = () => <House size={14} strokeWidth={1.5} />
const MoonIcon = () => <Moon size={18} strokeWidth={1.5} />
const SunIcon = () => <Sun size={18} strokeWidth={1.5} />
const PanelLeftOpenIcon = () => <PanelLeftOpen size={20} strokeWidth={1.5} />
const PanelLeftCloseIcon = ({ className }: { className?: string }) => <PanelLeftClose className={className} size={20} strokeWidth={1.5} />
const CompassIcon = () => <Compass size={18} strokeWidth={1.8} />
const ArrowRightIcon = () => <ArrowRight size={14} strokeWidth={2} />

interface SidebarProps {
  isCollapsed: boolean;
  userEmail: string | null;
  handleSignOut: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  activeSubFilter: string | null;
  setActiveSubFilter: (subFilter: string | null) => void;
  onOpenGuide: () => void;
  getCounts: Record<string, number>;
  folderHierarchy: Record<string, string[]>;
  expandedFolders: Record<string, boolean>;
  toggleFolderExpand: (folder: string) => void;
  customCategories: string[];
  handleDeleteCategory: (catToDelete: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetCategory: string, targetSubCategory?: string) => void;
  creatingSubFor: string | null;
  setCreatingSubFor: (folder: string | null) => void;
  newSubfolderName: string;
  setNewSubfolderName: (name: string) => void;
  handleAddSubfolder: (parentFolder: string) => void;
  isAddingCategory: boolean;
  setIsAddingCategory: (isAdding: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  handleAddCategory: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  if (props.isCollapsed) {
    return (
      <aside className="w-full h-full flex flex-col bg-[#FBF9F4] dark:bg-[#151815] text-[#636A63] dark:text-[#9DA59D] font-sans border-r border-black/[0.04] dark:border-white/[0.04] items-center py-6 overscroll-contain">
        <div className="flex flex-col gap-6 items-center">
          <button aria-label="Open sidebar" onClick={() => props.setIsMobileMenuOpen(true)} className="text-[#737B73] dark:text-[#8F998F] hover:text-[#171A17] dark:hover:text-white transition-colors">
            <PanelLeftOpenIcon />
          </button>
          <button aria-label="Open library" onClick={() => props.setIsMobileMenuOpen(true)} className="text-[#737B73] dark:text-[#8F998F] hover:text-[#171A17] dark:hover:text-white transition-colors" title="Open Library">
            <FolderIcon />
          </button>
        </div>

        <div className="flex flex-col gap-4 mt-8 items-center border-t border-black/[0.04] dark:border-white/[0.04] pt-6">
          <button
            onClick={props.onOpenGuide}
            aria-label="How inntoit works"
            title="How inntoit works"
            className="w-10 h-10 rounded-xl inline-flex items-center justify-center text-[#4D6A51] dark:text-[#8FAA91] bg-[#4D6A51]/10 dark:bg-[#8FAA91]/10 hover:bg-[#4D6A51]/15 dark:hover:bg-[#8FAA91]/20 transition-colors"
          >
            <CompassIcon />
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-4 items-center relative z-20 pb-4">
          <button aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleDarkMode} className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#1A1D1A] shadow-sm border border-black/[0.04] dark:border-white/[0.04] text-[#303630] dark:text-[#EDE9E0] transition-colors hover:bg-black/5 dark:hover:bg-white/5">
             {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          <ProfileDropdown email={props.userEmail || ""} isCollapsed={true} />
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-full h-full flex flex-col bg-[#FBF9F4] dark:bg-[#151815] text-[#636A63] dark:text-[#9DA59D] font-sans border-r border-black/[0.04] dark:border-white/[0.04] overscroll-contain">
      <div className="flex-1 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-0 flex flex-col">
        <div className="px-6 pt-6 pb-2 flex w-full justify-between items-center">
          <h1 className="font-serif text-2xl text-[#1B221B] dark:text-white mb-1">inntoit</h1>
          <button aria-label="Close sidebar" onClick={() => props.setIsMobileMenuOpen(!props.isMobileMenuOpen)} className="text-[#737B73] hover:text-[#171A17] dark:hover:text-white transition-colors">
            <SmallXIcon className="lg:hidden" />
            <PanelLeftCloseIcon className="hidden lg:block" />
          </button>
        </div>

        {/* Getting started: the welcome tour */}
        <div className="px-4 mt-4">
          <button
            onClick={props.onOpenGuide}
            className="group w-full flex items-center gap-3 p-3 rounded-2xl text-left bg-gradient-to-br from-[#EAF1E8] to-[#F5F1E6] dark:from-[#1C281E] dark:to-[#181C18] border border-[#4D6A51]/15 dark:border-[#8FAA91]/15 hover:shadow-[0_6px_20px_rgba(77,106,81,0.12)] transition-all"
          >
            <span className="w-9 h-9 shrink-0 rounded-xl bg-white dark:bg-[#151815] shadow-sm inline-flex items-center justify-center text-[#4D6A51] dark:text-[#8FAA91]">
              <CompassIcon />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-[#171A17] dark:text-white">Welcome to inntoit</span>
              <span className="block text-xs text-[#737B73] dark:text-[#8F998F]">See how it works · 1 min</span>
            </span>
            <span className="text-[#737B73] dark:text-[#8F998F] group-hover:translate-x-0.5 group-hover:text-[#4D6A51] dark:group-hover:text-[#8FAA91] transition-all">
              <ArrowRightIcon />
            </span>
          </button>
        </div>

        <div className="px-6 pb-2 mt-6 border-t border-black/[0.04] dark:border-white/[0.04] pt-6">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-[#737B73] dark:text-[#8F998F] font-bold">Library</h2>
        </div>

        <div className="py-2 flex items-center group mt-2 justify-between px-6">
          <span className="text-lg text-[#171A17] dark:text-white">Folders</span>
          <button onClick={() => props.setIsAddingCategory(!props.isAddingCategory)} className="text-[#737B73] hover:bg-black/5 dark:hover:bg-white/5 rounded-md p-1 transition-colors" title="New Category" aria-label="New folder">
            <PlusIcon />
          </button>
        </div>

        {props.isAddingCategory && (
          <div className="px-6 py-2">
            <input autoFocus type="text" placeholder="Folder Name..." value={props.newCategoryName} onChange={(e) => props.setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddCategory()} className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1A1D1A] border border-black/[0.04] dark:border-white/[0.04] rounded-lg shadow-sm outline-none text-[#171A17] dark:text-[#E2E8F0]" />
          </div>
        )}

        <div className="flex flex-col flex-1 mt-2">
          <div
            onClick={() => { props.setActiveFilter('All'); props.setActiveSubFilter(null); props.setIsMobileMenuOpen(false); }}
            className={`flex items-center justify-between gap-2 px-6 py-2 cursor-pointer transition-colors ${props.activeFilter === 'All' ? 'text-[#171A17] dark:text-white font-medium bg-black/[0.03] dark:bg-white/[0.03]' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'}`}
          >
            <div className="flex items-center gap-3">
               <HomeIcon />
               <span className="text-sm">All</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="min-w-[2ch] text-right tabular-nums text-[10px] text-[#A0A6A0]">{props.getCounts['All'] || 0}</span>
              <span className={ROW_END_SLOT} aria-hidden="true" />
            </div>
          </div>

          {Object.keys(props.folderHierarchy).map(parentFolder => {
            const isParentActive = props.activeFilter === parentFolder;
            const isExpanded = props.expandedFolders[parentFolder];
            const subfolders = props.folderHierarchy[parentFolder];

            return (
              <div key={parentFolder} className="flex flex-col">
                <FolderRow
                  name={parentFolder}
                  count={props.getCounts[parentFolder] || 0}
                  active={isParentActive && !props.activeSubFilter}
                  icon={<SmallFolderIcon />}
                  onOpen={() => { props.setActiveFilter(parentFolder); props.setActiveSubFilter(null); props.toggleFolderExpand(parentFolder); }}
                  onDelete={parentFolder !== 'Uncategorized' ? () => props.handleDeleteCategory(parentFolder) : undefined}
                  onDragOver={props.handleDragOver}
                  onDrop={(e) => props.handleDrop(e, parentFolder)}
                />

                {isExpanded && (
                  <div className="flex flex-col">
                    {subfolders.map(sub => {
                      const isSubActive = isParentActive && props.activeSubFilter === sub;
                      return (
                        <div key={sub} onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder, sub)} onClick={(e) => { e.stopPropagation(); props.setActiveFilter(parentFolder); props.setActiveSubFilter(sub); props.setIsMobileMenuOpen(false); }} className={`flex items-center justify-between pl-12 pr-6 py-1.5 cursor-pointer transition-colors ${isSubActive ? 'text-[#4D6A51] dark:text-[#8FAA91] font-medium' : 'text-[#737B73] hover:text-[#171A17] dark:hover:text-white'}`}>
                          <span className="text-xs truncate text-[#737B73]" title={sub}>- {sub}</span>
                          <div className="flex items-center gap-2 shrink-0 pl-2">
                            <span className="min-w-[2ch] text-right tabular-nums text-[9px] text-[#A0A6A0]">{props.getCounts[`${parentFolder}::${sub}`] || 0}</span>
                            <span className={ROW_END_SLOT} aria-hidden="true" />
                          </div>
                        </div>
                      )
                    })}
                    {props.creatingSubFor === parentFolder ? (
                      <div className="flex items-center pl-12 pr-6 py-1">
                        <input autoFocus type="text" placeholder="New sub-folder" value={props.newSubfolderName} onChange={(e) => props.setNewSubfolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddSubfolder(parentFolder)} className="w-full text-xs bg-transparent outline-none text-[#171A17] dark:text-white" />
                        <button aria-label="Cancel" onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(null); }} className="text-[#A0A6A0] hover:text-[#E53E3E]"><SmallXIcon /></button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(parentFolder); }} className="pl-12 py-1.5 text-left text-xs text-[#A0A6A0] hover:text-[#4D6A51] transition-colors">
                        + Add folder
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-4 sm:p-6 mt-auto border-t border-black/[0.04] dark:border-white/[0.04] flex flex-col gap-4 bg-[#FBF9F4] dark:bg-[#151815] relative z-20 pb-12 sm:pb-6">
         <div className="flex items-center gap-3">
            <button aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleDarkMode} className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#1A1D1A] shadow-sm border border-black/[0.04] dark:border-white/[0.04] text-[#303630] dark:text-[#EDE9E0] transition-colors hover:bg-black/5 dark:hover:bg-white/5">
               {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>
            <ProfileDropdown email={props.userEmail || ""} isCollapsed={false} />
         </div>
         <div className="text-[10px] text-[#737B73] dark:text-[#8F998F] leading-[1.6] font-serif uppercase tracking-[0.1em] mt-2">
            Collect quietly.<br/>Find it when you need it.
         </div>
      </div>
    </aside>
  )
}