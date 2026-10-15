import { useState, useMemo } from 'react'
import { UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { Bookmark } from '@/types'
import { InstagramIcon, InstaHeartIcon, InstaCommentIcon, InstaShareIcon, InstaSaveIcon, InstaDotsIcon } from '../../BookmarkIcons'
import { isVideoMedia, formatDate, getInstaMeta, renderInstagramText } from '@/utils/bookmarkHelpers'

export default function InstagramPreview({ bookmark, previewImageUrl, title, description, content }: { bookmark: Bookmark; previewImageUrl?: string; title: string; description: string; content: string }) {
  const [igLiked, setIgLiked] = useState(false)
  const [igSaved, setIgSaved] = useState(false)
  const [showIgHeartAnim, setShowIgHeartAnim] = useState(false)
  const [igComments] = useState<string[]>([])

  // Uses what is being typed in the editor right now, so the preview follows the edits.
  const instaData = getInstaMeta({ ...bookmark, title, description, content })
  const likes = instaData.likes
  const displayedLikes = useMemo(() => {
    if (!likes) return null
    if (!igLiked) return likes
    const rawNum = parseInt(likes.replace(/,/g, ''), 10)
    if (!isNaN(rawNum)) return (rawNum + 1).toLocaleString()
    return `${likes}`
  }, [likes, igLiked])

  const handleIgDoubleTap = () => {
    if (!igLiked) setIgLiked(true)
    setShowIgHeartAnim(true)
    setTimeout(() => setShowIgHeartAnim(false), 800)
  }

  return (
        <div className="w-full flex bg-[#FAFAFA] dark:bg-[#000000] p-0 md:p-4 py-8 md:h-full md:overflow-y-auto custom-scrollbar justify-center">
          <div className="w-full md:max-w-[470px] bg-white dark:bg-[#000000] md:border border-black/[0.08] dark:border-[#262626] md:rounded-[3px] flex flex-col m-auto md:my-auto">
            <div className="flex items-center justify-between p-3 shrink-0">
              {/* Unknown poster: no @ line at all (never a placeholder name) */}
              {instaData.username ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 p-[1.5px]">
                    <div className="w-full h-full bg-white dark:bg-black rounded-full flex items-center justify-center text-[#737373] dark:text-[#A8A8A8]">
                      <UserRound className="w-4 h-4" aria-hidden />
                    </div>
                  </div>
                  <a href={`https://www.instagram.com/${instaData.username}/`} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold font-sans text-[#262626] dark:text-[#F5F5F5] leading-tight hover:underline">
                    {instaData.username}
                  </a>
                </div>
              ) : <span />}
              <a href={bookmark.url} target="_blank" rel="noreferrer" title="Open on Instagram" className="text-[#262626] dark:text-[#F5F5F5] hover:opacity-60 transition-opacity p-1">
                <InstaDotsIcon />
              </a>
            </div>
            <div className="w-full bg-[#FAFAFA] dark:bg-[#262626] relative shrink-0 flex items-center justify-center border-y border-black/[0.04] dark:border-[#262626] min-h-[300px] select-none cursor-pointer" onDoubleClick={handleIgDoubleTap}>
              {isVideoMedia(bookmark.image_url) ? (
                 <video src={bookmark.image_url!} autoPlay={true} muted={true} playsInline={true} loop={true} className="w-full h-auto max-h-[585px] object-contain block" />
              ) : (
                 previewImageUrl ? (
                   <img src={previewImageUrl} alt={instaData.caption || bookmark.title || "Instagram post"} className="w-full h-auto max-h-[585px] object-contain block" />
                 ) : (
                   <div className="flex flex-col items-center justify-center text-[#737373] dark:text-[#A8A8A8] gap-3 p-10">
                      <InstagramIcon className="w-12 h-12 opacity-50" />
                      <span className="text-sm font-medium">Image protected by Instagram</span>
                   </div>
                 )
              )}
              {showIgHeartAnim && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping duration-700">
                  <svg className="w-24 h-24 text-white drop-shadow-2xl fill-white" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
              )}
            </div>
            <div className="px-4 pt-3 pb-4 flex flex-col gap-1.5 shrink-0 font-sans">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-4 text-[#262626] dark:text-[#F5F5F5]">
                  <button onClick={() => { setIgLiked(!igLiked); if (!igLiked) { setShowIgHeartAnim(true); setTimeout(() => setShowIgHeartAnim(false), 800); } }} className="hover:opacity-60 transition-opacity cursor-pointer focus:outline-none">
                    {igLiked ? <svg className="w-6 h-6 text-[#FF3040] fill-[#FF3040]" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> : <InstaHeartIcon />}
                  </button>
                  <button className="hover:opacity-60 transition-opacity cursor-pointer focus:outline-none text-[#262626] dark:text-[#F5F5F5]"><InstaCommentIcon /></button>
                  <button onClick={() => { if (bookmark.url) { navigator.clipboard.writeText(bookmark.url); toast.success('Instagram link copied!', { duration: 1500 }); } }} className="hover:opacity-60 transition-opacity cursor-pointer focus:outline-none text-[#262626] dark:text-[#F5F5F5]"><InstaShareIcon /></button>
                </div>
                <button onClick={() => { setIgSaved(!igSaved); toast.success(igSaved ? 'Removed from saved' : 'Saved to collection', { duration: 1500 }); }} className="hover:opacity-60 transition-opacity cursor-pointer focus:outline-none text-[#262626] dark:text-[#F5F5F5]">
                  {igSaved ? <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="20 21 12 13.44 4 21 4 3 20 3 20 21" /></svg> : <InstaSaveIcon />}
                </button>
              </div>
              {displayedLikes && <div className="text-[14px] font-semibold text-[#262626] dark:text-[#F5F5F5]">{displayedLikes} likes</div>}
              {instaData.caption && (
                <div className="text-[14px] text-[#262626] dark:text-[#F5F5F5] leading-snug mt-1 break-words">
                  {instaData.username && <a href={`https://www.instagram.com/${instaData.username}/`} target="_blank" rel="noopener noreferrer" className="font-semibold mr-1.5 hover:underline text-[#262626] dark:text-[#F5F5F5]">{instaData.username}</a>}
                  <span className="whitespace-pre-wrap">{renderInstagramText(instaData.caption)}</span>
                </div>
              )}
              {igComments.map((c, idx) => (
                <div key={idx} className="text-[14px] text-[#262626] dark:text-[#F5F5F5] leading-snug"><span className="font-semibold mr-1.5">you</span><span>{c}</span></div>
              ))}
              <div className="text-[14px] text-[#737373] dark:text-[#A8A8A8] mt-1 cursor-pointer hover:underline">View all comments</div>
              <div className="text-[10px] text-[#737373] dark:text-[#A8A8A8] uppercase mt-1 tracking-wide font-normal">{formatDate(bookmark.created_at)}</div>
            </div>
          </div>
        </div>
  )
}
