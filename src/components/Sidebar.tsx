'use client'

import React from 'react'

const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
const SmallXIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>

interface SidebarProps {
  userEmail: string | null; handleSignOut: () => void; isMobileMenuOpen: boolean; setIsMobileMenuOpen: (isOpen: boolean) => void; activeFilter: string; setActiveFilter: (filter: string) => void; activeSubFilter: string | null; setActiveSubFilter: (subFilter: string | null) => void; getCounts: Record<string, number>; folderHierarchy: Record<string, string[]>; expandedFolders: Record<string, boolean>; toggleFolderExpand: (folder: string) => void; customCategories: string[]; handleDeleteCategory: (catToDelete: string) => void; handleDragOver: (e: React.DragEvent) => void; handleDrop: (e: React.DragEvent, targetCategory: string, targetSubCategory?: string) => void; creatingSubFor: string | null; setCreatingSubFor: (folder: string | null) => void; newSubfolderName: string; setNewSubfolderName: (name: string) => void; handleAddSubfolder: (parentFolder: string) => void; isAddingCategory: boolean; setIsAddingCategory: (isAdding: boolean) => void; newCategoryName: string; setNewCategoryName: (name: string) => void; handleAddCategory: () => void;
}

export default function Sidebar(props: SidebarProps) {
  return (
    <aside className="w-full h-full flex flex-col bg-[#FDFCF8] dark:bg-[#1A202C] text-[#2D3748] dark:text-[#E2E8F0] border-r border-[#E5E0D8] dark:border-[#4A5568] transition-colors duration-500 overflow-y-auto [&::-webkit-scrollbar]:w-0 font-sans pt-[72px]">
      
      <div className="px-6 py-5 flex items-center justify-between border-b border-[#E5E0D8] dark:border-[#4A5568]">
        <h2 className="text-[10px] uppercase tracking-widest text-[#718096] dark:text-[#A0AEC0]">Index</h2>
        <button onClick={() => props.setIsAddingCategory(!props.isAddingCategory)} className="text-[#2B6CB0] dark:text-[#90CDF4] hover:opacity-70 transition-colors" title="New Category">
          <PlusIcon />
        </button>
      </div>

      {props.isAddingCategory && (
        <div className="border-b border-[#E5E0D8] dark:border-[#4A5568] bg-white dark:bg-[#2D3748]">
          <input autoFocus type="text" placeholder="Category Name" value={props.newCategoryName} onChange={(e) => props.setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddCategory()} className="w-full px-6 py-4 text-xs bg-transparent outline-none text-[#2D3748] dark:text-[#E2E8F0] placeholder-[#A0AEC0] dark:placeholder-[#718096]" />
        </div>
      )}

      <div className="flex flex-col flex-1">
        <div
          onClick={() => { props.setActiveFilter('All'); props.setActiveSubFilter(null); props.setIsMobileMenuOpen(false); }}
          className={`flex items-center justify-between px-6 py-3 cursor-pointer transition-colors border-b border-[#E5E0D8] dark:border-[#4A5568] ${props.activeFilter === 'All' ? 'bg-[#EBF8FF] dark:bg-[#2A4365] text-[#2B6CB0] dark:text-[#90CDF4] font-medium' : 'hover:bg-white dark:hover:bg-[#2D3748] font-light text-[#4A5568] dark:text-[#A0AEC0]'}`}
        >
          <span className="text-xs tracking-wide">All Publications</span>
          <span className="text-[9px] font-mono">{props.getCounts['All'] || 0}</span>
        </div>

        {Object.keys(props.folderHierarchy).map(parentFolder => {
          const isParentActive = props.activeFilter === parentFolder;
          const isExpanded = props.expandedFolders[parentFolder];
          const subfolders = props.folderHierarchy[parentFolder];

          return (
            <div key={parentFolder} className="flex flex-col border-b border-[#E5E0D8] dark:border-[#4A5568]">
              <div
                onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder)}
                onClick={() => { props.setActiveFilter(parentFolder); props.setActiveSubFilter(null); props.toggleFolderExpand(parentFolder); }}
                className={`group flex items-center justify-between px-6 py-3 cursor-pointer transition-colors ${isParentActive && !props.activeSubFilter ? 'bg-[#EBF8FF] dark:bg-[#2A4365] text-[#2B6CB0] dark:text-[#90CDF4] font-medium' : 'hover:bg-white dark:hover:bg-[#2D3748] font-light text-[#4A5568] dark:text-[#A0AEC0]'}`}
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <span className="text-xs tracking-wide truncate">{parentFolder}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[9px] font-mono">{props.getCounts[parentFolder] || 0}</span>
                  {props.customCategories.includes(parentFolder) && (
                    <button onClick={(e) => { e.stopPropagation(); props.handleDeleteCategory(parentFolder); }} className="opacity-0 group-hover:opacity-100 text-[#C53030] dark:text-[#FC8181] transition-opacity">
                      <SmallXIcon />
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="flex flex-col bg-[#F7FAFC] dark:bg-[#171923]">
                  {subfolders.map(sub => {
                    const isSubActive = isParentActive && props.activeSubFilter === sub;
                    return (
                      <div key={sub} onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder, sub)} onClick={(e) => { e.stopPropagation(); props.setActiveFilter(parentFolder); props.setActiveSubFilter(sub); props.setIsMobileMenuOpen(false); }} className={`flex items-center justify-between px-8 py-2.5 text-[11px] cursor-pointer transition-colors ${isSubActive ? 'text-[#2B6CB0] dark:text-[#90CDF4] font-medium' : 'text-[#718096] dark:text-[#A0AEC0] hover:text-[#2D3748] dark:hover:text-[#E2E8F0]'}`}>
                        <span className="truncate">{sub}</span>
                        <span className="text-[9px] font-mono">{props.getCounts[`${parentFolder}::${sub}`] || 0}</span>
                      </div>
                    )
                  })}
                  {props.creatingSubFor === parentFolder ? (
                    <div className="flex items-center px-8 py-2">
                      <input autoFocus type="text" placeholder="Sub-category" value={props.newSubfolderName} onChange={(e) => props.setNewSubfolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddSubfolder(parentFolder)} className="w-full text-[11px] bg-transparent outline-none text-[#2D3748] dark:text-[#E2E8F0]" />
                      <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(null); }} className="text-[#718096] hover:text-[#C53030]"><SmallXIcon /></button>
                    </div>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); props.setCreatingSubFor(parentFolder); }} className="px-8 py-2.5 text-left text-[10px] uppercase tracking-widest text-[#2B6CB0] dark:text-[#90CDF4] hover:opacity-70 transition-colors">
                      + Add
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