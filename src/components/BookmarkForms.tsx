'use client'

import { useState } from 'react'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

interface BookmarkFormsProps {
  bookmarks: Bookmark[];
  folderHierarchy: Record<string, string[]>;
  addBookmark: (newBookmark: Omit<Bookmark, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  addBulkBookmarks: (newBookmarks: Omit<Bookmark, 'id' | 'created_at' | 'user_id'>[]) => Promise<void>;
}

export default function BookmarkForms({
  bookmarks,
  folderHierarchy,
  addBookmark,
  addBulkBookmarks
}: BookmarkFormsProps) {
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single')
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')

  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState('Open Tabs')
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSubCategoryOpen, setIsSubCategoryOpen] = useState(false);

  const formatUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim()
    return (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) ? 'https://' + trimmed : trimmed
  }

  const getDomain = (link: string) => {
    try { return new URL(link).hostname } catch { return 'link' }
  }

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !url.trim()) {
      toast.error("Please provide both a Title and a URL.");
      return;
    }

    const formatted = formatUrl(url);
    const finalCategory = category.trim() || 'Uncategorized';
    const finalSubCategory = subCategory.trim() || null;

    const existingBookmark = bookmarks.find(b => b.url === formatted);
    if (existingBookmark) {
      toast.error(`This link is already saved in '${existingBookmark.category}'!`);
      return;
    }

    await addBookmark({
      title: title.trim(),
      url: formatted,
      category: finalCategory,
      sub_category: finalSubCategory
    });
    setTitle(''); setUrl(''); setCategory(''); setSubCategory('');
  }

  const handleAddBulk = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bulkText.trim()) {
      toast.error("Please paste some URLs to extract.");
      return;
    }

    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    const foundUrls = bulkText.match(urlRegex);
    if (!foundUrls || foundUrls.length === 0) {
      toast.error("No valid URLs found in the text.");
      return;
    }

    const uniqueNewUrls = Array.from(new Set(foundUrls.map(formatUrl)));
    const finalUrlsToSave = uniqueNewUrls.filter(u => !bookmarks.some(b => b.url === u));
    if (finalUrlsToSave.length === 0) {
      toast.error("All URLs found in this text are already saved!");
      return;
    }

    const newRows = finalUrlsToSave.map((formattedUrl) => ({
      title: `${getDomain(formattedUrl)} Tab`,
      url: formattedUrl,
      category: bulkCategory.trim() || 'Open Tabs',
      sub_category: null
    }));
    await addBulkBookmarks(newRows);
    setBulkText(''); setBulkCategory('Open Tabs');
  }

  return (
    <>
      {/* ADDED: dark:bg-gray-800 to main wrapper */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-colors">
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setInputMode('single')} 
            className={`pb-2 text-sm font-bold transition-all ${inputMode === 'single' ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            Single Link
          </button>
          <button 
            onClick={() => setInputMode('bulk')} 
            className={`pb-2 text-sm font-bold transition-all ${inputMode === 'bulk' ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            Bulk Extract
          </button>
        </div>

        {inputMode === 'single' ? (
          <form onSubmit={handleAddSingle} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required 
                className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 transition-all" 
              />
              <input 
                type="url" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} required 
                className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 transition-all" 
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">

            {/* MAIN FOLDER DROPDOWN */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Main Folder"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onFocus={() => setIsCategoryOpen(true)}
                onBlur={() => setTimeout(() => setIsCategoryOpen(false), 200)}
                className="w-full px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 transition-all"
              />
              {isCategoryOpen && Object.keys(folderHierarchy).length > 0 && (
                <ul className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border-4 border-gray-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:dark:bg-gray-700 [&::-webkit-scrollbar-thumb]:bg-gray-900 [&::-webkit-scrollbar-thumb]:dark:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {Object.keys(folderHierarchy).filter(c => c.toLowerCase().includes(category.toLowerCase())).map(cat => (
                    <li 
                      key={cat} onClick={() => { setCategory(cat); setIsCategoryOpen(false); }} 
                      className="px-4 py-3 hover:bg-yellow-100 dark:hover:bg-gray-700 cursor-pointer font-bold text-sm text-gray-900 dark:text-white border-b-2 border-gray-100 dark:border-gray-700 last:border-none transition-colors"
                    >
                      {cat}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* SUBFOLDER DROPDOWN */}
            {category.trim().length > 0 && (
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Subfolder (Optional)"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  onFocus={() => setIsSubCategoryOpen(true)}
                  onBlur={() => setTimeout(() => setIsSubCategoryOpen(false), 200)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-400 dark:border-gray-500 focus:border-solid focus:border-gray-900 rounded-xl outline-none bg-slate-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 transition-all"
                />
                {isSubCategoryOpen && folderHierarchy[category] && folderHierarchy[category].length > 0 && (
                  <ul className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border-4 border-gray-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:dark:bg-gray-700 [&::-webkit-scrollbar-thumb]:bg-gray-900 [&::-webkit-scrollbar-thumb]:dark:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full">
                   {folderHierarchy[category].filter(sub => sub.toLowerCase().includes(subCategory.toLowerCase())).map(sub => (
                      <li 
                        key={sub} onClick={() => { setSubCategory(sub); setIsSubCategoryOpen(false); }} 
                        className="px-4 py-3 hover:bg-sky-100 dark:hover:bg-gray-700 cursor-pointer font-bold text-sm text-gray-900 dark:text-white border-b-2 border-gray-100 dark:border-gray-700 last:border-none transition-colors"
                      >
                        {sub}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <button type="submit" className="px-8 py-3 bg-[#99acc2] text-black font-bold border-2 border-gray-900 rounded-xl hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Save</button>
          </div>
          </form>
        ) : (
          <form onSubmit={handleAddBulk} className="flex flex-col gap-4">
            <textarea 
              placeholder="Paste text containing URLs here..." value={bulkText} onChange={(e) => setBulkText(e.target.value)} required 
              className="w-full px-4 py-3 border-2 border-gray-900 rounded-xl h-32 resize-y outline-none bg-slate-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 transition-all" 
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" list="category-options" placeholder="Folder for these tabs" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} 
                className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 transition-all" 
              />
              <button type="submit" className="px-6 py-3 bg-indigo-500 text-white font-bold border-2 border-gray-900 rounded-xl hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Extract & Save</button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}