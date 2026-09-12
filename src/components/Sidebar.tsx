'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext';

const PlusIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 5v14M5 12h14"/></svg>
const SmallXIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6L6 18M6 6l12 12"/></svg>
const ChevronRight = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M9 18l6-6-6-6"/></svg>
const ChevronDown = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M6 9l6 6 6-6"/></svg>
const CollapseLeftIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M15 18l-6-6 6-6"/></svg>

interface SidebarProps {
  userEmail: string | null; handleSignOut: () => void; isMobileMenuOpen: boolean; setIsMobileMenuOpen: (isOpen: boolean) => void; activeFilter: string; setActiveFilter: (filter: string) => void; activeSubFilter: string | null; setActiveSubFilter: (subFilter: string | null) => void; getCounts: Record<string, number>; folderHierarchy: Record<string, string[]>; expandedFolders: Record<string, boolean>; toggleFolderExpand: (folder: string) => void; customCategories: string[]; handleDeleteCategory: (catToDelete: string) => void; handleDragOver: (e: React.DragEvent) => void; handleDrop: (e: React.DragEvent, targetCategory: string, targetSubCategory?: string) => void; creatingSubFor: string | null; setCreatingSubFor: (folder: string | null) => void; newSubfolderName: string; setNewSubfolderName: (name: string) => void; handleAddSubfolder: (parentFolder: string) => void; isAddingCategory: boolean; setIsAddingCategory: (isAdding: boolean) => void; newCategoryName: string; setNewCategoryName: (name: string) => void; handleAddCategory: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <aside className="w-full h-full flex flex-col p-4 sm:p-6 overflow-y-auto bg-transparent transition-colors [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-black dark:[&::-webkit-scrollbar-thumb]:bg-white">
      
      <div className="bg-white dark:bg-black border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] flex flex-col overflow-hidden mb-8 rounded-none">
        
