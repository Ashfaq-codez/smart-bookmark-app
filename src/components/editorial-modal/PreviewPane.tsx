import { Bookmark } from '@/types'
import TipTapEditor from '../editor/TipTapEditor'
import { ModalEdits } from './useModalEdits'
import { toEditorHtml } from './toEditorHtml'
import TwitterPreview from './previews/TwitterPreview'
import { RedditPreview } from '../social/RedditCard'
import { ArticlePreview } from '../social/ArticleCard'
import { SubstackNotePreview } from '../social/SubstackNoteCard'
import { HackerNewsPreview, SpotifyPreview, ThreadsPreview, LinkedInPreview } from '../social/MoreSocialCards'
import InstagramPreview from './previews/InstagramPreview'
import PinterestPreview from './previews/PinterestPreview'
import ImagePreview from './previews/ImagePreview'
import LinkPreview from './previews/LinkPreview'
import { YouTubePreview, GooglePreview, TikTokPreview, VideoPreview, PdfPreview } from './previews/EmbedPreviews'

// The left-hand side of the editor: the note editor for notes, otherwise a preview that matches the kind of save.
export default function PreviewPane({ bookmark, displayType, previewImageUrl, edits, onFullscreenImage, getDomain, onCyclePreview }: {
  bookmark: Bookmark
  displayType: string
  previewImageUrl?: string
  edits: ModalEdits
  onFullscreenImage: (url: string) => void
  getDomain: (url: string) => string
  onCyclePreview?: () => void
}) {
  const { editTitle, editDescription, editContent, setEditContent, handleAutoSave } = edits

  return (
    <div className={`w-full md:w-[60%] flex flex-col shrink-0 md:shrink border-b md:border-b-0 md:border-r border-black/[0.04] dark:border-white/[0.04] transition-colors duration-500 ${displayType === 'note' ? 'bg-[#FAF9F5] dark:bg-[#0F120F]' : 'bg-white dark:bg-[#1A1D1A]'} md:h-full md:overflow-hidden`}>
      {displayType === 'note' ? (
        <div className="inntoit-note-pane w-full flex flex-col relative bg-[#FAF9F5] dark:bg-[#0F120F] h-auto min-h-[50dvh] md:h-full">
          {/* Scoped to this pane only: the shared editor zeroes <p> margins, which made saved paragraphs run together */}
          <style>{`.inntoit-note-pane .tiptap > p { margin-bottom: 0.85em !important; }`}</style>
          <TipTapEditor value={toEditorHtml(editContent || '')} onChange={setEditContent} onBlur={handleAutoSave} isExpanded={true} />
        </div>
      ) : displayType === 'twitter' ? (
        <TwitterPreview bookmark={bookmark} />
      ) : displayType === 'reddit' ? (
        <RedditPreview bookmark={bookmark} />
      ) : displayType === 'hackernews' ? (
        <HackerNewsPreview bookmark={bookmark} />
      ) : displayType === 'spotify' ? (
        <SpotifyPreview bookmark={bookmark} />
      ) : displayType === 'threads' ? (
        <ThreadsPreview bookmark={bookmark} />
      ) : displayType === 'linkedin' ? (
        <LinkedInPreview bookmark={bookmark} />
      ) : displayType === 'substack-note' ? (
        <SubstackNotePreview bookmark={bookmark} />
      ) : displayType === 'substack' || displayType === 'medium' ? (
        <ArticlePreview bookmark={bookmark} platform={displayType} />
      ) : displayType === 'instagram' ? (
        <InstagramPreview bookmark={bookmark} previewImageUrl={previewImageUrl} title={editTitle} description={editDescription} content={editContent} />
      ) : displayType === 'pinterest' ? (
        <PinterestPreview bookmark={bookmark} previewImageUrl={previewImageUrl} onFullscreenImage={onFullscreenImage} getDomain={getDomain} />
      ) : displayType === 'youtube' ? (
        <YouTubePreview bookmark={bookmark} />
      ) : displayType === 'google' ? (
        <GooglePreview bookmark={bookmark} />
      ) : displayType === 'tiktok' ? (
        <TikTokPreview bookmark={bookmark} previewImageUrl={previewImageUrl} />
      ) : displayType === 'video' ? (
        <VideoPreview bookmark={bookmark} />
      ) : displayType === 'pdf' ? (
        <PdfPreview bookmark={bookmark} />
      ) : displayType === 'image' ? (
        <ImagePreview bookmark={bookmark} previewImageUrl={previewImageUrl} onFullscreenImage={onFullscreenImage} />
      ) : (
        <LinkPreview bookmark={bookmark} previewImageUrl={previewImageUrl} getDomain={getDomain} onCyclePreview={onCyclePreview} />
      )}
    </div>
  )
}
