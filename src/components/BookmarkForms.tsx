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

  const formatUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim()
    return (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) ? 'https://' + trimmed : trimmed
  }

  const getDomain = (link: string) => {
    try { return new URL(link).hostname } catch { return 'link' }
  }

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // FIX: Add a toast warning instead of failing silently
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
    
    // FIX: Add a toast warning instead of failing silently
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
              {/* FIX: Added 'required' attribute to inputs */}
              <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white transition-all" />
              <input type="url" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} required className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white transition-all" />
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
            {/* FIX: Added 'required' attribute to textarea */}
            <textarea placeholder="Paste text containing URLs here..." value={bulkText} onChange={(e) => setBulkText(e.target.value)} required className="w-full px-4 py-3 border-2 border-gray-900 rounded-xl h-32 resize-y outline-none bg-slate-50 focus:bg-white transition-all" />
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
