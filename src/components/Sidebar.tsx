'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext';

const PlusIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
const SmallXIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
const ChevronRight = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
const ChevronDown = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>

interface SidebarProps {
  userEmail: string | null;
  handleSignOut: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  activeSubFilter: string | null;
  setActiveSubFilter: (subFilter: string | null) => void;
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

export default function Sidebar({
  userEmail,
  handleSignOut,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  activeFilter,
  setActiveFilter,
  activeSubFilter,
  setActiveSubFilter,
  getCounts,
  folderHierarchy,
  expandedFolders,
  toggleFolderExpand,
  customCategories,
  handleDeleteCategory,
  handleDragOver,
  handleDrop,
  creatingSubFor,
  setCreatingSubFor,
  newSubfolderName,
  setNewSubfolderName,
  handleAddSubfolder,
  isAddingCategory,
  setIsAddingCategory,
  newCategoryName,
  setNewCategoryName,
  handleAddCategory
}: SidebarProps) {
  
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <aside className="w-full h-full flex flex-col p-6 overflow-y-auto bg-[#f4f4f0] dark:bg-[#121212] transition-colors [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-black dark:[&::-webkit-scrollbar-thumb]:bg-white">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between pb-4 border-b-4 border-black dark:border-white">
          <h2 className="text-sm font-black uppercase tracking-widest text-black dark:text-white">Folders</h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 bg-yellow-400 text-black border-4 border-black rounded-lg shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all"
          >
            <SmallXIcon />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div
            onClick={() => { setActiveFilter('All'); setActiveSubFilter(null); setIsMobileMenuOpen(false); }}
            className={`flex items-center justify-between px-4 py-3 rounded-none border-4 cursor-pointer transition-all ${activeFilter === 'All' ? 'border-black dark:border-white bg-cyan-400 dark:bg-pink-600 text-black shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] translate-x-[-2px] translate-y-[-2px]' : 'border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-yellow-200 dark:hover:bg-cyan-900 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]'}`}
          >
            <span className="font-black text-sm uppercase tracking-wider">All Bookmarks</span>
            <span className={`text-[12px] font-black px-2 py-1 border-2 border-black ${activeFilter === 'All' ? 'bg-white text-black' : 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white'}`}>
              {getCounts['All'] || 0}
            </span>
          </div>

          {Object.keys(folderHierarchy).map(parentFolder => {
            const isParentActive = activeFilter === parentFolder;
            const isExpanded = expandedFolders[parentFolder];
            const subfolders = folderHierarchy[parentFolder];
            const parentCount = getCounts[parentFolder] || 0;

            return (
              <div key={parentFolder} className="flex flex-col gap-2">
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, parentFolder)}
                  onClick={() => {
                    setActiveFilter(parentFolder);
                    setActiveSubFilter(null);
                    toggleFolderExpand(parentFolder);
                  }}
                  className={`group flex items-center justify-between px-4 py-3 rounded-none border-4 cursor-pointer transition-all ${isParentActive && !activeSubFilter ? 'border-black dark:border-white bg-cyan-400 dark:bg-pink-600 text-black shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] translate-x-[-2px] translate-y-[-2px]' : 'border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-yellow-200 dark:hover:bg-cyan-900 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="p-0.5 text-black dark:text-white">
                      {isExpanded ? <ChevronDown /> : <ChevronRight />}
                    </div>
                    <span className="font-black text-sm uppercase truncate">{parentFolder}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[12px] font-black px-2 py-1 border-2 border-black ${isParentActive && !activeSubFilter ? 'bg-white text-black' : 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white'}`}>
                      {parentCount}
                    </span>
                    {customCategories.includes(parentFolder) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(parentFolder); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-black dark:text-white hover:text-red-500 p-1"
                      >
                        <SmallXIcon />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-6 pl-4 border-l-4 border-black dark:border-white flex flex-col gap-2 py-2">
                    {subfolders.map(sub => {
                      const isSubActive = isParentActive && activeSubFilter === sub;
                      const subCount = getCounts[`${parentFolder}::${sub}`] || 0;
                      
                      return (
                        <div
                          key={sub}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, parentFolder, sub)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFilter(parentFolder);
                            setActiveSubFilter(sub);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 text-sm border-4 cursor-pointer transition-all ${isSubActive ? 'border-black dark:border-white bg-yellow-400 text-black font-black shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]' : 'border-black dark:border-white bg-white dark:bg-[#1a1a1a] text-black dark:text-white font-bold hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff]'}`}
                        >
                          <span className="truncate pr-2 uppercase">{sub}</span>
                          <span className={`text-[10px] font-black px-2 py-1 border-2 border-black ${isSubActive ? 'bg-white text-black' : 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white'}`}>
                            {subCount}
                          </span>
                        </div>
                      )
                    })}

                    {creatingSubFor === parentFolder ? (
                      <div className="flex gap-2 mt-2">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Subfolder..."
                          value={newSubfolderName}
                          onChange={(e) => setNewSubfolderName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSubfolder(parentFolder)}
                          className="w-full px-3 py-2 text-xs font-black uppercase border-4 border-black dark:border-white outline-none bg-white dark:bg-black text-black dark:text-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
                        />
                        <button onClick={(e) => { e.stopPropagation(); setCreatingSubFor(null); }} className="px-3 bg-red-400 text-black border-4 border-black font-black hover:bg-red-500 shadow-[4px_4px_0_0_#000]">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCreatingSubFor(parentFolder); }}
                        className="flex items-center gap-2 px-3 py-2 mt-2 text-xs font-black uppercase text-black dark:text-white border-4 border-dashed border-black dark:border-white hover:bg-pink-300 dark:hover:bg-pink-900 transition-colors"
                      >
                        <PlusIcon /> Add Subfolder
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="pt-6 border-t-4 border-black dark:border-white border-dashed">
          {isAddingCategory ? (
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                type="text"
                placeholder="FOLDER NAME..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="w-full px-4 py-3 text-sm font-black uppercase border-4 border-black dark:border-white outline-none bg-white dark:bg-black text-black dark:text-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
              />
            </div>
          ) : (
            <button
              onClick={() => setIsAddingCategory(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 text-sm font-black uppercase tracking-wider border-4 border-dashed border-black dark:border-white bg-transparent text-black dark:text-white hover:bg-yellow-400 dark:hover:bg-yellow-600 hover:border-solid hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer"
            >
              <PlusIcon /> New Folder
            </button>
          )}
        </div>
      </div>

      {/* MOBILE PROFILE BLOCK */}
      <div className="md:hidden mt-auto pt-8 flex flex-col gap-4">
        <div className="p-5 bg-white dark:bg-[#1a1a1a] border-4 border-black dark:border-white flex flex-col gap-6 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]">
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Signed in as</span>
            <span className="text-sm font-black text-black dark:text-white truncate">{userEmail}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-black dark:text-white">Dark Mode</span>
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-none border-4 border-black dark:border-white transition-colors relative ${isDarkMode ? 'bg-black' : 'bg-white'}`}
            >
              <div className={`absolute top-0 w-4 h-4 bg-white dark:bg-black border-r-4 border-black dark:border-white transition-transform ${isDarkMode ? 'translate-x-[20px] border-l-4 border-r-0 border-white' : 'translate-x-0'}`} />
            </button>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full py-3 bg-red-500 text-black border-4 border-black font-black uppercase tracking-wider text-xs cursor-pointer hover:bg-red-400 hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0_0_#000] hover:shadow-none transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  )
}