import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { createServerFn } from "@tanstack/react-start";
import { authClient } from "#/lib/auth-client";
import { requireAdminSession } from "#/lib/admin-auth";
import {
  Shield,
  User as UserIcon,
  MoreVertical,
  Trash2,
  Ban,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import { StatusBadge } from "#/components/ui/status-badge";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "#/components/dashboard/DataTable";

const ensureAdmin = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminSession();
  return { ok: true };
});

export const Route = createFileRoute("/dashboard/users/")({
  beforeLoad: async () => {
    try {
      await ensureAdmin();
    } catch {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: UsersManagementPage,
});

const ROLES = [
  "reader",
  "author",
  "editor",
  "moderator",
  "admin",
  "super-admin",
] as const;

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  role?: string | null;
  createdAt: string | Date | null;
};

function UsersManagementPage() {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await authClient.admin.listUsers({
        query: {},
      });

      if (error) {
        toast.error("Failed to load users");
      } else {
        setUsers(data.users as AdminUser[]);
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = useCallback(async (userId: string, newRole: string) => {
    if (userId === currentUserId) {
      toast.error("You cannot change your own role");
      return;
    }
    try {
      const { error } = await authClient.admin.setRole({
        userId,
        // @ts-expect-error - dynamic role string
        role: newRole,
      });

      if (error) {
        toast.error(error.message || "Failed to update role");
      } else {
        toast.success(`Role updated to ${newRole}`);
        fetchUsers();
      }
    } catch {
      toast.error("An error occurred");
    }
  }, [currentUserId, fetchUsers]);

  const handleBanUser = useCallback(async (userId: string) => {
    if (userId === currentUserId) {
      toast.error("You cannot ban yourself");
      return;
    }
    console.log("Banning user:", userId);
    toast.info("Ban functionality coming soon");
  }, [currentUserId]);

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Identity",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl overflow-hidden border border-border shrink-0 bg-background">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-black text-muted-foreground bg-muted/50 text-xs">
                    {user.name?.[0] || <UserIcon size={18} />}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Access Level",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={user.id === currentUserId}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={user.id === currentUserId}
                >
                  {user.role}
                  <ChevronRight className="rotate-90" size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-48 rounded-xl border bg-card p-2 shadow-md border-border"
              >
                <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground p-2">
                  Change Level
                </DropdownMenuLabel>
                {ROLES.map((r) => (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => handleRoleChange(user.id, r)}
                    className={`rounded-lg p-3 text-xs font-semibold uppercase tracking-wider cursor-pointer ${user.role === r ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                  >
                    {r}
                    {user.role === r && (
                      <CheckCircle2 className="ml-auto" size={14} />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: () => (
          <StatusBadge variant="default" className="rounded-full">
            Active
          </StatusBadge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Join Date",
        cell: ({ row }) => (
          <div className="text-xs font-bold text-muted-foreground">
            {new Date(row.getValue("createdAt")).toLocaleDateString()}
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  disabled={user.id === currentUserId}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-muted-foreground hover:text-foreground"
                    disabled={user.id === currentUserId}
                  >
                    <MoreVertical size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-xl border shadow-md border-border bg-card"
                >
                  <DropdownMenuItem
                    onClick={() => handleBanUser(user.id)}
                    className="text-warning-foreground font-bold flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-warning/10"
                  >
                    <Ban size={16} /> Ban User
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive font-bold flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-destructive/5">
                    <Trash2 size={16} /> Delete Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [currentUserId, handleBanUser, handleRoleChange],
  );

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Identity Control"
        description="Manage your editorial team and community members. Audit access levels and identities."
        icon={Shield}
        iconLabel="Security & Access"
      />

      <div className="grid gap-6">
        <DataTable
          columns={columns}
          data={users}
          isLoading={loading}
          searchKey="name"
          searchPlaceholder="Search users..."
        />
      </div>
    </DashboardPageContainer>
  );
}