        <div className="bg-cyan-400 dark:bg-yellow-400 border-b-4 border-black dark:border-white px-4 py-3 flex items-center justify-between">
          <h2 className="text-[12px] font-black text-black tracking-widest uppercase">DIRECTORIES</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => props.setIsAddingCategory(!props.isAddingCategory)} className="p-1 bg-white border-4 border-black text-black hover:bg-black hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none" title="New Folder">
              <PlusIcon />
            </button>
            <button onClick={() => props.setIsMobileMenuOpen(false)} className="p-1 bg-red-500 border-4 border-black text-black hover:bg-black hover:text-red-500 transition-colors cursor-pointer shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none" title="Close Panel">
              <CollapseLeftIcon />
            </button>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-2 bg-white dark:bg-black">
          {props.isAddingCategory && (
            <div className="mb-4">
              <input autoFocus type="text" placeholder="DIR_NAME" value={props.newCategoryName} onChange={(e) => props.setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddCategory()} className="w-full px-4 py-3 text-sm font-black bg-white dark:bg-black border-4 border-black dark:border-white outline-none text-black dark:text-white focus:bg-yellow-400 dark:focus:bg-cyan-400 focus:text-black transition-colors uppercase placeholder-gray-400" />
            </div>
          )}

          <div
            onClick={() => { props.setActiveFilter('All'); props.setActiveSubFilter(null); props.setIsMobileMenuOpen(false); }}
            className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all border-4 ${props.activeFilter === 'All' ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-none translate-x-[4px] translate-y-[4px]' : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-yellow-400 dark:hover:bg-cyan-400 hover:text-black shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]'}`}
          >
            <span className="font-sans text-sm font-black uppercase tracking-wider truncate">ALL_RECORDS</span>
            <span className={`text-[11px] font-black px-2 py-1 border-2 ${props.activeFilter === 'All' ? 'border-white dark:border-black' : 'border-black dark:border-white'}`}>{props.getCounts['All'] || 0}</span>
          </div>

          {Object.keys(props.folderHierarchy).map(parentFolder => {
            const isParentActive = props.activeFilter === parentFolder;
            const isExpanded = props.expandedFolders[parentFolder];
            const subfolders = props.folderHierarchy[parentFolder];

            return (
              <div key={parentFolder} className="flex flex-col gap-2 mt-2">
                <div
                  onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder)}
                  onClick={() => { props.setActiveFilter(parentFolder); props.setActiveSubFilter(null); props.toggleFolderExpand(parentFolder); }}
                  className={`group flex items-center justify-between px-4 py-3 cursor-pointer transition-all border-4 ${isParentActive && !props.activeSubFilter ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-none translate-x-[4px] translate-y-[4px]' : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-yellow-400 dark:hover:bg-cyan-400 hover:text-black shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="text-current">
                      {isExpanded ? <ChevronDown /> : <ChevronRight />}
                    </div>
                    <span className="font-sans text-sm font-black uppercase truncate">{parentFolder}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-black px-2 py-1 border-2 ${isParentActive && !props.activeSubFilter ? 'border-white dark:border-black' : 'border-black dark:border-white'}`}>{props.getCounts[parentFolder] || 0}</span>
                    {props.customCategories.includes(parentFolder) && (
                      <button onClick={(e) => { e.stopPropagation(); props.handleDeleteCategory(parentFolder); }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500 hover:text-black border-2 border-red-500 hover:border-black transition-colors p-0.5">
                        <SmallXIcon />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-6 pl-4 border-l-4 border-black dark:border-white flex flex-col py-2 gap-2">
                    {subfolders.map(sub => {
                      const isSubActive = isParentActive && props.activeSubFilter === sub;
                      return (
                        <div key={sub} onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder, sub)} onClick={(e) => { e.stopPropagation(); props.setActiveFilter(parentFolder); props.setActiveSubFilter(sub); props.setIsMobileMenuOpen(false); }} className={`flex items-center justify-between px-3 py-2 text-xs border-4 cursor-pointer transition-all ${isSubActive ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'bg-transparent text-black dark:text-white border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'}`}>
                          <span className="truncate font-black uppercase">{sub}</span>
                          <span className="text-[10px] font-black border-2 border-current px-1">{props.getCounts[`${parentFolder}::${sub}`] || 0}</span>
                        </div>
                      )
                    })}
                    {props.creatingSubFor === parentFolder ? (
                      <div className="flex gap-2 mt-2">
                        <input autoFocus type="text" placeholder="SUB_DIR" value={props.newSubfolderName} onChange={(e) => props.setNewSubfolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddSubfolder(parentFolder)} className="w-full px-3 py-2 text-xs font-black bg-white dark:bg-black border-4 border-black dark:border-white outline-none text-black dark:text-white uppercase focus:bg-yellow-400 dark:focus:bg-cyan-400 focus:text-black" />
                        <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(null); }} className="px-2 bg-red-500 text-black border-4 border-black hover:bg-black hover:text-red-500"><SmallXIcon /></button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(parentFolder); }} className="flex items-center gap-2 px-3 py-2 mt-2 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-black text-black dark:text-white border-4 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors w-max">
                        <PlusIcon /> ADD_SUB
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
        <div className="bg-white dark:bg-black border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] flex flex-col overflow-hidden rounded-none">
          <div className="bg-yellow-400 dark:bg-cyan-400 border-b-4 border-black dark:border-white px-4 py-3">
            <span className="text-[10px] font-black text-black tracking-widest uppercase">SYS.SESSION</span>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <span className="text-sm font-black text-black dark:text-white truncate">{props.userEmail}</span>
            <div className="flex items-center justify-between border-t-4 border-black dark:border-white pt-4 mt-2">
              <span className="text-[11px] font-black uppercase text-black dark:text-white tracking-widest">INVERT_THEME</span>
              <button onClick={toggleDarkMode} className={`w-12 h-6 border-4 border-black dark:border-white transition-colors relative flex items-center p-0.5 ${isDarkMode ? 'bg-cyan-400' : 'bg-yellow-400'}`}>
                <div className={`w-4 h-4 bg-black dark:bg-white transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <button onClick={props.handleSignOut} className="w-full py-4 mt-4 bg-red-500 border-4 border-black dark:border-white text-black font-black text-[12px] uppercase tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] dark:hover:shadow-[2px_2px_0_0_#fff] transition-all cursor-pointer">TERMINATE</button>
          </div>
        </div>
      </div>
    </aside>
  )
}