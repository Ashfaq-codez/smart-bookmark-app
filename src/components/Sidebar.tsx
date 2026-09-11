'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext';

const PlusIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
const SmallXIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
const ChevronRight = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
const ChevronDown = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>

interface SidebarProps {
  userEmail: string | null; handleSignOut: () => void; isMobileMenuOpen: boolean; setIsMobileMenuOpen: (isOpen: boolean) => void; activeFilter: string; setActiveFilter: (filter: string) => void; activeSubFilter: string | null; setActiveSubFilter: (subFilter: string | null) => void; getCounts: Record<string, number>; folderHierarchy: Record<string, string[]>; expandedFolders: Record<string, boolean>; toggleFolderExpand: (folder: string) => void; customCategories: string[]; handleDeleteCategory: (catToDelete: string) => void; handleDragOver: (e: React.DragEvent) => void; handleDrop: (e: React.DragEvent, targetCategory: string, targetSubCategory?: string) => void; creatingSubFor: string | null; setCreatingSubFor: (folder: string | null) => void; newSubfolderName: string; setNewSubfolderName: (name: string) => void; handleAddSubfolder: (parentFolder: string) => void; isAddingCategory: boolean; setIsAddingCategory: (isAdding: boolean) => void; newCategoryName: string; setNewCategoryName: (name: string) => void; handleAddCategory: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <aside className="w-full h-full flex flex-col p-5 sm:p-6 overflow-y-auto bg-black transition-colors [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-cyan-900">
      <div className="flex flex-col space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-900">
          <h2 className="text-[10px] font-mono text-cyan-600 uppercase tracking-widest drop-shadow-[0_0_2px_rgba(6,182,212,0.5)]">Directories</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => props.setIsAddingCategory(!props.isAddingCategory)} 
              className={`p-1 rounded transition-colors cursor-pointer border ${props.isAddingCategory ? 'bg-fuchsia-900/30 text-fuchsia-400 border-fuchsia-500' : 'text-gray-500 border-transparent hover:text-cyan-400 hover:border-cyan-800'}`}
              title="MKDIR"
            >
              <PlusIcon />
            </button>
            <button onClick={() => props.setIsMobileMenuOpen(false)} className="md:hidden p-1 text-cyan-400 border border-cyan-800 rounded">
              <SmallXIcon />
            </button>
          </div>
        </div>

        {props.isAddingCategory && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <input autoFocus type="text" placeholder="DIR_NAME..." value={props.newCategoryName} onChange={(e) => props.setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddCategory()} className="w-full px-4 py-3 text-xs font-mono uppercase tracking-widest bg-[#00111a] text-cyan-100 border border-cyan-800 rounded outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.2)]" />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div
            onClick={() => { props.setActiveFilter('All'); props.setActiveSubFilter(null); props.setIsMobileMenuOpen(false); }}
            className={`flex items-center justify-between px-4 py-2.5 rounded cursor-pointer transition-all ${props.activeFilter === 'All' ? 'bg-cyan-900/30 text-cyan-300 border border-cyan-500/50 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]' : 'bg-transparent text-gray-400 border border-transparent hover:bg-[#00111a] hover:text-gray-200'}`}
          >
            <span className="font-mono text-xs uppercase tracking-widest">[ ROOT ]</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${props.activeFilter === 'All' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-gray-900 text-gray-500'}`}>
              {props.getCounts['All'] || 0}
            </span>
          </div>

          {Object.keys(props.folderHierarchy).map(parentFolder => {
            const isParentActive = props.activeFilter === parentFolder;
            const isExpanded = props.expandedFolders[parentFolder];
            const subfolders = props.folderHierarchy[parentFolder];

            return (
              <div key={parentFolder} className="flex flex-col gap-1">
                <div
                  onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder)}
                  onClick={() => { props.setActiveFilter(parentFolder); props.setActiveSubFilter(null); props.toggleFolderExpand(parentFolder); }}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded cursor-pointer transition-all ${isParentActive && !props.activeSubFilter ? 'bg-cyan-900/30 text-cyan-300 border border-cyan-500/50 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]' : 'bg-transparent text-gray-400 border border-transparent hover:bg-[#00111a] hover:text-gray-200'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <div className="opacity-60 text-cyan-700">{isExpanded ? <ChevronDown /> : <ChevronRight />}</div>
                    <span className="font-mono text-xs uppercase truncate tracking-widest">{parentFolder}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isParentActive && !props.activeSubFilter ? 'bg-cyan-500/20 text-cyan-300' : 'bg-gray-900 text-gray-500'}`}>
                      {props.getCounts[parentFolder] || 0}
                    </span>
                    {props.customCategories.includes(parentFolder) && (
                      <button onClick={(e) => { e.stopPropagation(); props.handleDeleteCategory(parentFolder); }} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-fuchsia-500 p-0.5">
                        <SmallXIcon />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-5 pl-4 border-l border-cyan-900/50 flex flex-col gap-1 py-1">
                    {subfolders.map(sub => {
                      const isSubActive = isParentActive && props.activeSubFilter === sub;
                      return (
                        <div key={sub} onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder, sub)} onClick={(e) => { e.stopPropagation(); props.setActiveFilter(parentFolder); props.setActiveSubFilter(sub); props.setIsMobileMenuOpen(false); }} className={`flex items-center justify-between px-3 py-2 text-xs rounded cursor-pointer transition-all ${isSubActive ? 'bg-fuchsia-900/20 text-fuchsia-300 border border-fuchsia-500/50 font-mono' : 'hover:bg-[#00111a] text-gray-500 font-mono border border-transparent'}`}>
                          <span className="truncate uppercase tracking-widest">{sub}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isSubActive ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'bg-gray-900 text-gray-600'}`}>
                            {props.getCounts[`${parentFolder}::${sub}`] || 0}
                          </span>
                        </div>
                      )
                    })}

                    {props.creatingSubFor === parentFolder ? (
                      <div className="flex gap-1 mt-1">
                        <input autoFocus type="text" placeholder="SUB..." value={props.newSubfolderName} onChange={(e) => props.setNewSubfolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddSubfolder(parentFolder)} className="w-full px-2 py-1.5 text-xs font-mono uppercase bg-[#00111a] border border-cyan-800 rounded outline-none text-cyan-100" />
                        <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(null); }} className="px-2 bg-transparent text-gray-500 hover:text-cyan-400"><SmallXIcon /></button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(parentFolder); }} className="flex items-center gap-2 px-3 py-2 mt-1 text-[10px] font-mono uppercase tracking-widest text-gray-600 hover:text-cyan-400 transition-colors">
                        <PlusIcon /> MK_SUBDIR
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
      <div className="md:hidden mt-auto pt-8 flex flex-col gap-4 pb-8">
        <div className="p-5 bg-[#00111a] border border-cyan-900 rounded-lg flex flex-col gap-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-cyan-700 uppercase tracking-widest">USER_ID</span>
            <span className="text-xs font-mono text-cyan-300 truncate mt-0.5">{props.userEmail}</span>
          </div>
          <div className="flex items-center justify-between border-t border-cyan-900/50 pt-3">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">UI_THEME</span>
            <button onClick={toggleDarkMode} className={`w-10 h-5 rounded border transition-colors relative flex items-center p-0.5 ${isDarkMode ? 'bg-cyan-900 border-cyan-500' : 'bg-gray-800 border-gray-600'}`}>
              <div className={`w-3.5 h-3.5 bg-cyan-400 rounded transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <button onClick={props.handleSignOut} className="w-full py-2.5 mt-2 bg-transparent border border-red-900 text-red-500 hover:bg-red-900/20 font-mono text-[10px] uppercase tracking-widest rounded transition-colors">TERMINATE_SESSION</button>
        </div>
      </div>
    </aside>
  )
}