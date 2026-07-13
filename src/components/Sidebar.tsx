'use client'

import React, { useState } from 'react'
import { useTheme } from '@/context/ThemeContext';

const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
const SmallXIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
const ChevronRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
const ChevronDown = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>

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
  
  const { isDarkMode, toggleDarkMode, bgTheme, setBgTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Preloaded background options. Ensure these files exist in your /public folder!
const BACKGROUND_OPTIONS = [
  { 
    id: 'solid-yellow', 
    name: 'Pure Yellow', 
    url: '', // Empty URL means it falls back to the hex color
    hexColor: '#9dc7d6' 
  },
  { 
    id: 'retro-grid', 
    name: 'Retro Grid', 
    url: '/backgrounds/3.gif', // Your existing GIF
    hexColor: '#bfdbfe' 
  },
  { 
    id: 'animated-waves', 
    name: 'Animated Waves', 
    url: '/backgrounds/background.jpg', 
    hexColor: '#e5e7eb' 
  }
];

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[360px] overflow-y-auto transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 shadow-[8px_0px_0px_0px_rgba(17,24,39,1)]' : '-translate-x-full'}

        md:sticky md:translate-x-0 md:w-72 md:top-28 md:self-start md:h-[calc(100vh-5rem)]
        md:bg-white md:dark:bg-gray-800 md:border-4 
        md:border-gray-900 md:dark:border-gray-700 md:rounded-3xl md:shadow-[8px_8px_0px_0px_rgba(17,24,39,1)] md:p-6 md:z-0

        [&::-webkit-scrollbar]:w-0.5 
        [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:dark:bg-gray-700 [&::-webkit-scrollbar-track]:border-l-2 [&::-webkit-scrollbar-track]:border-gray-900 [&::-webkit-scrollbar-track]:dark:border-gray-600 [&::-webkit-scrollbar-track]:rounded-r-3xl
        [&::-webkit-scrollbar-thumb]:bg-gray-900 [&::-webkit-scrollbar-thumb]:dark:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full

        flex flex-col space-y-6 bg-[#fafafa] dark:bg-gray-900 border-r-4 border-gray-900 dark:border-gray-700 p-6 transition-colors
      `}>

        <div className="flex items-center justify-between md:hidden pb-4 border-b-2 border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Menu</h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 bg-red-200 text-red-900 border-2 border-gray-900 rounded-lg shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] active:translate-y-px active:shadow-none transition-all"
          >
            <SmallXIcon />
          </button>
        </div>

        <div className="hidden md:flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Folders</h2>
        </div>

        <div className="flex flex-col gap-2 overflow-x-hidden md:overflow-visible pb-2 md:pb-0">
          <div
            onClick={() => { setActiveFilter('All'); setActiveSubFilter(null); setIsMobileMenuOpen(false); }}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${activeFilter === 'All' ? 'border-gray-900 bg-gray-900 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-900 dark:hover:border-white text-gray-700 dark:text-gray-200'}`}
          >
             <span className="font-medium text-sm">All Bookmarks</span>
             <span className={`text-xs px-2 py-1 rounded-md ${activeFilter === 'All' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>
                {getCounts['All'] || 0}
             </span>
          </div>

          {Object.keys(folderHierarchy).map(parentFolder => {
            const isParentActive = activeFilter === parentFolder;
            const isExpanded = expandedFolders[parentFolder];
            const subfolders = folderHierarchy[parentFolder];
            const parentCount = getCounts[parentFolder] || 0;

            return (
              <div key={parentFolder} className="flex flex-col gap-1">
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, parentFolder)}
                  onClick={() => {
                    setActiveFilter(parentFolder);
                    setActiveSubFilter(null);
                    toggleFolderExpand(parentFolder);
                  }}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl border-2 cursor-pointer transition-all ${isParentActive && !activeSubFilter ? 'border-gray-900 bg-gray-900 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-900 dark:hover:border-white text-gray-700 dark:text-gray-200'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <div className={`p-1 rounded transition-colors ${isParentActive && !activeSubFilter ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {isExpanded ? <ChevronDown /> : <ChevronRight />}
                    </div>
                    <span className="font-medium text-sm truncate">{parentFolder}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-md ${isParentActive && !activeSubFilter ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>
                      {parentCount}
                    </span>
                    {customCategories.includes(parentFolder) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(parentFolder); }}
                        className="opacity-0 md:group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400"
                      >
                        <SmallXIcon />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-6 pl-2 border-l-2 border-gray-200 dark:border-gray-600 flex flex-col gap-1 py-1">
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
                          className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg border-2 cursor-pointer transition-all ${isSubActive ? 'border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-bold' : 'border-transparent bg-transparent hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'}`}
                        >
                          <span className="truncate pr-2">{sub}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isSubActive ? 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                            {subCount}
                          </span>
                        </div>
                      )
                    })}

                    {creatingSubFor === parentFolder ? (
                      <div className="flex gap-2 mt-1">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Subfolder..."
                          value={newSubfolderName}
                          onChange={(e) => setNewSubfolderName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSubfolder(parentFolder)}
                          className="w-full px-2 py-1.5 text-xs border-2 border-gray-900 dark:border-gray-500 rounded outline-none bg-white dark:bg-gray-700 dark:text-white"
                        />
                        <button onClick={(e) => { e.stopPropagation(); setCreatingSubFor(null); }} className="px-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">X</button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCreatingSubFor(parentFolder); }}
                        className="flex items-center gap-2 px-3 py-1.5 mt-1 text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors text-left"
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

        <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700 border-dashed">
          {isAddingCategory ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Folder name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="w-full px-3 py-2 text-sm border-2 border-gray-900 dark:border-gray-500 rounded-lg outline-none bg-white dark:bg-gray-700 dark:text-white focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>
          ) : (
            <button
              onClick={() => setIsAddingCategory(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-gray-900 dark:hover:border-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 transition-all"
            >
              <PlusIcon /> New Folder
            </button>
          )}
        </div>

        {/* ---> UPGRADED MOBILE FOOTER MENU <--- */}
        <div className="mt-auto pt-4 border-t-4 border-gray-900 dark:border-gray-700 bg-[#fafafa] dark:bg-gray-900 relative md:hidden transition-colors">
          
          {isProfileOpen && (
            <div className="absolute bottom-full left-0 mb-3 w-full z-50">
              <div className="bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-700 shadow-[4px_4px_0px_rgba(0,0,0,1)] p-4 flex flex-col gap-5 rounded-xl">
                
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white text-sm">Dark Mode</span>
                  <button
                    onClick={toggleDarkMode}
                    className={`w-12 h-6 rounded-full border-2 border-gray-900 dark:border-white transition-colors relative ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white border-2 border-gray-900 dark:border-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
            

            {/* Background Selector */}
            <div className="flex flex-col gap-3">
                  <span className="font-bold text-gray-900 dark:text-white text-sm">Background</span>
                  
                  {/* Horizontal scrolling container for thumbnails */}
              <div className="flex gap-3 overflow-x-auto p-2 [&::-webkit-scrollbar]:h-0.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:dark:bg-gray-700 [&::-webkit-scrollbar-thumb]:bg-gray-900 [&::-webkit-scrollbar-thumb]:dark:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {BACKGROUND_OPTIONS.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setBgTheme({ url: bg.url, hex: bg.hexColor })}
                        title={bg.name}
                        className={`
                          relative shrink-0 w-12 h-10 rounded-lg border-2 border-gray-900 dark:border-gray-700 
                          overflow-hidden transition-all bg-cover bg-center
                          ${bgTheme.url === bg.url && bgTheme.hex === bg.hexColor 
                            ? 'scale-110 shadow-[4px_4px_0px_rgba(0,0,0,1)] ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100' 
                            : 'hover:scale-105 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]'}
                        `}
                        style={{ 
                          backgroundColor: bg.hexColor,
                          backgroundImage: bg.url ? `url('${bg.url}')` : 'none'
                        }}
                      >
                        {/* Active Selection Checkmark */}
                        {bgTheme.url === bg.url && bgTheme.hex === bg.hexColor && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full py-2 font-black text-white bg-red-500 border-2 border-gray-900 dark:border-gray-700 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none transition-all uppercase tracking-wider text-sm rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-full flex items-center justify-between p-3 bg-sky-100 dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-700 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none transition-all rounded-xl"
          >
            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {userEmail ?? "Settings"}
            </span>
            <svg className={`w-5 h-5 dark:text-white transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

      </aside>
    </>
  )
}