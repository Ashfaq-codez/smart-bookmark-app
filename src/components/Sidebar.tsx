'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import ProfileDropdown from './ProfileDropdown'

const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
const SmallXIcon = ({ className }: { className?: string }) => <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
const FolderIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
const SmallFolderIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
const HomeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
const MoonIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
const SunIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>

const PanelLeftOpenIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><path d="M14 9l3 3-3 3"></path></svg>
const PanelLeftCloseIcon = ({ className }: { className?: string }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><path d="M17 9l-3 3 3 3"></path></svg>
const MenuIcon = ({ className }: { className?: string }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>

interface SidebarProps {
  isCollapsed: boolean; userEmail: string | null; handleSignOut: () => void; isMobileMenuOpen: boolean; setIsMobileMenuOpen: (isOpen: boolean) => void; activeFilter: string; setActiveFilter: (filter: string) => void; activeSubFilter: string | null; setActiveSubFilter: (subFilter: string | null) => void; getCounts: Record<string, number>; folderHierarchy: Record<string, string[]>; expandedFolders: Record<string, boolean>; toggleFolderExpand: (folder: string) => void; customCategories: string[]; handleDeleteCategory: (catToDelete: string) => void; handleDragOver: (e: React.DragEvent) => void; handleDrop: (e: React.DragEvent, targetCategory: string, targetSubCategory?: string) => void; creatingSubFor: string | null; setCreatingSubFor: (folder: string | null) => void; newSubfolderName: string; setNewSubfolderName: (name: string) => void; handleAddSubfolder: (parentFolder: string) => void; isAddingCategory: boolean; setIsAddingCategory: (isAdding: boolean) => void; newCategoryName: string; setNewCategoryName: (name: string) => void; handleAddCategory: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  // 1. COLLAPSED VIEW (Ultra Minimalist Strip)
  if (props.isCollapsed) {
    return (
      <aside className="w-full h-full flex flex-col bg-[#FBF9F4] dark:bg-[#151815] text-[#636A63] dark:text-[#9DA59D] font-sans border-r border-black/[0.04] dark:border-white/[0.04] items-center py-6 overscroll-contain">
        
        {/* Top Icons */}
        <div className="flex flex-col gap-6 items-center">
          <button onClick={() => props.setIsMobileMenuOpen(true)} className="text-[#737B73] dark:text-[#8F998F] hover:text-[#171A17] dark:hover:text-white transition-colors">
            <PanelLeftOpenIcon />
          </button>
          <button onClick={() => props.setIsMobileMenuOpen(true)} className="text-[#737B73] dark:text-[#8F998F] hover:text-[#171A17] dark:hover:text-white transition-colors" title="Open Library">
            <FolderIcon />
          </button>
        </div>

        {/* Bottom Icons */}
        <div className="mt-auto flex flex-col gap-4 items-center relative z-20 pb-4">
          <button onClick={toggleDarkMode} className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#1A1D1A] shadow-sm border border-black/[0.04] dark:border-white/[0.04] text-[#303630] dark:text-[#EDE9E0] transition-colors hover:bg-black/5 dark:hover:bg-white/5">
             {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          <ProfileDropdown email={props.userEmail || ""} isCollapsed={true} />
        </div>
        
      </aside>
    )
  }

  // 2. EXPANDED VIEW
  return (
    <aside className="w-full h-full flex flex-col bg-[#FBF9F4] dark:bg-[#151815] text-[#636A63] dark:text-[#9DA59D] font-sans border-r border-black/[0.04] dark:border-white/[0.04] overscroll-contain">
      
      {/* Scrollable Main Area - Separated to prevent Pop-up Clipping, Overscroll-contain traps scrolling */}
      <div className="flex-1 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-0 flex flex-col">
        {/* Sidebar Header */}
        <div className={`px-4 pt-6 pb-2 flex w-full ${props.isCollapsed ? 'justify-center' : 'justify-between px-6'} items-center`}>
          {!props.isCollapsed && <h1 className="font-serif text-2xl text-[#1B221B] dark:text-white mb-1">inntoit</h1>}
          <button onClick={() => props.setIsMobileMenuOpen(!props.isMobileMenuOpen)} className="text-[#737B73] hover:text-[#171A17] dark:hover:text-white transition-colors">
             {props.isCollapsed ? <MenuIcon /> : (
               <>
                 <SmallXIcon className="lg:hidden" />
                 <PanelLeftCloseIcon className="hidden lg:block" />
               </>
             )}
          </button>
        </div>
        
        {!props.isCollapsed && (
          <div className="px-6 pb-2">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-[#737B73] dark:text-[#8F998F] font-bold">Library</h2>
          </div>
        )}

        {/* Main Folders Header */}
        <div className={`py-2 flex items-center group mt-2 ${props.isCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
          {!props.isCollapsed && <span className="text-lg text-[#171A17] dark:text-white">Folders</span>}
          <button onClick={() => props.setIsAddingCategory(!props.isAddingCategory)} className="text-[#737B73] hover:bg-black/5 dark:hover:bg-white/5 rounded-md p-1 transition-colors" title="New Category">
            <PlusIcon />
          </button>
        </div>

        {props.isAddingCategory && !props.isCollapsed && (
          <div className="px-6 py-2">
            <input autoFocus type="text" placeholder="Folder Name..." value={props.newCategoryName} onChange={(e) => props.setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddCategory()} className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1A1D1A] border border-black/[0.04] dark:border-white/[0.04] rounded-lg shadow-sm outline-none text-[#171A17] dark:text-[#E2E8F0]" />
          </div>
        )}

        {/* Folder List */}
        <div className="flex flex-col flex-1 mt-2">
          <div
            onClick={() => { props.setActiveFilter('All'); props.setActiveSubFilter(null); props.setIsMobileMenuOpen(false); }}
            className={`flex items-center cursor-pointer transition-colors ${props.activeFilter === 'All' ? 'text-[#171A17] dark:text-white font-medium bg-black/[0.03] dark:bg-white/[0.03]' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'} ${props.isCollapsed ? 'justify-center py-3' : 'justify-between px-6 py-2'}`}
          >
            <div className={`flex items-center gap-3 ${props.isCollapsed ? 'justify-center' : ''}`}>
               <HomeIcon />
               {!props.isCollapsed && <span className="text-sm">All</span>}
            </div>
            {!props.isCollapsed && <span className="text-[10px] text-[#A0A6A0]">{props.getCounts['All'] || 0}</span>}
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
                  className={`group flex items-center cursor-pointer transition-colors ${isParentActive && !props.activeSubFilter ? 'text-[#171A17] dark:text-white font-medium bg-black/[0.03] dark:bg-white/[0.03]' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'} ${props.isCollapsed ? 'justify-center py-3' : 'justify-between px-6 py-2'}`}
                >
                  <div className={`flex items-center gap-3 ${props.isCollapsed ? '' : 'overflow-hidden flex-1'}`}>
                    <SmallFolderIcon />
                    {!props.isCollapsed && <span className="text-sm truncate">{parentFolder}</span>}
                  </div>
                  {!props.isCollapsed && (
                    <div className="flex items-center gap-2 shrink-0">
                      {props.customCategories.includes(parentFolder) && (
                        <button onClick={(e) => { e.stopPropagation(); props.handleDeleteCategory(parentFolder); }} className="opacity-0 group-hover:opacity-100 text-[#E53E3E] transition-opacity">
                          <SmallXIcon />
                        </button>
                      )}
                      <span className="text-[10px] text-[#A0A6A0]">{props.getCounts[parentFolder] || 0}</span>
                    </div>
                  )}
                </div>

                {!props.isCollapsed && isExpanded && (
                  <div className="flex flex-col">
                    {subfolders.map(sub => {
                      const isSubActive = isParentActive && props.activeSubFilter === sub;
                      return (
                        <div key={sub} onDragOver={props.handleDragOver} onDrop={(e) => props.handleDrop(e, parentFolder, sub)} onClick={(e) => { e.stopPropagation(); props.setActiveFilter(parentFolder); props.setActiveSubFilter(sub); props.setIsMobileMenuOpen(false); }} className={`flex items-center justify-between pl-12 pr-6 py-1.5 cursor-pointer transition-colors ${isSubActive ? 'text-[#4D6A51] dark:text-[#8FAA91] font-medium' : 'text-[#737B73] hover:text-[#171A17] dark:hover:text-white'}`}>
                          <span className="text-xs truncate text-[#737B73]">- {sub}</span>
                          <span className="text-[9px] text-[#A0A6A0]">{props.getCounts[`${parentFolder}::${sub}`] || 0}</span>
                        </div>
                      )
                    })}
                    {props.creatingSubFor === parentFolder ? (
                      <div className="flex items-center pl-12 pr-6 py-1">
                        <input autoFocus type="text" placeholder="New sub-folder" value={props.newSubfolderName} onChange={(e) => props.setNewSubfolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && props.handleAddSubfolder(parentFolder)} className="w-full text-xs bg-transparent outline-none text-[#171A17] dark:text-white" />
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
      </div>

      {/* FOOTER: Excluded from scrolling to allow Profile pop-up freedom */}
      <div className={`p-4 sm:p-6 mt-auto border-t border-black/[0.04] dark:border-white/[0.04] flex flex-col gap-4 bg-[#FBF9F4] dark:bg-[#151815] relative z-20 pb-12 sm:pb-6 ${props.isCollapsed ? 'items-center px-2' : ''}`}>
         <div className={`flex items-center gap-3 ${props.isCollapsed ? 'flex-col' : ''}`}>
            <button onClick={toggleDarkMode} className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#1A1D1A] shadow-sm border border-black/[0.04] dark:border-white/[0.04] text-[#303630] dark:text-[#EDE9E0] transition-colors hover:bg-black/5 dark:hover:bg-white/5">
               {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>
            <ProfileDropdown email={props.userEmail || ""} isCollapsed={props.isCollapsed} />
         </div>
         {!props.isCollapsed && (
           <div className="text-[10px] text-[#737B73] dark:text-[#8F998F] leading-[1.6] font-serif uppercase tracking-[0.1em] mt-2">
              Collect quietly.<br/>Find it when you need it.
           </div>
         )}
      </div>
    </aside>
  )
}