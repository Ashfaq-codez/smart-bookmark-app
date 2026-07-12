'use client'

import React from 'react'

// --- Sidebar Specific Icons ---
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
const SmallXIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
const ChevronRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
const ChevronDown = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>

// --- Props Interface ---
interface SidebarProps {
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
  return (
    <aside className="w-full md:w-64 flex-shrink-0 md:sticky md:top-8 self-start space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Folders</h2>
      </div>

      <div className="flex flex-col gap-2 overflow-x-hidden md:overflow-visible pb-2 md:pb-0">
        <div
          onClick={() => { setActiveFilter('All'); setActiveSubFilter(null); }}
          className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${activeFilter === 'All' ? 'border-gray-900 bg-gray-900 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' : 'border-gray-300 bg-white hover:border-gray-900 text-gray-700'}`}
        >
           <span className="font-medium text-sm">All Bookmarks</span>
           <span className={`text-xs px-2 py-1 rounded-md ${activeFilter === 'All' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
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
                className={`group flex items-center justify-between px-3 py-2 rounded-xl border-2 transition-all ${isParentActive && !activeSubFilter ? 'border-gray-900 bg-gray-900 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' : 'border-gray-300 bg-white hover:border-gray-900 text-gray-700'}`}
              >
                <div className="flex items-center gap-2 overflow-hidden cursor-pointer flex-1" onClick={() => { setActiveFilter(parentFolder); setActiveSubFilter(null); }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFolderExpand(parentFolder); }}
                    className={`p-1 rounded hover:bg-gray-200/20 transition-colors ${isParentActive && !activeSubFilter ? 'text-white' : 'text-gray-500'}`}
                  >
                    {isExpanded ? <ChevronDown /> : <ChevronRight />}
                  </button>
                  <span className="font-medium text-sm truncate">{parentFolder}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-md ${isParentActive && !activeSubFilter ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                    {parentCount}
                  </span>
                  {customCategories.includes(parentFolder) && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(parentFolder); }} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400">
                      <SmallXIcon />
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="ml-6 pl-2 border-l-2 border-gray-200 flex flex-col gap-1 py-1">
                  {subfolders.map(sub => {
                    const isSubActive = isParentActive && activeSubFilter === sub;
                    const subCount = getCounts[`${parentFolder}::${sub}`] || 0;
                    return (
                      <div
                        key={sub}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, parentFolder, sub)}
                        onClick={() => { setActiveFilter(parentFolder); setActiveSubFilter(sub); }}
                        className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg border-2 cursor-pointer transition-all ${isSubActive ? 'border-gray-900 bg-gray-100 text-gray-900 font-bold' : 'border-transparent bg-transparent hover:border-gray-300 text-gray-600 hover:bg-white'}`}
                      >
                        <span className="truncate pr-2">{sub}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isSubActive ? 'bg-gray-300 text-gray-800' : 'bg-gray-200 text-gray-500'}`}>
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
                        className="w-full px-2 py-1.5 text-xs border-2 border-gray-900 rounded outline-none bg-white"
                      />
                      <button onClick={() => setCreatingSubFor(null)} className="px-2 text-xs font-bold text-gray-500 hover:text-gray-900">X</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCreatingSubFor(parentFolder)}
                      className="flex items-center gap-2 px-3 py-1.5 mt-1 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors text-left"
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

      <div className="pt-4 border-t-2 border-gray-200 border-dashed hidden md:block">
        {isAddingCategory ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              placeholder="Folder name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              className="w-full px-3 py-2 text-sm border-2 border-gray-900 rounded-lg outline-none bg-white focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            />
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCategory(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-900 hover:text-gray-900 hover:bg-white transition-all"
          >
            <PlusIcon /> New Folder
          </button>
        )}
      </div>
    </aside>
  )
}