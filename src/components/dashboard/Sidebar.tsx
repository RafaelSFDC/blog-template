import { Link, useLocation } from '@tanstack/react-router'
import { LayoutDashboard, FileText, Settings, LogOut, Image, Tags, Library, Users, FolderTree, MessageSquare, Mail, Inbox, Webhook, BarChart3 } from 'lucide-react'
import { authClient } from '#/lib/auth-client'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel
} from '#/components/ui/sidebar'

const sidebarLinks = [
  {
    label: 'Overview',
    icon: LayoutDashboard,
    to: '/dashboard',
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    to: '/dashboard/analytics',
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
  const location = useLocation()

  const filteredLinks = sidebarLinks.filter(link => {
    if (!role) return false;
    
    // Super Admin and Admin see everything
    if (role === 'super-admin' || role === 'admin') return true;

    // Moderator specifics
    if (role === 'moderator') {
       return ['Overview', 'Analytics', 'Comments', 'Users', 'Messages'].includes(link.label);
    }

    // Editor specifics
    if (role === 'editor') {
       return ['Overview', 'Analytics', 'Posts', 'Categories', 'Tags', 'Comments', 'Newsletter', 'Media', 'Pages', 'Messages'].includes(link.label);
    }

    // Author specifics
    if (role === 'author') {
       return ['Overview', 'Posts', 'Media'].includes(link.label);
    }

    // Reader has no business here (already protected by route, but safety first)
    return false;
  });

  return (
    <Sidebar className="border-r-4 border-border">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black">
                  V
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold uppercase tracking-tight">
                    Vibe<span className="text-primary">Zine</span>
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarMenu>
            {filteredLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <SidebarMenuItem key={link.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={link.label}
                  >
                    <Link to={link.to}>
                      <link.icon />
                      <span>{link.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
         <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                onClick={() => {
                  void authClient.signOut().then(() => {
                      window.location.href = '/auth/login';
                  });
                }}
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? ''} />
                  <AvatarFallback className="rounded-lg">{session?.user?.name ? session.user.name.charAt(0) : 'U'}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{session?.user?.name}</span>
                  <span className="truncate text-xs">{session?.user?.email}</span>
                </div>
                <LogOut className="ml-auto size-4" />
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

