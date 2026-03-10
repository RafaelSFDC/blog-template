import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Image,
  Tags,
  Library,
  Users,
  FolderTree,
  MessageSquare,
  Mail,
  Inbox,
  Webhook,
  BarChart3,
} from "lucide-react";
import { authClient } from "#/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "#/components/ui/sidebar";
import { cn } from "#/lib/utils";

const sidebarLinks = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    to: "/dashboard",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    to: "/dashboard/analytics",
  },
  {
    label: "Posts",
    icon: FileText,
    to: "/dashboard/posts",
  },
  {
    label: "Categories",
    icon: FolderTree,
    to: "/dashboard/categories",
  },
  {
    label: "Tags",
    icon: Tags,
    to: "/dashboard/tags",
  },
  {
    label: "Comments",
    icon: MessageSquare,
    to: "/dashboard/comments",
  },
  {
    label: "Newsletter",
    icon: Mail,
    to: "/dashboard/newsletters",
  },
  {
    label: "Messages",
    icon: Inbox,
    to: "/dashboard/messages",
  },
  {
    label: "Media",
    icon: Image,
    to: "/dashboard/media",
  },
  {
    label: "Pages",
    icon: Library,
    to: "/dashboard/pages",
  },
  {
    label: "Users",
    icon: Users,
    to: "/dashboard/users",
  },
  {
    label: "Webhooks",
    icon: Webhook,
    to: "/dashboard/webhooks",
  },
  {
    label: "Settings",
    icon: Settings,
    to: "/dashboard/settings",
  },
];

export function DashboardSidebar() {
  const { data: session } = authClient.useSession();
  const role = session?.user.role;
  const location = useLocation();

  const filteredLinks = sidebarLinks.filter((link) => {
    if (!role) return false;

    // Super Admin and Admin see everything
    if (role === "super-admin" || role === "admin") return true;

    // Moderator specifics
    if (role === "moderator") {
      return [
        "Overview",
        "Analytics",
        "Comments",
        "Users",
        "Messages",
      ].includes(link.label);
    }

    // Editor specifics
    if (role === "editor") {
      return [
        "Overview",
        "Analytics",
        "Posts",
        "Categories",
        "Tags",
        "Comments",
        "Newsletter",
        "Media",
        "Pages",
        "Messages",
      ].includes(link.label);
    }

    // Author specifics
    if (role === "author") {
      return ["Overview", "Posts", "Media"].includes(link.label);
    }

    // Reader has no business here (already protected by route, but safety first)
    return false;
  });

  return (
    <Sidebar className="border-r-4 border-border">
      {/* Logo / Brand */}
      <SidebarHeader className="border-b-4 border-border px-5 py-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border-2 border-foreground bg-primary text-primary-foreground font-black text-base shadow-[2px_2px_0px_0px] shadow-foreground group-hover:shadow-none group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-all">
            V
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-black uppercase tracking-widest text-sm text-foreground">
              Vibe<span className="text-primary">Zine</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Dashboard
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarMenu className="gap-0.5">
            {filteredLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <SidebarMenuItem key={link.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={link.label}
                    className={cn(
                      "h-9 rounded-md px-3 text-sm font-semibold tracking-tight transition-all",
                      "text-muted-foreground hover:text-foreground hover:bg-accent",
                      isActive && [
                        "bg-foreground! text-background! font-black",
                        "shadow-none",
                      ],
                    )}
                  >
                    <Link to={link.to}>
                      <link.icon className="size-4 shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t-4 border-border px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-auto rounded-md border-2 border-transparent px-3 py-2.5 hover:border-foreground hover:shadow-[2px_2px_0px_0px] hover:shadow-foreground transition-all group"
              onClick={() => {
                void authClient.signOut().then(() => {
                  window.location.href = "/auth/login";
                });
              }}
            >
              <Avatar className="h-8 w-8 rounded-md border-2 border-border shrink-0">
                <AvatarImage
                  src={session?.user?.image ?? undefined}
                  alt={session?.user?.name ?? ""}
                />
                <AvatarFallback className="rounded-md bg-primary text-primary-foreground font-black text-xs">
                  {session?.user?.name
                    ? session.user.name.charAt(0).toUpperCase()
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-xs font-black uppercase tracking-widest text-foreground">
                  {session?.user?.name}
                </span>
                <span className="truncate text-[10px] font-medium text-muted-foreground">
                  {session?.user?.email}
                </span>
              </div>
              <LogOut className="ml-auto size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
