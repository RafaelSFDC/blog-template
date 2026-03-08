import { Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

export function Breadcrumbs() {
  return (
    <nav className="mb-8 flex items-center gap-2 text-sm font-semibold text-(--sea-ink-soft)">
      <Link 
        to="/blog" 
        search={{ q: '', category: '' }}
        className="flex items-center gap-1 transition-colors hover:text-(--lagoon-deep)"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar para Blog
      </Link>
    </nav>
  )
}
