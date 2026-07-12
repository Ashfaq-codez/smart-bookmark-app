'use client'

import { useState } from 'react'
import { Bookmark } from '@/types'

// --- Props Interface ---
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
  // Local Form State
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single')
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')

  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState('Open Tabs')

  // Helpers
  const formatUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim()
    return (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) ? 'https://' + trimmed : trimmed
  }

  const getDomain = (link: string) => {
    try { return new URL(link).hostname } catch { return 'link' }
  }

  // Handlers
  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return
    const formatted = formatUrl(url);
    const finalCategory = category.trim() || 'Uncategorized';
    const finalSubCategory = subCategory.trim() || null;

    const existingBookmark = bookmarks.find(b => b.url === formatted);
    if (existingBookmark) {
      alert(`This bookmark is already saved in the '${existingBookmark.category}' folder!`);
      return;
    }

    await addBookmark({ 
      title, 
      url: formatted, 
      category: finalCategory, 
      sub_category: finalSubCategory 
    });
    
    setTitle(''); setUrl(''); setCategory(''); setSubCategory('');
  }

  const handleAddBulk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkText.trim()) return
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    const foundUrls = bulkText.match(urlRegex);
    if (!foundUrls || foundUrls.length === 0) return alert("No valid URLs found in the text.");

    const uniqueNewUrls = Array.from(new Set(foundUrls.map(formatUrl)));
    const finalUrlsToSave = uniqueNewUrls.filter(u => !bookmarks.some(b => b.url === u));

    if (finalUrlsToSave.length === 0) return alert("All URLs found in the text are already saved in your collection!");

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
      <datalist id="category-options">
        {Object.keys(folderHierarchy).map(cat => (
          <option key={cat} value={cat} />
        ))}
      </datalist>

      <datalist id="subcategory-options">
        {Object.values(folderHierarchy).flat().filter((value, index, array) => array.indexOf(value) === index).map(sub => (
          <option key={sub} value={sub} />
        ))}
      </datalist>

      <div className="bg-white border-2 border-gray-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex gap-4 mb-6">
          <button onClick={() => setInputMode('single')} className={`pb-2 text-sm font-bold transition-all ${inputMode === 'single' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
            Single Link
          </button>
          <button onClick={() => setInputMode('bulk')} className={`pb-2 text-sm font-bold transition-all ${inputMode === 'bulk' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
            Bulk Extract
          </button>
        </div>

        {inputMode === 'single' ? (
          <form onSubmit={handleAddSingle} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white transition-all" />
              <input type="url" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white transition-all" />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <input type="text" list="category-options" placeholder="Main Folder" value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white transition-all" />
              {category.trim().length > 0 && (
                <input type="text" list="subcategory-options" placeholder="Subfolder (Optional)" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="flex-1 px-4 py-3 border-2 border-dashed border-gray-400 focus:border-solid focus:border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white transition-all" />
              )}
              <button type="submit" className="px-8 py-3 bg-[#E06D53] text-white font-bold border-2 border-gray-900 rounded-xl hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Save</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddBulk} className="flex flex-col gap-4">
            <textarea placeholder="Paste text containing URLs here..." value={bulkText} onChange={(e) => setBulkText(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-900 rounded-xl h-32 resize-y outline-none bg-slate-50 focus:bg-white transition-all" />
            <div className="flex flex-col sm:flex-row gap-4">
              <input type="text" list="category-options" placeholder="Folder for these tabs" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white transition-all" />
              <button type="submit" className="px-6 py-3 bg-indigo-500 text-white font-bold border-2 border-gray-900 rounded-xl hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Extract & Save</button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}