import React from 'react'
import { cn } from '#/lib/utils'

interface DashboardPageContainerProps {
  children: React.ReactNode
  className?: string
}

/**
 * A standardized container for dashboard pages to ensure consistent
 * width, padding, and vertical spacing (gaps) across the application.
 */
export function DashboardPageContainer({ 
  children, 
  className 
}: DashboardPageContainerProps) {
  return (
    <div className={cn(
      "space-y-10 w-full max-w-7xl mx-auto pb-10",
      className
    )}>
      {children}
    </div>
  )
}
