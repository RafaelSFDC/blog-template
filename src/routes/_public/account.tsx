import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { User, Shield, CreditCard, LogOut, Save } from 'lucide-react'
import { useState } from 'react'

const checkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const { getAuthSession } = await import('#/lib/admin-auth')
  const session = await getAuthSession()
  if (!session?.user) {
    return { ok: false as const }
  }
  return { ok: true as const }
})

export const Route = createFileRoute('/_public/account')({
  beforeLoad: async () => {
    const result = await checkAuth()
    if (!result.ok) {
      throw redirect({ to: '/auth/login' })
    }
  },
  component: AccountPage,
})

function AccountPage() {
  const { data: session } = authClient.useSession()
  const [name, setName] = useState(session?.user?.name || '')
  const [updating, setUpdating] = useState(false)

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/'
        },
      },
    })
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await authClient.updateUser({
        name: name,
      })
      alert('Profile updated successfully!')
    } catch (error) {
      alert('Failed to update profile.')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-10 py-10">
      <header className="island-shell rounded-3xl p-8 sm:p-10">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <User size={20} strokeWidth={3} />
          <p className="island-kicker mb-0">My profile</p>
        </div>
        <h1 className="display-title text-5xl text-foreground sm:text-6xl uppercase">Account Settings</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground font-medium">
          Manage your personal information, security, and subscription.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Section */}
          <section className="island-shell rounded-3xl p-6 sm:p-10 bg-card border-3 border-border/50">
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground mb-6 flex items-center gap-2">
              <User size={20} className="text-primary" />
              General Information
            </h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-foreground">
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-muted/50 px-5 py-4 text-sm font-bold text-foreground outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-2 opacity-70">
                <label className="text-xs font-black uppercase tracking-widest text-foreground">
                  Email Address
                </label>
                <input
                  value={session?.user?.email || ''}
                  disabled
                  className="w-full rounded-xl border-2 border-border bg-muted/20 px-5 py-4 text-sm font-bold text-muted-foreground cursor-not-allowed"
                />
                <p className="text-[10px] uppercase font-black tracking-widest">Email cannot be changed currently</p>
              </div>

              <div className="pt-4">
                <Button type="submit" variant="zine" disabled={updating || !name}>
                  <Save size={18} className="mr-2" />
                  {updating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </section>

          {/* Security / Role Section */}
          <section className="island-shell rounded-3xl p-6 sm:p-10 bg-card border-3 border-border/50">
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground mb-6 flex items-center gap-2">
              <Shield size={20} className="text-primary" />
              Security & Role
            </h2>
            <div className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-muted/30">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Current Role</p>
                <p className="text-lg font-black uppercase text-foreground">{session?.user?.role || 'Reader'}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Shield size={24} />
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          {/* Subscription Section */}
          <section className="island-shell rounded-3xl p-6 border-3 border-border/50 bg-secondary/10">
            <h3 className="font-black uppercase tracking-widest text-foreground mb-4 flex items-center gap-2 text-sm">
              <CreditCard size={18} className="text-primary" />
              Subscription
            </h3>
            <p className="text-sm font-medium text-muted-foreground mb-6">
              You are currently on the <span className="text-foreground font-bold">Free Plan</span>. Upgrade to access premium content.
            </p>
            <Button variant="zine-outline" className="w-full">
              Upgrade Now
            </Button>
          </section>

          {/* Danger Zone */}
          <section className="island-shell rounded-3xl p-6 border-3 border-destructive/20 bg-destructive/5">
            <h3 className="font-black uppercase tracking-widest text-destructive mb-4 text-sm">
              Danger Zone
            </h3>
            <Button 
              variant="destructive" 
              className="w-full justify-start gap-2 h-12"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Logout
            </Button>
          </section>
        </aside>
      </div>
    </div>
  )
}
