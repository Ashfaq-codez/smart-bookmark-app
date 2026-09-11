'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext';

const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
const SmallXIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
const ChevronRight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
const ChevronDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
const CollapseLeftIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>

interface SidebarProps {
  userEmail: string | null; handleSignOut: () => void; isMobileMenuOpen: boolean; setIsMobileMenuOpen: (isOpen: boolean) => void; activeFilter: string; setActiveFilter: (filter: string) => void; activeSubFilter: string | null; setActiveSubFilter: (subFilter: string | null) => void; getCounts: Record<string, number>; folderHierarchy: Record<string, string[]>; expandedFolders: Record<string, boolean>; toggleFolderExpand: (folder: string) => void; customCategories: string[]; handleDeleteCategory: (catToDelete: string) => void; handleDragOver: (e: React.DragEvent) => void; handleDrop: (e: React.DragEvent, targetCategory: string, targetSubCategory?: string) => void; creatingSubFor: string | null; setCreatingSubFor: (folder: string | null) => void; newSubfolderName: string; setNewSubfolderName: (name: string) => void; handleAddSubfolder: (parentFolder: string) => void; isAddingCategory: boolean; setIsAddingCategory: (isAdding: boolean) => void; newCategoryName: string; setNewCategoryName: (name: string) => void; handleAddCategory: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <aside className="w-full h-full flex flex-col p-3 sm:p-5 overflow-y-auto bg-transparent transition-colors [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#a9cbed] dark:[&::-webkit-scrollbar-thumb]:bg-[#3a526b]">
      
      {/* ─── DIRECTORY TREE WINDOW PANEL ─── */}
      <div className="bg-white/70 dark:bg-[#080d14]/60 backdrop-blur-md border border-white/80 dark:border-[#2a3f5a] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col overflow-hidden mb-6">
        
        {/* Glossy Header with Built-In Controls */}
        <div className="bg-gradient-to-b from-[#eaf2f9]/90 to-[#d1e2f3]/90 dark:from-[#1a2536]/90 dark:to-[#111824]/90 border-b border-[#a9cbed] dark:border-[#2a3f5a] px-3 py-2 flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-none">
          <h2 className="text-[10px] font-mono text-[#4a6b8c] dark:text-[#5e81a5] tracking-widest uppercase drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] dark:drop-shadow-none">++ nav.tree //</h2>
          <div className="flex items-center gap-1.5">
            <button onClick={() => props.setIsAddingCategory(!props.isAddingCategory)} className="p-1 rounded text-[#5e81a5] dark:text-[#8ea4bd] hover:text-[#2c4054] dark:hover:text-white transition-colors cursor-pointer bg-white/50 dark:bg-black/30 border border-transparent hover:border-[#a9cbed] dark:hover:border-[#3a526b] shadow-sm" title="New Folder">
              <PlusIcon />
            </button>
            {/* Desktop & Mobile Close Panel Button */}
            <button onClick={() => props.setIsMobileMenuOpen(false)} className="p-1 rounded text-[#5e81a5] dark:text-[#8ea4bd] hover:bg-white/50 hover:text-[#2c4054] dark:hover:bg-black/30 dark:hover:text-white transition-colors cursor-pointer border border-transparent hover:border-[#a9cbed] dark:hover:border-[#3a526b] shadow-sm" title="Close Panel">
              <CollapseLeftIcon />
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="p-2.5 flex flex-col gap-1.5">
          {props.isAddingCategory && (
            <div className="mb-2">
              <input autoFocus type="text" placeholder="dir_name..." value={props.newCategoryName} onChange={(e) => props.setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddCategory()} className="w-full px-3 py-2 text-xs font-sans bg-[#f8fbff] dark:bg-[#050b14] border border-[#a9cbed] dark:border-[#3a526b] rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] outline-none text-[#2c4054] dark:text-gray-300 focus:border-[#609ad3] transition-all" />
            </div>
          )}

