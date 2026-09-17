'use client'

import React from 'react'

const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
const SmallXIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
const FolderIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
const HomeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>

interface SidebarProps {
  userEmail: string | null; handleSignOut: () => void; isMobileMenuOpen: boolean; setIsMobileMenuOpen: (isOpen: boolean) => void; activeFilter: string; setActiveFilter: (filter: string) => void; activeSubFilter: string | null; setActiveSubFilter: (subFilter: string | null) => void; getCounts: Record<string, number>; folderHierarchy: Record<string, string[]>; expandedFolders: Record<string, boolean>; toggleFolderExpand: (folder: string) => void; customCategories: string[]; handleDeleteCategory: (catToDelete: string) => void; handleDragOver: (e: React.DragEvent) => void; handleDrop: (e: React.DragEvent, targetCategory: string, targetSubCategory?: string) => void; creatingSubFor: string | null; setCreatingSubFor: (folder: string | null) => void; newSubfolderName: string; setNewSubfolderName: (name: string) => void; handleAddSubfolder: (parentFolder: string) => void; isAddingCategory: boolean; setIsAddingCategory: (isAdding: boolean) => void; newCategoryName: string; setNewCategoryName: (name: string) => void; handleAddCategory: () => void;
}

export default function Sidebar(props: SidebarProps) {
  return (
    <aside className="w-full h-full flex flex-col text-[#566056] dark:text-[#A8B0A8] overflow-y-auto [&::-webkit-scrollbar]:w-0 font-sans">
      
      {/* Sidebar Header */}
      <div className="px-6 pt-6 pb-2">
        <h1 className="font-serif text-2xl text-[#1B221B] dark:text-white mb-6 hidden lg:block">inntoit</h1>
        <h2 className="text-[10px] uppercase tracking-widest text-[#A0A6A0]">Library</h2>
      </div>

      {/* Main Folders Header */}
      <div className="px-6 py-2 flex items-center justify-between group">
        <span className="text-lg text-[#3A3F3A] dark:text-white">Folders</span>
        <button onClick={() => props.setIsAddingCategory(!props.isAddingCategory)} className="text-[#A0A6A0] hover:text-[#3A3F3A] transition-colors" title="New Category">
          <PlusIcon />
        </button>
      </div>

      {props.isAddingCategory && (
        <div className="px-6 py-2">
          <input autoFocus type="text" placeholder="Folder Name..." value={props.newCategoryName} onChange={(e) => props.setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddCategory()} className="w-full px-3 py-2 text-sm bg-white dark:bg-[#202520] border border-[#E8E1D7] dark:border-[#292E29] rounded-lg outline-none text-[#3A3F3A] dark:text-[#E2E8F0]" />
        </div>
      )}

      {/* Folder List */}
      <div className="flex flex-col flex-1 mt-2">
        
        {/* 'All' View */}
        <div
          onClick={() => { props.setActiveFilter('All'); props.setActiveSubFilter(null); props.setIsMobileMenuOpen(false); }}
          className={`flex items-center justify-between px-6 py-2 cursor-pointer transition-colors ${props.activeFilter === 'All' ? 'text-[#1B221B] dark:text-white font-medium bg-[#E8E1D7]/30 dark:bg-[#292E29]/50' : 'hover:bg-[#E8E1D7]/20 dark:hover:bg-[#292E29]/30'}`}
        >
          <div className="flex items-center gap-3">
             <HomeIcon />
             <span className="text-sm">All</span>
          </div>
          <span className="text-[10px] text-[#A0A6A0]">{props.getCounts['All'] || 0}</span>
        </div>

        {Object.keys(props.folderHierarchy).map(parentFolder => {
          const isParentActive = props.activeFilter === parentFolder;
          const isExpanded = props.expandedFolders[parentFolder];
          const subfolders = props.folderHierarchy[parentFolder];

          return (
            <div key={parentFolder} className="flex flex-col">
              <div
                onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder)}
                onClick={() => { props.setActiveFilter(parentFolder); props.setActiveSubFilter(null); props.toggleFolderExpand(parentFolder); }}
                className={`group flex items-center justify-between px-6 py-2 cursor-pointer transition-colors ${isParentActive && !props.activeSubFilter ? 'text-[#1B221B] dark:text-white font-medium bg-[#E8E1D7]/30 dark:bg-[#292E29]/50' : 'hover:bg-[#E8E1D7]/20 dark:hover:bg-[#292E29]/30'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <FolderIcon />
                  <span className="text-sm truncate">{parentFolder}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {props.customCategories.includes(parentFolder) && (
                    <button onClick={(e) => { e.stopPropagation(); props.handleDeleteCategory(parentFolder); }} className="opacity-0 group-hover:opacity-100 text-[#E53E3E] transition-opacity">
                      <SmallXIcon />
                    </button>
                  )}
                  <span className="text-[10px] text-[#A0A6A0]">{props.getCounts[parentFolder] || 0}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="flex flex-col">
                  {subfolders.map(sub => {
                    const isSubActive = isParentActive && props.activeSubFilter === sub;
                    return (
                      <div key={sub} onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder, sub)} onClick={(e) => { e.stopPropagation(); props.setActiveFilter(parentFolder); props.setActiveSubFilter(sub); props.setIsMobileMenuOpen(false); }} className={`flex items-center justify-between pl-12 pr-6 py-1.5 cursor-pointer transition-colors ${isSubActive ? 'text-[#4D6A51] dark:text-[#8FAA91] font-medium' : 'text-[#7A827A] hover:text-[#3A3F3A] dark:hover:text-white'}`}>
                        <span className="text-xs truncate text-[#7A827A]">- {sub}</span>
                        <span className="text-[9px] text-[#A0A6A0]">{props.getCounts[`${parentFolder}::${sub}`] || 0}</span>
                      </div>
                    )
                  })}
                  {props.creatingSubFor === parentFolder ? (
                    <div className="flex items-center pl-12 pr-6 py-1">
                      <input autoFocus type="text" placeholder="New sub-folder" value={props.newSubfolderName} onChange={(e) => props.setNewSubfolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddSubfolder(parentFolder)} className="w-full text-xs bg-transparent outline-none text-[#3A3F3A] dark:text-white" />
                      <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(null); }} className="text-[#A0A6A0] hover:text-[#E53E3E]"><SmallXIcon /></button>
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
    </aside>
  )
}