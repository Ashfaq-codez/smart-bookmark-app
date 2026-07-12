'use client'

export default function BookmarkSkeleton() {
  return (
    <div className="flex flex-col bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(229,231,235,1)] animate-pulse">
      
      {/* Thumbnail Placeholder */}
      <div className="w-full aspect-video bg-gray-200 border-b-2 border-gray-100"></div>

      {/* Text & Metadata Placeholder */}
      <div className="p-4 flex flex-col min-h-[95px] gap-3 bg-gray-50 flex-1">
        
        {/* Title Placeholder */}
        <div className="h-4 bg-gray-300 rounded-md w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded-md w-1/2"></div>
        
        {/* Domain & Category Placeholder */}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <div className="w-3 h-3 bg-gray-300 rounded-full shrink-0"></div>
          <div className="h-3 bg-gray-300 rounded-md w-1/4"></div>
          
          <div className="h-4 bg-gray-300 rounded-md w-1/3 ml-auto"></div>
        </div>
      </div>
    </div>
  )
}