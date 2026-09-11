'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext';

const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
const SmallXIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
const ChevronRight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
const ChevronDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>

interface SidebarProps {
  userEmail: string | null; handleSignOut: () => void; isMobileMenuOpen: boolean; setIsMobileMenuOpen: (isOpen: boolean) => void; activeFilter: string; setActiveFilter: (filter: string) => void; activeSubFilter: string | null; setActiveSubFilter: (subFilter: string | null) => void; getCounts: Record<string, number>; folderHierarchy: Record<string, string[]>; expandedFolders: Record<string, boolean>; toggleFolderExpand: (folder: string) => void; customCategories: string[]; handleDeleteCategory: (catToDelete: string) => void; handleDragOver: (e: React.DragEvent) => void; handleDrop: (e: React.DragEvent, targetCategory: string, targetSubCategory?: string) => void; creatingSubFor: string | null; setCreatingSubFor: (folder: string | null) => void; newSubfolderName: string; setNewSubfolderName: (name: string) => void; handleAddSubfolder: (parentFolder: string) => void; isAddingCategory: boolean; setIsAddingCategory: (isAdding: boolean) => void; newCategoryName: string; setNewCategoryName: (name: string) => void; handleAddCategory: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <aside className="w-full h-full flex flex-col p-4 sm:p-5 overflow-y-auto bg-white/40 dark:bg-[#151c28]/40 transition-colors [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#a9cbed]">
      <div className="bg-white/80 dark:bg-[#1a2332]/80 backdrop-blur-md border border-white/80 dark:border-[#2a3f5a] shadow-[0_4px_10px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] rounded flex flex-col overflow-hidden">
        
        <div className="bg-gradient-to-b from-[#eaf2f9] to-[#d1e2f3] dark:from-[#213045] dark:to-[#1a2332] border-b border-[#a9cbed] dark:border-[#2a3f5a] px-3 py-1.5 flex items-center justify-between">
          <h2 className="text-[10px] font-mono text-[#4a6b8c] dark:text-[#8ea4bd] tracking-widest uppercase">++ nav.tree //</h2>
          <div className="flex items-center gap-1.5">
            <button onClick={() => props.setIsAddingCategory(!props.isAddingCategory)} className="p-0.5 rounded text-[#5e81a5] hover:text-[#2c4054] transition-colors" title="New Folder"><PlusIcon /></button>
            <button onClick={() => props.setIsMobileMenuOpen(false)} className="md:hidden p-0.5 text-[#5e81a5]"><SmallXIcon /></button>
          </div>
        </div>

        <div className="p-3 flex flex-col gap-1">
          {props.isAddingCategory && (
            <div className="mb-2">
              <input autoFocus type="text" placeholder="dir_name..." value={props.newCategoryName} onChange={(e) => props.setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddCategory()} className="w-full px-2 py-1.5 text-xs font-sans bg-[#f2f7fc] dark:bg-[#0d1620] border border-[#a9cbed] dark:border-[#3a526b] rounded-sm outline-none text-[#2c4054] dark:text-gray-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus:border-[#609ad3]" />
            </div>
          )}

