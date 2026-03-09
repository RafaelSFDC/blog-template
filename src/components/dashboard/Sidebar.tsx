import { Link } from '@tanstack/react-router'
import { LayoutDashboard, FileText, Settings, LogOut, ChevronRight, Image, Tags, Library, Users, FolderTree, MessageSquare, Mail, Inbox, Webhook } from 'lucide-react'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'

const sidebarLinks = [
  {
    label: 'Overview',
    icon: LayoutDashboard,
    to: '/dashboard',
  },
  {
    label: 'Posts',
    icon: FileText,
    to: '/dashboard/posts',
  },
  {
    label: 'Categories',
    icon: FolderTree,
    to: '/dashboard/categories',
  },
  {
    label: 'Tags',
    icon: Tags,
    to: '/dashboard/tags',
  },
  {
    label: 'Comments',
    icon: MessageSquare,
    to: '/dashboard/comments',
  },
  {
    label: 'Newsletter',
    icon: Mail,
    to: '/dashboard/newsletters',
  },
  {
    label: 'Messages',
    icon: Inbox,
    to: '/dashboard/messages',
  },
  {
    label: 'Media',
    icon: Image,
    to: '/dashboard/media',
  },
  {
    label: 'Pages',
    icon: Library,
    to: '/dashboard/pages',
  },
  {
    label: 'Users',
    icon: Users,
    to: '/dashboard/users',
  },
  {
    label: 'Webhooks',
    icon: Webhook,
    to: '/dashboard/webhooks',
  },
  {
    label: 'Settings',
    icon: Settings,
    to: '/dashboard/settings',
  },
]

export function DashboardSidebar() {
  const { data: session } = authClient.useSession()
  const role = session?.user.role

  const filteredLinks = sidebarLinks.filter(link => {
    if (!role) return false;
    
    // Super Admin and Admin see everything
    if (role === 'super-admin' || role === 'admin') return true;

    // Moderator specifics
    if (role === 'moderator') {
       return ['Overview', 'Comments', 'Users', 'Messages'].includes(link.label);
    }

    // Editor specifics
    if (role === 'editor') {
       return ['Overview', 'Posts', 'Categories', 'Tags', 'Comments', 'Newsletter', 'Media', 'Pages', 'Messages'].includes(link.label);
    }

    // Author specifics
    if (role === 'author') {
       return ['Overview', 'Posts', 'Media'].includes(link.label);
    }

    // Reader has no business here (already protected by route, but safety first)
    return false;
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r-4 border-border bg-card shadow-zine-sm transition-transform lg:static lg:translate-x-0">
      <div className="flex h-20 items-center border-b-4 border-border px-8">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xl shadow-zine-sm">
            V
          </div>
          <span className="display-title text-2xl font-black text-foreground uppercase tracking-tight">
            Vibe<span className="text-primary">Zine</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-6 space-y-2">
        <p className="px-2 pb-4 text-[0.65rem] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
          Management
        </p>
        {filteredLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            activeProps={{
              className: 'bg-primary text-primary-foreground border-primary shadow-zine-sm translate-x-1',
            }}
            inactiveProps={{
              className: 'text-foreground hover:bg-muted hover:border-border hover:translate-x-1',
            }}
            className="group flex items-center justify-between rounded-xl border-3 border-transparent px-4 py-3.5 text-sm font-black transition-all no-underline"
          >
            <div className="flex items-center gap-3">
              <link.icon size={20} className="shrink-0" />
              <span className="uppercase tracking-wider">{link.label}</span>
            </div>
            <ChevronRight size={16} className="opacity-0 transition-opacity group-hover:opacity-100 group-[.bg-primary]:opacity-100" />
          </Link>
        ))}
      </nav>

      <div className="border-t-4 border-border bg-muted/30 p-6">
        <div className="mb-6 flex items-center gap-4 px-2">
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary/20 bg-background relative">
             {session?.user.image ? (
               <img src={session.user.image} alt={session.user.name} className="h-full w-full object-cover" />
             ) : (
               <div className="flex h-full w-full items-center justify-center font-bold text-muted-foreground uppercase text-xs">
                 {session?.user.name ? session.user.name.charAt(0) : 'U'}
               </div>
             )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
                <p className="truncate text-[10px] font-black text-foreground uppercase tracking-tight">
                   {session?.user.name}
                </p>
                <span className="text-[8px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 uppercase tracking-tighter shrink-0">
                    {role}
                </span>
            </div>
            <p className="truncate text-[9px] font-bold text-muted-foreground">
              {session?.user.email}
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
              void authClient.signOut().then(() => {
                  window.location.href = '/dashboard/login';
              });
          }}
          variant="destructive"
          className="w-full justify-start gap-3 rounded-xl border-3 border-destructive/20 bg-destructive/5 px-4 py-6 font-black text-destructive hover:bg-destructive hover:text-white transition-all shadow-zine-sm active:scale-95"
        >
          <LogOut size={20} />
          <span className="uppercase tracking-widest text-xs">Sign Out</span>
        </Button>
      </div>
    </aside>
  )
}

