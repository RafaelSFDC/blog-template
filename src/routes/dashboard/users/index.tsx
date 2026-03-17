import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardHeader } from "#/components/dashboard/Header";
import { DashboardPageContainer } from "#/components/dashboard/DashboardPageContainer";
import { authClient } from "#/lib/auth-client";
import {
  Shield,
  User as UserIcon,
  CheckCircle2,
  ChevronRight,
  MailPlus,
  Copy,
  Ban,
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
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "#/components/dashboard/DataTable";
import { createInvitation, listInvitations, revokeInvitation } from "#/server/actions/invitation-actions";
import { checkAdminAccess } from "#/server/actions/system/dashboard-access";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { Field, FieldLabel } from "#/components/ui/field";

export const Route = createFileRoute("/dashboard/users/")({
  beforeLoad: async () => {
    try {
      await checkAdminAccess();
    } catch {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: () => listInvitations(),
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

type Invitation = Awaited<ReturnType<typeof listInvitations>>[number];

function UsersManagementPage() {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;
  const initialInvitations = Route.useLoaderData() as Invitation[];
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitationEmail, setInvitationEmail] = useState("");
  const [invitationRole, setInvitationRole] = useState("author");
  const [inviting, setInviting] = useState(false);
  const [invitations, setInvitations] = useState(initialInvitations);

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

  const refreshInvitations = useCallback(async () => {
    try {
      const nextInvitations = await listInvitations();
      setInvitations(nextInvitations);
    } catch {
      toast.error("Could not refresh invitations");
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
                    alt={user.name ?? ""}
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
    ],
    [currentUserId, handleRoleChange],
  );

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Users"
        description="Manage your editorial team, review access levels, and keep account permissions consistent."
        icon={Shield}
        iconLabel="Security & Access"
      />

      <div className="grid gap-6">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <MailPlus className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black text-foreground">Invite team member</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input
                value={invitationEmail}
                onChange={(event) => setInvitationEmail(event.target.value)}
                placeholder="name@example.com"
              />
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <Select value={invitationRole} onValueChange={setInvitationRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="author">author</SelectItem>
                  <SelectItem value="editor">editor</SelectItem>
                  <SelectItem value="moderator">moderator</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                disabled={inviting || !invitationEmail.trim()}
                onClick={async () => {
                  try {
                    setInviting(true);
                    const result = await createInvitation({
                      data: {
                        email: invitationEmail,
                        role: invitationRole as "author" | "editor" | "moderator" | "admin",
                        expiresInDays: 7,
                      },
                    });
                    setInvitationEmail("");
                    toast.success("Invitation sent");
                    await refreshInvitations();
                    if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(result.inviteUrl);
                    }
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not send invitation");
                  } finally {
                    setInviting(false);
                  }
                }}
              >
                {inviting ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 p-3"
              >
                <div>
                  <p className="font-semibold text-foreground">{invitation.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {invitation.role} • expires{" "}
                    {invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleString() : "unknown"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const next = await createInvitation({
                        data: {
                          email: invitation.email,
                          role: invitation.role as "author" | "editor" | "moderator" | "admin",
                          expiresInDays: 7,
                        },
                      });
                      if (navigator.clipboard?.writeText) {
                        await navigator.clipboard.writeText(next.inviteUrl);
                      }
                      toast.success("A fresh invitation was created");
                      await refreshInvitations();
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Resend
                  </Button>
                  {!invitation.revokedAt && !invitation.acceptedAt ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await revokeInvitation({ data: { id: invitation.id } });
                        toast.success("Invitation revoked");
                        await refreshInvitations();
                      }}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Revoke
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

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

