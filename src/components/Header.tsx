import { Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import BetterAuthHeader from '../integrations/better-auth/header-user.tsx'
import { Menu, X, Search as SearchIcon } from 'lucide-react'
import { authClient } from '#/lib/auth-client'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '#/components/ui/command'
import { Button } from '#/components/ui/button'

export default function Header() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsSearchOpen((open: boolean) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  async function onSearch(query: string) {
    const q = query.trim()
    await navigate({
      to: '/blog',
      search: { q } as any,
    })
    setIsSearchOpen(false)
    setIsMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 px-2 py-4 sm:px-4">
      <nav className="page-wrap island-shell rounded-2xl px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between w-full lg:w-auto">
            <Link to="/" className="inline-flex items-center gap-2 no-underline shrink-0">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-border bg-primary text-xl font-black text-white shadow-zine-sm sm:h-12 sm:w-12 sm:border-3 sm:text-2xl">
                V.
              </span>
              <span className="display-title text-2xl text-foreground whitespace-nowrap sm:text-3xl">
                Vibe<span className="text-primary italic">Zine</span>
              </span>
            </Link>

            <Button
              variant="zine-outline"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} strokeWidth={3} /> : <Menu size={20} strokeWidth={3} />}
            </Button>
          </div>

          <div
            className={`flex flex-col gap-4 lg:flex lg:flex-row lg:items-center lg:gap-6 ${
              isMenuOpen ? 'flex' : 'hidden'
            }`}
          >
            <Button
              variant="zine-outline"
              size="lg"
              onClick={() => setIsSearchOpen(true)}
              className="w-full justify-start gap-2 h-11 border-2 sm:border-3 lg:w-48 xl:w-64"
            >
              <SearchIcon size={18} strokeWidth={3} className="text-primary/60" />
              <span className="text-muted-foreground font-bold">Search...</span>
              <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} title="Search Stories" description="Type to search through all articles...">
              <CommandInput placeholder="Type to search..." onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearch(e.currentTarget.value)
                }
              }} />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  <CommandItem onSelect={() => onSearch('Design')}>🎨 Design</CommandItem>
                  <CommandItem onSelect={() => onSearch('Tech')}>🚀 Tech</CommandItem>
                  <CommandItem onSelect={() => onSearch('Culture')}>🧸 Culture</CommandItem>
                </CommandGroup>
              </CommandList>
            </CommandDialog>

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/" className="nav-link text-xs sm:text-sm" activeProps={{ className: 'nav-link is-active' }} onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              <Link to="/blog" search={{ q: '' }} className="nav-link text-xs sm:text-sm" activeProps={{ className: 'nav-link is-active' }} onClick={() => setIsMenuOpen(false)}>
                Stories
              </Link>
              <Link to="/about" className="nav-link text-xs sm:text-sm" activeProps={{ className: 'nav-link is-active' }} onClick={() => setIsMenuOpen(false)}>
                About
              </Link>
              {session && (
                <Link to="/dashboard" className="nav-link text-xs sm:text-sm" activeProps={{ className: 'nav-link is-active' }} onClick={() => setIsMenuOpen(false)}>
                  Dashboard
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-border pt-4 lg:border-none lg:pt-0">
              <BetterAuthHeader />
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
