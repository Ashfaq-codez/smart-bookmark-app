'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext';

const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
const SmallXIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
const ChevronRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
const ChevronDown = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
const CollapseLeftIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>

interface SidebarProps {
  userEmail: string | null; handleSignOut: () => void; isMobileMenuOpen: boolean; setIsMobileMenuOpen: (isOpen: boolean) => void; activeFilter: string; setActiveFilter: (filter: string) => void; activeSubFilter: string | null; setActiveSubFilter: (subFilter: string | null) => void; getCounts: Record<string, number>; folderHierarchy: Record<string, string[]>; expandedFolders: Record<string, boolean>; toggleFolderExpand: (folder: string) => void; customCategories: string[]; handleDeleteCategory: (catToDelete: string) => void; handleDragOver: (e: React.DragEvent) => void; handleDrop: (e: React.DragEvent, targetCategory: string, targetSubCategory?: string) => void; creatingSubFor: string | null; setCreatingSubFor: (folder: string | null) => void; newSubfolderName: string; setNewSubfolderName: (name: string) => void; handleAddSubfolder: (parentFolder: string) => void; isAddingCategory: boolean; setIsAddingCategory: (isAdding: boolean) => void; newCategoryName: string; setNewCategoryName: (name: string) => void; handleAddCategory: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <aside className="w-full h-full flex flex-col bg-white dark:bg-[#0a0a0a] text-black dark:text-white border-r border-black dark:border-white transition-colors overflow-y-auto [&::-webkit-scrollbar]:w-0">
      
      <div className="flex flex-col flex-1">
        
        {/* HEADER */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-black dark:border-white">
          <h2 className="text-xs font-black tracking-widest uppercase">Index</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => props.setIsAddingCategory(!props.isAddingCategory)} className="text-black dark:text-white hover:text-[#ff0000] dark:hover:text-[#ff0000] transition-colors" title="New Folder">
              <PlusIcon />
            </button>
            <button onClick={() => props.setIsMobileMenuOpen(false)} className="md:hidden text-black dark:text-white hover:text-[#ff0000] transition-colors" title="Close">
              <CollapseLeftIcon />
            </button>
          </div>
        </div>

        {/* INPUT: NEW FOLDER */}
        {props.isAddingCategory && (
          <div className="border-b border-black dark:border-white">
            <input autoFocus type="text" placeholder="Directory Name" value={props.newCategoryName} onChange={(e) => props.setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddCategory()} className="w-full px-6 py-4 text-sm font-bold bg-gray-100 dark:bg-[#111] outline-none text-black dark:text-white uppercase placeholder-gray-400" />
          </div>
        )}

        {/* ALL BOOKMARKS */}
        <div
          onClick={() => { props.setActiveFilter('All'); props.setActiveSubFilter(null); props.setIsMobileMenuOpen(false); }}
          className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-all border-b border-black dark:border-white ${props.activeFilter === 'All' ? 'bg-[#ff0000] text-white' : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'}`}
        >
          <span className="text-xs font-bold uppercase tracking-wider">All Entities</span>
          <span className="text-[10px] font-mono">{props.getCounts['All'] || 0}</span>
        </div>

        {/* DIRECTORY TREE */}
        {Object.keys(props.folderHierarchy).map(parentFolder => {
          const isParentActive = props.activeFilter === parentFolder;
          const isExpanded = props.expandedFolders[parentFolder];
          const subfolders = props.folderHierarchy[parentFolder];

          return (
            <div key={parentFolder} className="flex flex-col border-b border-black dark:border-white">
              <div
                onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder)}
                onClick={() => { props.setActiveFilter(parentFolder); props.setActiveSubFilter(null); props.toggleFolderExpand(parentFolder); }}
                className={`group flex items-center justify-between px-6 py-4 cursor-pointer transition-all ${isParentActive && !props.activeSubFilter ? 'bg-[#ff0000] text-white' : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <div className="w-4">{isExpanded ? <ChevronDown /> : <ChevronRight />}</div>
                  <span className="text-xs font-bold uppercase truncate tracking-wider">{parentFolder}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono">{props.getCounts[parentFolder] || 0}</span>
                  {props.customCategories.includes(parentFolder) && (
                    <button onClick={(e) => { e.stopPropagation(); props.handleDeleteCategory(parentFolder); }} className="opacity-0 group-hover:opacity-100 hover:text-white dark:hover:text-black">
                      <SmallXIcon />
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="flex flex-col bg-gray-50 dark:bg-[#111]">
                  {subfolders.map(sub => {
                    const isSubActive = isParentActive && props.activeSubFilter === sub;
                    return (
                      <div key={sub} onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder, sub)} onClick={(e) => { e.stopPropagation(); props.setActiveFilter(parentFolder); props.setActiveSubFilter(sub); props.setIsMobileMenuOpen(false); }} className={`flex items-center justify-between px-6 py-3 text-[11px] cursor-pointer transition-all border-t border-black/10 dark:border-white/10 ${isSubActive ? 'bg-black text-white dark:bg-white dark:text-black font-bold' : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'}`}>
                        <span className="truncate uppercase ml-7">{sub}</span>
                        <span className="text-[9px] font-mono">{props.getCounts[`${parentFolder}::${sub}`] || 0}</span>
                      </div>
                    )
                  })}
                  {props.creatingSubFor === parentFolder ? (
                    <div className="flex items-center border-t border-black/10 dark:border-white/10">
                      <input autoFocus type="text" placeholder="Sub-directory" value={props.newSubfolderName} onChange={(e) => props.setNewSubfolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddSubfolder(parentFolder)} className="w-full px-6 py-3 text-[11px] font-bold uppercase bg-transparent outline-none ml-7" />
                      <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(null); }} className="px-4 text-[#ff0000]"><SmallXIcon /></button>
                    </div>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(parentFolder); }} className="w-full flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black dark:hover:text-white transition-colors border-t border-black/10 dark:border-white/10">
                      <PlusIcon /> Add Sub
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* MOBILE PROFILE (BOTTOM) */}
      <div className="md:hidden mt-auto border-t border-black dark:border-white">
        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Session</span>
            <span className="text-sm font-black uppercase truncate mt-1">{props.userEmail}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest">Invert Theme</span>
            <button onClick={toggleDarkMode} className={`w-10 h-5 border border-current transition-colors relative flex items-center p-0.5 ${isDarkMode ? 'justify-end bg-white' : 'justify-start bg-black'}`}>
              <div className={`w-3 h-3 ${isDarkMode ? 'bg-black' : 'bg-white'}`} />
            </button>
          </div>
          <button onClick={props.handleSignOut} className="w-full py-3 bg-[#ff0000] text-white font-bold text-xs uppercase tracking-widest">Terminate</button>
        </div>
      </div>
    </aside>
  )
}