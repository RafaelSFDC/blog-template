import { Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

export function Breadcrumbs() {
  return (
    <nav className="mb-8 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
      <Link 
        to="/blog" 
        search={{ q: undefined, page: 1 }}
        className="flex items-center gap-1 transition-colors hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar para Blog
      </Link>
    </nav>
  )
}