          <div
            onClick={() => { props.setActiveFilter('All'); props.setActiveSubFilter(null); props.setIsMobileMenuOpen(false); }}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-sm cursor-pointer transition-all ${props.activeFilter === 'All' ? 'bg-[#e1eef9] dark:bg-[#2a3f5a] text-[#315174] dark:text-white border border-[#a9cbed] dark:border-[#4a6b8c] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]' : 'bg-transparent text-[#5e81a5] hover:bg-[#f2f7fc] dark:hover:bg-[#1a2332] border border-transparent'}`}
          >
            <span className="font-sans text-xs font-medium">All Bookmarks</span>
            <span className="text-[9px] font-mono text-[#4a6b8c]">{props.getCounts['All'] || 0}</span>
          </div>

          {Object.keys(props.folderHierarchy).map(parentFolder => {
            const isParentActive = props.activeFilter === parentFolder;
            const isExpanded = props.expandedFolders[parentFolder];
            const subfolders = props.folderHierarchy[parentFolder];

            return (
              <div key={parentFolder} className="flex flex-col gap-0.5">
                <div
                  onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder)}
                  onClick={() => { props.setActiveFilter(parentFolder); props.setActiveSubFilter(null); props.toggleFolderExpand(parentFolder); }}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-sm cursor-pointer transition-all ${isParentActive && !props.activeSubFilter ? 'bg-[#e1eef9] dark:bg-[#2a3f5a] text-[#315174] dark:text-white border border-[#a9cbed] dark:border-[#4a6b8c] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]' : 'bg-transparent text-[#5e81a5] hover:bg-[#f2f7fc] dark:hover:bg-[#1a2332] border border-transparent'}`}
                >
                  <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                    <div className="text-[#8ea4bd]">{isExpanded ? <ChevronDown /> : <ChevronRight />}</div>
                    <span className="font-sans text-xs font-medium truncate">{parentFolder}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-mono text-[#4a6b8c]">{props.getCounts[parentFolder] || 0}</span>
                    {props.customCategories.includes(parentFolder) && (
                      <button onClick={(e) => { e.stopPropagation(); props.handleDeleteCategory(parentFolder); }} className="opacity-0 group-hover:opacity-100 text-[#8ea4bd] hover:text-[#c53030]">
                        <SmallXIcon />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-4 pl-2 border-l border-[#c3d7eb] dark:border-[#3a526b] flex flex-col py-1">
                    {subfolders.map(sub => {
                      const isSubActive = isParentActive && props.activeSubFilter === sub;
                      return (
                        <div key={sub} onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder, sub)} onClick={(e) => { e.stopPropagation(); props.setActiveFilter(parentFolder); props.setActiveSubFilter(sub); props.setIsMobileMenuOpen(false); }} className={`flex items-center justify-between px-2.5 py-1 text-xs rounded-sm cursor-pointer transition-all ${isSubActive ? 'text-[#315174] dark:text-white font-semibold' : 'hover:bg-[#f2f7fc] dark:hover:bg-[#1a2332] text-[#5e81a5] font-medium'}`}>
                          <span className="truncate">{sub}</span>
                          <span className="text-[9px] font-mono text-[#8ea4bd]">{props.getCounts[`${parentFolder}::${sub}`] || 0}</span>
                        </div>
                      )
                    })}

                    {props.creatingSubFor === parentFolder ? (
                      <div className="flex gap-1 mt-1 pl-2">
                        <input autoFocus type="text" placeholder="sub_dir..." value={props.newSubfolderName} onChange={(e) => props.setNewSubfolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddSubfolder(parentFolder)} className="w-full px-1.5 py-1 text-[10px] font-sans bg-[#f2f7fc] dark:bg-[#0d1620] border border-[#a9cbed] dark:border-[#3a526b] rounded-sm outline-none text-[#2c4054] dark:text-gray-300" />
                        <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(null); }} className="px-1 text-[#8ea4bd] hover:text-[#2c4054]"><SmallXIcon /></button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(parentFolder); }} className="flex items-center gap-1.5 pl-2 mt-1 text-[9px] font-mono uppercase tracking-widest text-[#8ea4bd] hover:text-[#4a6b8c] transition-colors">
                        <PlusIcon /> Sub
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* MOBILE PROFILE BLOCK */}
      <div className="md:hidden mt-auto pt-6 flex flex-col gap-4 pb-4">
        <div className="bg-white/80 dark:bg-[#1a2332]/80 backdrop-blur-md border border-white/80 dark:border-[#2a3f5a] rounded flex flex-col shadow-sm">
          <div className="bg-gradient-to-b from-[#eaf2f9] to-[#d1e2f3] dark:from-[#213045] dark:to-[#1a2332] border-b border-[#a9cbed] dark:border-[#2a3f5a] px-3 py-1.5">
            <span className="text-[10px] font-mono text-[#4a6b8c] tracking-widest uppercase">++ user.session //</span>
          </div>
          <div className="p-3 flex flex-col gap-3">
            <span className="text-xs font-sans font-medium text-[#2c4054] dark:text-gray-300 truncate">{props.userEmail}</span>
            <div className="flex items-center justify-between border-t border-[#eaf2f9] dark:border-[#2a3f5a] pt-2">
              <span className="text-[9px] font-mono uppercase text-[#5e81a5]">Theme</span>
              <button onClick={toggleDarkMode} className={`w-8 h-4 rounded-full transition-colors relative flex items-center p-0.5 border ${isDarkMode ? 'bg-[#315174] border-[#2a3f5a]' : 'bg-[#e1eef9] border-[#a9cbed]'}`}>
                <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
            <button onClick={props.handleSignOut} className="w-full py-1.5 mt-1 bg-gradient-to-b from-[#fdf2f3] to-[#fadadd] border border-[#f1aab0] text-[#c53030] font-mono text-[9px] uppercase rounded shadow-[inset_0_1px_0_rgba(255,255,255,1)]">Terminate</button>
          </div>
        </div>
      </div>
    </aside>
  )
}