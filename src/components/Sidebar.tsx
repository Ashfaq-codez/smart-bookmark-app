'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext';

const PlusIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
const SmallXIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
const ChevronRight = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
const ChevronDown = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>

interface SidebarProps {
  userEmail: string | null; handleSignOut: () => void; isMobileMenuOpen: boolean; setIsMobileMenuOpen: (isOpen: boolean) => void; activeFilter: string; setActiveFilter: (filter: string) => void; activeSubFilter: string | null; setActiveSubFilter: (subFilter: string | null) => void; getCounts: Record<string, number>; folderHierarchy: Record<string, string[]>; expandedFolders: Record<string, boolean>; toggleFolderExpand: (folder: string) => void; customCategories: string[]; handleDeleteCategory: (catToDelete: string) => void; handleDragOver: (e: React.DragEvent) => void; handleDrop: (e: React.DragEvent, targetCategory: string, targetSubCategory?: string) => void; creatingSubFor: string | null; setCreatingSubFor: (folder: string | null) => void; newSubfolderName: string; setNewSubfolderName: (name: string) => void; handleAddSubfolder: (parentFolder: string) => void; isAddingCategory: boolean; setIsAddingCategory: (isAdding: boolean) => void; newCategoryName: string; setNewCategoryName: (name: string) => void; handleAddCategory: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <aside className="w-full h-full flex flex-col p-6 sm:p-8 overflow-y-auto bg-white dark:bg-[#0c0c0c] transition-colors [&::-webkit-scrollbar]:w-0">
      <div className="flex flex-col space-y-8">
        
        <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Library</h2>
          <button onClick={() => props.setIsMobileMenuOpen(false)} className="md:hidden p-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 rounded-full">
            <SmallXIcon />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div
            onClick={() => { props.setActiveFilter('All'); props.setActiveSubFilter(null); props.setIsMobileMenuOpen(false); }}
            className={`flex items-center justify-between px-6 py-4 rounded-3xl cursor-pointer transition-all ${props.activeFilter === 'All' ? 'bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white shadow-xl shadow-fuchsia-500/20' : 'bg-gray-50 dark:bg-[#111] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]'}`}
          >
            <span className="font-black text-sm uppercase tracking-widest">All Bookmarks</span>
            <span className={`text-[11px] font-black px-3 py-1.5 rounded-full ${props.activeFilter === 'All' ? 'bg-white/20 text-white' : 'bg-white dark:bg-black text-gray-500'}`}>
              {props.getCounts['All'] || 0}
            </span>
          </div>

          {Object.keys(props.folderHierarchy).map(parentFolder => {
            const isParentActive = props.activeFilter === parentFolder;
            const isExpanded = props.expandedFolders[parentFolder];
            const subfolders = props.folderHierarchy[parentFolder];

            return (
              <div key={parentFolder} className="flex flex-col gap-2">
                <div
                  onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder)}
                  onClick={() => { props.setActiveFilter(parentFolder); props.setActiveSubFilter(null); props.toggleFolderExpand(parentFolder); }}
                  className={`group flex items-center justify-between px-6 py-4 rounded-3xl cursor-pointer transition-all ${isParentActive && !props.activeSubFilter ? 'bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white shadow-xl shadow-fuchsia-500/20' : 'bg-gray-50 dark:bg-[#111] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]'}`}
                >
                  <div className="flex items-center gap-4 overflow-hidden flex-1">
                    <div className="opacity-60">{isExpanded ? <ChevronDown /> : <ChevronRight />}</div>
                    <span className="font-black text-sm uppercase truncate tracking-widest">{parentFolder}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] font-black px-3 py-1.5 rounded-full ${isParentActive && !props.activeSubFilter ? 'bg-white/20 text-white' : 'bg-white dark:bg-black text-gray-500'}`}>
                      {props.getCounts[parentFolder] || 0}
                    </span>
                    {props.customCategories.includes(parentFolder) && (
                      <button onClick={(e) => { e.stopPropagation(); props.handleDeleteCategory(parentFolder); }} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400">
                        <SmallXIcon />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-8 pl-6 border-l-2 border-gray-200 dark:border-gray-800 flex flex-col gap-2 py-2">
                    {subfolders.map(sub => {
                      const isSubActive = isParentActive && props.activeSubFilter === sub;
                      return (
                        <div key={sub} onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder, sub)} onClick={(e) => { e.stopPropagation(); props.setActiveFilter(parentFolder); props.setActiveSubFilter(sub); props.setIsMobileMenuOpen(false); }} className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all ${isSubActive ? 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 font-black' : 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 font-bold'}`}>
                          <span className="truncate uppercase text-xs tracking-widest">{sub}</span>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${isSubActive ? 'bg-fuchsia-200 dark:bg-fuchsia-900/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                            {props.getCounts[`${parentFolder}::${sub}`] || 0}
                          </span>
                        </div>
                      )
                    })}

                    {props.creatingSubFor === parentFolder ? (
                      <div className="flex gap-2 mt-2">
                        <input autoFocus type="text" placeholder="Name..." value={props.newSubfolderName} onChange={(e) => props.setNewSubfolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddSubfolder(parentFolder)} className="w-full px-4 py-3 text-sm font-bold uppercase rounded-xl outline-none bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white" />
                        <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(null); }} className="px-4 bg-gray-200 dark:bg-gray-800 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white font-black"><SmallXIcon /></button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(parentFolder); }} className="flex items-center gap-3 px-4 py-3 mt-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-fuchsia-500 transition-colors rounded-2xl hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/10">
                        <PlusIcon /> Subfolder
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="pt-8">
          {props.isAddingCategory ? (
            <input autoFocus type="text" placeholder="FOLDER NAME..." value={props.newCategoryName} onChange={(e) => props.setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddCategory()} className="w-full px-6 py-5 text-sm font-black uppercase tracking-widest bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white rounded-3xl outline-none" />
          ) : (
            <button onClick={() => props.setIsAddingCategory(true)} className="w-full flex items-center justify-center gap-3 px-6 py-5 text-sm font-black uppercase tracking-widest border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl text-gray-500 hover:border-fuchsia-500 hover:text-fuchsia-500 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/10 transition-all cursor-pointer">
              <PlusIcon /> New Folder
            </button>
          )}
        </div>
      </div>

      {/* MOBILE PROFILE BLOCK */}
      <div className="md:hidden mt-auto pt-10 flex flex-col gap-4">
        <div className="p-6 bg-gray-50 dark:bg-[#111] rounded-3xl flex flex-col gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Signed In</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white truncate mt-1">{props.userEmail}</span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-4">
            <span className="text-xs font-black uppercase text-gray-900 dark:text-white tracking-widest">Dark Mode</span>
            <button onClick={toggleDarkMode} className={`w-14 h-8 rounded-full transition-colors relative flex items-center p-1 ${isDarkMode ? 'bg-fuchsia-500' : 'bg-gray-300'}`}>
              <div className={`w-6 h-6 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <button onClick={props.handleSignOut} className="w-full py-4 mt-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-black uppercase tracking-widest text-xs rounded-2xl cursor-pointer transition-colors">Sign Out</button>
        </div>
      </div>
    </aside>
  )
}