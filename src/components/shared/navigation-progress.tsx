'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { ProgressVine } from '@/components/ui/page-loader'

function NavigationProgressInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clear = () => timerRef.current.forEach(clearTimeout)

  useEffect(() => {
    clear()
    setVisible(true)
    setProgress(0)

    const t1 = setTimeout(() => setProgress(30), 50)
    const t2 = setTimeout(() => setProgress(60), 200)
    const t3 = setTimeout(() => setProgress(85), 400)
    const t4 = setTimeout(() => setProgress(100), 600)
    const t5 = setTimeout(() => setVisible(false), 900)

    timerRef.current = [t1, t2, t3, t4, t5]
    return clear
  }, [pathname, searchParams])

  if (!visible) return null
  return <ProgressVine progress={progress} />
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  )
}
