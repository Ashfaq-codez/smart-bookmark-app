import { useState, useEffect, useRef } from 'react'
import { Prefs } from '@/lib/preferences'

// How many columns the grid has right now (follows the width of the screen and the person's choice).
// `isLoading` stays true for a moment on first load so skeleton cards show instead of a jump.
export function useGridColumns(userColPreference: Prefs['columns']) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [columnsCount, setColumnsCount] = useState(2)
  const [isLoading, setIsLoading] = useState(true)

  // Strict Mobile 2-Column Logic & Desktop Scaling
  useEffect(() => {
    const updateColumns = () => {
      if (!gridRef.current) return
      const width = gridRef.current.offsetWidth
      
      if (width < 640) {
        setColumnsCount(2) // Lock mobile specifically to 2 columns
        return
      }

      if (userColPreference !== 'auto') {
        setColumnsCount(userColPreference)
        return
      }

      if (width >= 1600) setColumnsCount(6)
      else setColumnsCount(5)
    }

    const observer = new ResizeObserver(updateColumns)
    if (gridRef.current) observer.observe(gridRef.current)
    updateColumns()
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => { observer.disconnect(); clearTimeout(timer) }
  }, [userColPreference])

  return { gridRef, columnsCount, isLoading }
}
