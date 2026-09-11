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

  const BACKGROUND_OPTIONS = [
    { 
      id: 'solid-yellow', 
      name: 'Pure Yellow', 
      url: '', 
      hexColor: '#9dc7d6' 
    },
    { 
      id: 'retro-grid', 
      name: 'Retro Grid', 
      url: '/backgrounds/3.gif', 
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
    <aside className="w-full h-full flex flex-col justify-between p-4 sm:p-5 overflow-y-auto bg-[#fafafa] dark:bg-gray-900 transition-colors [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
      <div className="flex flex-col space-y-5">
        <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200 dark:border-gray-700">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Folders</h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 bg-red-200 text-red-900 border-2 border-gray-900 rounded-lg shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] active:translate-y-px active:shadow-none transition-all"
          >
            <SmallXIcon />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div
            onClick={() => { setActiveFilter('All'); setActiveSubFilter(null); }}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${activeFilter === 'All' ? 'border-gray-900 bg-gray-900 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-900 dark:hover:border-white text-gray-800 dark:text-gray-200'}`}
          >
            <span className="font-bold text-xs uppercase tracking-wider">All Bookmarks</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${activeFilter === 'All' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
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
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl border-2 cursor-pointer transition-all ${isParentActive && !activeSubFilter ? 'border-gray-900 bg-gray-900 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-900 dark:hover:border-white text-gray-800 dark:text-gray-200'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <div className={`p-0.5 rounded transition-colors ${isParentActive && !activeSubFilter ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {isExpanded ? <ChevronDown /> : <ChevronRight />}
                    </div>
                    <span className="font-bold text-xs truncate">{parentFolder}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isParentActive && !activeSubFilter ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {parentCount}
                    </span>
                    {customCategories.includes(parentFolder) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(parentFolder); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                      >
                        <SmallXIcon />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-4 pl-2 border-l-2 border-gray-300 dark:border-gray-700 flex flex-col gap-1 py-1">
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
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg border-2 cursor-pointer transition-all ${isSubActive ? 'border-gray-900 dark:border-white bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-bold' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'}`}
                        >
                          <span className="truncate pr-2">{sub}</span>
                          <span className={`text-[9px] font-bold px-1 rounded ${isSubActive ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                            {subCount}
                          </span>
                        </div>
                      )
                    })}

                    {creatingSubFor === parentFolder ? (
                      <div className="flex gap-1.5 mt-1">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Subfolder..."
                          value={newSubfolderName}
                          onChange={(e) => setNewSubfolderName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSubfolder(parentFolder)}
                          className="w-full px-2 py-1 text-xs border-2 border-gray-900 dark:border-gray-600 rounded outline-none bg-white dark:bg-gray-700 dark:text-white"
                        />
                        <button onClick={(e) => { e.stopPropagation(); setCreatingSubFor(null); }} className="px-2 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCreatingSubFor(parentFolder); }}
                        className="flex items-center gap-1.5 px-2 py-1 mt-1 text-[11px] font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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

        <div className="pt-3 border-t-2 border-gray-200 dark:border-gray-700 border-dashed">
          {isAddingCategory ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                type="text"
                placeholder="Folder name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="w-full px-2.5 py-1.5 text-xs font-bold border-2 border-gray-900 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
          ) : (
            <button
              onClick={() => setIsAddingCategory(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:border-gray-900 dark:hover:border-gray-400 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <PlusIcon /> New Folder
            </button>
          )}
        </div>
      </div>

      <div className="pt-4 mt-6 border-t-2 border-gray-200 dark:border-gray-700 bg-transparent relative">
        {isProfileOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-full z-50">
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-700 shadow-[4px_4px_0px_rgba(0,0,0,1)] p-3 flex flex-col gap-3 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-white text-xs">Dark Mode</span>
                <button
                  onClick={toggleDarkMode}
                  className={`w-10 h-5 rounded-full border-2 border-gray-900 dark:border-white transition-colors relative ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white border-2 border-gray-900 dark:border-white rounded-full transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-bold text-gray-900 dark:text-white text-xs">Theme Preset</span>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {BACKGROUND_OPTIONS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setBgTheme({ url: bg.url, hex: bg.hexColor })}
                      title={bg.name}
                      className={`relative shrink-0 w-8 h-7 rounded border-2 border-gray-900 dark:border-gray-700 overflow-hidden ${bgTheme.url === bg.url && bgTheme.hex === bg.hexColor ? 'ring-2 ring-yellow-400' : ''}`}
                      style={{ backgroundColor: bg.hexColor, backgroundImage: bg.url ? `url('${bg.url}')` : 'none' }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full py-1.5 font-bold text-white bg-red-500 border-2 border-gray-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none transition-all uppercase tracking-wider text-xs rounded-lg cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="w-full flex items-center justify-between p-2.5 bg-yellow-200 dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-700 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none transition-all rounded-xl cursor-pointer"
        >
          <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
            {userEmail ?? "Settings"}
          </span>
          <ChevronDown />
        </button>
      </div>
    </aside>
  )
}