          <div
            onClick={() => { props.setActiveFilter('All'); props.setActiveSubFilter(null); props.setIsMobileMenuOpen(false); }}
            className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-all ${props.activeFilter === 'All' ? 'bg-gradient-to-b from-[#f2f7fc] to-[#dae8f5] dark:from-[#213045] dark:to-[#151c28] text-[#315174] dark:text-white border border-[#a9cbed] dark:border-[#3a526b] shadow-[0_2px_4px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' : 'bg-transparent text-[#5e81a5] hover:bg-white/40 dark:hover:bg-[#1a2332]/40 border border-transparent'}`}
          >
            <span className="font-sans text-xs font-bold truncate">All Records</span>
            <span className="text-[9px] font-mono text-[#4a6b8c] dark:text-[#8ea4bd]">{props.getCounts['All'] || 0}</span>
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
                  className={`group flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-all ${isParentActive && !props.activeSubFilter ? 'bg-gradient-to-b from-[#f2f7fc] to-[#dae8f5] dark:from-[#213045] dark:to-[#151c28] text-[#315174] dark:text-white border border-[#a9cbed] dark:border-[#3a526b] shadow-[0_2px_4px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' : 'bg-transparent text-[#5e81a5] hover:bg-white/40 dark:hover:bg-[#1a2332]/40 border border-transparent'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <div className="text-[#8ea4bd] dark:text-[#4a6b8c] drop-shadow-[0_1px_0_rgba(255,255,255,0.5)] dark:drop-shadow-none">
                      {isExpanded ? <ChevronDown /> : <ChevronRight />}
                    </div>
                    <span className="font-sans text-xs font-semibold truncate">{parentFolder}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-mono text-[#4a6b8c] dark:text-[#8ea4bd]">{props.getCounts[parentFolder] || 0}</span>
                    {props.customCategories.includes(parentFolder) && (
                      <button onClick={(e) => { e.stopPropagation(); props.handleDeleteCategory(parentFolder); }} className="opacity-0 group-hover:opacity-100 text-[#8ea4bd] hover:text-[#c53030] dark:hover:text-[#f87171] transition-opacity">
                        <SmallXIcon />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-5 pl-3 border-l border-[#c3d7eb] dark:border-[#2a3f5a] flex flex-col py-1 gap-0.5">
                    {subfolders.map(sub => {
                      const isSubActive = isParentActive && props.activeSubFilter === sub;
                      return (
                        <div key={sub} onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder, sub)} onClick={(e) => { e.stopPropagation(); props.setActiveFilter(parentFolder); props.setActiveSubFilter(sub); props.setIsMobileMenuOpen(false); }} className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded cursor-pointer transition-all ${isSubActive ? 'bg-white/80 dark:bg-[#1a2332] text-[#315174] dark:text-white font-semibold shadow-sm border border-[#e1eef9] dark:border-[#3a526b]' : 'hover:bg-white/40 dark:hover:bg-[#151c28] text-[#5e81a5] font-medium border border-transparent'}`}>
                          <span className="truncate">{sub}</span>
                          <span className="text-[9px] font-mono text-[#8ea4bd]">{props.getCounts[`${parentFolder}::${sub}`] || 0}</span>
                        </div>
                      )
                    })}
                    {props.creatingSubFor === parentFolder ? (
                      <div className="flex gap-1.5 mt-1.5">
                        <input autoFocus type="text" placeholder="sub_dir..." value={props.newSubfolderName} onChange={(e) => props.setNewSubfolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddSubfolder(parentFolder)} className="w-full px-2 py-1.5 text-[10px] font-sans bg-[#f8fbff] dark:bg-[#050b14] border border-[#a9cbed] dark:border-[#3a526b] rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] outline-none text-[#2c4054] dark:text-gray-300 focus:border-[#609ad3]" />
                        <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(null); }} className="px-1.5 text-[#8ea4bd] hover:text-[#c53030] dark:hover:text-[#f87171]"><SmallXIcon /></button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(parentFolder); }} className="flex items-center gap-1.5 px-2 mt-1.5 text-[9px] font-mono uppercase tracking-widest text-[#8ea4bd] hover:text-[#2c4054] dark:hover:text-white transition-colors w-max">
                        <PlusIcon /> Sub_Dir
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
      <div className="md:hidden mt-auto pt-6 flex flex-col pb-4">
        <div className="bg-white/80 dark:bg-[#080d14]/80 backdrop-blur-md border border-white/80 dark:border-[#2a3f5a] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] flex flex-col overflow-hidden">
          <div className="bg-gradient-to-b from-[#eaf2f9]/90 to-[#d1e2f3]/90 dark:from-[#1a2536]/90 dark:to-[#111824]/90 border-b border-[#a9cbed] dark:border-[#2a3f5a] px-4 py-2.5">
            <span className="text-[10px] font-mono text-[#4a6b8c] dark:text-[#5e81a5] tracking-widest uppercase">++ user.session //</span>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <span className="text-xs font-sans font-bold text-[#2c4054] dark:text-gray-200 truncate">{props.userEmail}</span>
            <div className="flex items-center justify-between border-t border-[#eaf2f9] dark:border-[#1a2536] pt-3">
              <span className="text-[10px] font-mono uppercase text-[#5e81a5] dark:text-[#8ea4bd]">UI.Theme</span>
              <button onClick={toggleDarkMode} className={`w-9 h-5 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] transition-colors relative flex items-center p-0.5 border ${isDarkMode ? 'bg-[#315174] border-[#2a3f5a]' : 'bg-[#e1eef9] border-[#a9cbed]'}`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
            <button onClick={props.handleSignOut} className="w-full py-2.5 mt-2 bg-gradient-to-b from-[#fdf2f3] to-[#fadadd] dark:from-[#3b1515] dark:to-[#2a0e0e] border border-[#f1aab0] dark:border-[#7f1d1d] text-[#c53030] dark:text-[#f87171] font-mono text-[10px] uppercase tracking-widest rounded shadow-[0_2px_4px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] cursor-pointer">Terminate</button>
          </div>
        </div>
      </div>
    </aside>
  )
}