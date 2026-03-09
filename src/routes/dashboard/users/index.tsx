import { createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardHeader } from '#/components/dashboard/Header'
import { DashboardPageContainer } from '#/components/dashboard/DashboardPageContainer'
import { createServerFn } from '@tanstack/react-start'
import { authClient } from '#/lib/auth-client'
import { requireSuperAdminSession } from '#/lib/admin-auth'
import { Shield, User as UserIcon, MoreVertical, Trash2, Ban, CheckCircle2, ChevronRight } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import { Card } from '#/components/ui/card'

const ensureSuperAdmin = createServerFn({ method: 'GET' }).handler(async () => {
  await requireSuperAdminSession()
  return { ok: true }
})

export const Route = createFileRoute('/dashboard/users/')({
  beforeLoad: async () => {
    try {
      await ensureSuperAdmin()
    } catch {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: UsersManagementPage,
})

const ROLES = ['reader', 'author', 'editor', 'moderator', 'admin', 'super-admin'] as const;

function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await authClient.admin.listUsers({
          query: {} as any
      })

      if (error) {
        toast.error('Failed to load users')
      } else {
        setUsers(data.users)
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await authClient.admin.setRole({
        userId,
        role: newRole as any,
      })

      if (error) {
        toast.error(error.message || 'Failed to update role')
      } else {
        toast.success(`Role updated to ${newRole}`)
        fetchUsers()
      }
    } catch (err) {
      toast.error('An error occurred')
    }
  }

  const handleBanUser = async (userId: string) => {
      console.log('Banning user:', userId)
      toast.info('Ban functionality coming soon')
  }

  return (
    <DashboardPageContainer>
      <DashboardHeader
        title="Identity Control"
        description="Manage your editorial team and community members. Audit access levels and identities."
        icon={Shield}
        iconLabel="Security & Access"
      />

      <div className="grid gap-6">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Accessing User Directory...</p>
          </div>
        ) : (
          <Card className="w-full border-[3px] border-border/50 shadow-zine rounded-4xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-border/10 bg-muted/20">
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access Level</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Join Date</th>
                    <th className="p-6 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-border/10">
                  {users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl overflow-hidden border-2 border-border shrink-0 bg-background">
                            {user.image ? (
                              <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center font-black text-muted-foreground bg-muted/50 text-xs">
                                {user.name?.[0] || <UserIcon size={18} />}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground font-bold truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-xl border-2 font-black uppercase tracking-widest text-[10px] gap-2 h-9">
                              {user.role}
                              <ChevronRight className="rotate-90" size={12} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48 rounded-2xl border-2 bg-card p-2 shadow-zine border-border">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 p-2">Change Level</DropdownMenuLabel>
                            {ROLES.map((r) => (
                              <DropdownMenuItem 
                                key={r} 
                                onClick={() => handleRoleChange(user.id, r)}
                                className={`rounded-xl p-3 font-black uppercase tracking-widest text-[10px] cursor-pointer ${user.role === r ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                              >
                                {r}
                                {user.role === r && <CheckCircle2 className="ml-auto" size={14} />}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="p-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 text-[9px] font-black uppercase tracking-widest">
                          Active
                        </span>
                      </td>
                      <td className="p-6 text-xs font-bold text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-6 text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground">
                                    <MoreVertical size={20} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-2xl border-2 shadow-zine border-border bg-card">
                                <DropdownMenuItem onClick={() => handleBanUser(user.id)} className="text-amber-600 font-bold flex items-center gap-2 p-3 rounded-xl cursor-pointer hover:bg-amber-50">
                                    <Ban size={16} /> Ban User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive font-bold flex items-center gap-2 p-3 rounded-xl cursor-pointer hover:bg-destructive/5">
                                    <Trash2 size={16} /> Delete Account
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
                <div className="p-20 text-center">
                    <p className="text-muted-foreground font-bold">No users found.</p>
                </div>
            )}
          </Card>
        )}
      </div>
    </DashboardPageContainer>
  )
}
