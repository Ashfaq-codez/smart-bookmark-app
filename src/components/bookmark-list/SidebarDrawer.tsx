import { ComponentProps } from 'react'
import Sidebar from '@/components/Sidebar'

type SidebarProps = Omit<ComponentProps<typeof Sidebar>, 'isCollapsed' | 'isMobileMenuOpen' | 'setIsMobileMenuOpen'>

// The sidebar: always visible as a thin rail on large screens, a slide-in drawer on phones.
export default function SidebarDrawer({ isOpen, setOpen, ...sidebarProps }: { isOpen: boolean; setOpen: (open: boolean) => void } & SidebarProps) {
  return (
    <>
      <div className={`fixed top-0 left-0 h-screen z-[200] bg-[#FBF9F4] dark:bg-[#151815] transition-all duration-300 flex flex-col border-r border-black/[0.04] dark:border-white/[0.04] shadow-[4px_0_24px_rgba(0,0,0,0.02)] lg:translate-x-0 ${isOpen ? 'translate-x-0 w-[80vw] sm:w-[280px]' : '-translate-x-full lg:w-[72px]'}`}>
        <Sidebar
          {...sidebarProps}
          isCollapsed={!isOpen}
          isMobileMenuOpen={isOpen}
          setIsMobileMenuOpen={setOpen}
        />
      </div>

      {isOpen && (
        <div
          onClick={() => setOpen(false)}
          onTouchMove={() => setOpen(false)}
          onWheel={() => setOpen(false)}
          className="fixed inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-sm z-[150] transition-opacity lg:hidden"
        />
      )}
    </>
  )
}
