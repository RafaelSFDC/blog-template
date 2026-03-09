import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { User, Shield, CreditCard, LogOut, Save } from 'lucide-react'
import { useForm } from '@tanstack/react-form'
import { cn } from '#/lib/utils'

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

// Simple Form UI components for local use to match Shadcn pattern without RHF dependency
const FormItem = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("grid gap-2", className)}>{children}</div>
)

const FormLabel = ({ children, className, htmlFor }: { children: React.ReactNode; className?: string; htmlFor?: string }) => (
  <label htmlFor={htmlFor} className={cn("text-xs font-black uppercase tracking-[0.2em] text-muted-foreground", className)}>
    {children}
  </label>
)

const FormMessage = ({ errors }: { errors?: any[] }) => {
  if (!errors || errors.length === 0) return null
  return <p className="text-xs font-bold uppercase tracking-widest text-destructive animate-in fade-in slide-in-from-top-1">{errors.join(", ")}</p>
}

const FormControl = ({ children }: { children: React.ReactNode }) => <>{children}</>

function AccountPage() {
  const { data: session } = authClient.useSession()

  const profileForm = useForm({
    defaultValues: {
      name: session?.user?.name || '',
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.updateUser({
          name: value.name,
        })
        alert('Profile updated successfully!')
      } catch (error) {
        alert('Failed to update profile.')
      }
    },
  })

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.changePassword({
          newPassword: value.newPassword,
          currentPassword: value.currentPassword,
          revokeOtherSessions: true,
        })
        alert('Password updated successfully!')
        passwordForm.reset()
      } catch (error: any) {
        alert(error.message || 'Failed to update password.')
      }
    },
  })

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/'
        },
      },
    })
  }

  return (
    <div className="page-wrap space-y-10 py-10 pb-20">
      <header className="island-shell rounded-3xl p-8 sm:p-12">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <User size={20} strokeWidth={3} />
          <p className="island-kicker mb-0 font-black uppercase tracking-widest text-primary/80">Account</p>
        </div>
        <h1 className="display-title text-5xl text-foreground sm:text-7xl uppercase">Profile Settings</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground font-medium leading-relaxed">
          Manage your personal identity, security credentials, and premium subscription.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Section */}
          <section className="island-shell rounded-3xl p-6 sm:p-10">
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground mb-8 flex items-center gap-2">
              <User size={20} className="text-primary" strokeWidth={3} />
              Personal Info
            </h2>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                profileForm.handleSubmit()
              }} 
              className="space-y-8"
            >
              <profileForm.Field
                name="name"
                validators={{
                  onChange: ({ value }) => !value ? 'Name is required' : (value.length < 2 ? 'Name must be at least 2 characters' : undefined),
                }}
                children={(field) => (
                  <FormItem className="space-y-3">
                    <FormLabel htmlFor={field.name}>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Your full name"
                        className="h-14 rounded-xl border-3 border-border bg-muted/30 px-6 text-base font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                      />
                    </FormControl>
                    <FormMessage errors={field.state.meta.errors} />
                  </FormItem>
                )}
              />

              <div className="space-y-3 opacity-90">
                <FormLabel>Email Address</FormLabel>
                <Input
                  value={session?.user?.email || ''}
                  disabled
                  className="h-14 rounded-xl border-3 border-border bg-muted/10 px-6 text-base font-bold text-muted-foreground/60 cursor-not-allowed italic"
                />
                <p className="text-[10px] uppercase font-bold tracking-widest text-primary/60">Note: Email updates are handled via security verification</p>
              </div>

              <div className="pt-4">
                <profileForm.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                  children={([canSubmit, isSubmitting]) => (
                    <Button type="submit" variant="zine" size="lg" disabled={!canSubmit || isSubmitting} className="h-14 px-10">
                      <Save size={20} className="mr-2" strokeWidth={3} />
                      {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                    </Button>
                  )}
                />
              </div>
            </form>
          </section>

          {/* Security / Password Section */}
          <section className="island-shell rounded-3xl p-6 sm:p-10">
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground mb-8 flex items-center gap-2">
              <Shield size={20} className="text-primary" strokeWidth={3} />
              Security
            </h2>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                passwordForm.handleSubmit()
              }} 
              className="space-y-6"
            >
              <passwordForm.Field
                name="currentPassword"
                validators={{
                  onChange: ({ value }) => !value ? 'Current password is required' : undefined,
                }}
                children={(field) => (
                  <FormItem className="space-y-3">
                    <FormLabel htmlFor={field.name}>Current Password</FormLabel>
                    <FormControl>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="••••••••"
                        className="h-14 rounded-xl border-3 border-border bg-muted/30 px-6 text-base font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                      />
                    </FormControl>
                    <FormMessage errors={field.state.meta.errors} />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 sm:grid-cols-2">
                <passwordForm.Field
                  name="newPassword"
                  validators={{
                    onChange: ({ value }) => 
                      !value ? 'New password is required' : 
                      (value.length < 8 ? 'Min 8 characters' : undefined),
                  }}
                  children={(field) => (
                    <FormItem className="space-y-3">
                      <FormLabel htmlFor={field.name}>New Password</FormLabel>
                      <FormControl>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="••••••••"
                          className="h-14 rounded-xl border-3 border-border bg-muted/30 px-6 text-base font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                        />
                      </FormControl>
                      <FormMessage errors={field.state.meta.errors} />
                    </FormItem>
                  )}
                />
                <passwordForm.Field
                  name="confirmPassword"
                  validators={{
                    onChange: ({ value, fieldApi }) => {
                      if (!value) return 'Confirm your password'
                      if (value !== fieldApi.form.getFieldValue('newPassword')) return 'Passwords do not match'
                      return undefined
                    },
                  }}
                  children={(field) => (
                    <FormItem className="space-y-3">
                      <FormLabel htmlFor={field.name}>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="••••••••"
                          className="h-14 rounded-xl border-3 border-border bg-muted/30 px-6 text-base font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                        />
                      </FormControl>
                      <FormMessage errors={field.state.meta.errors} />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4">
                <passwordForm.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                  children={([canSubmit, isSubmitting]) => (
                    <Button 
                      type="submit" 
                      variant="zine" 
                      size="lg" 
                      disabled={!canSubmit || isSubmitting} 
                      className="h-14 px-10"
                    >
                      <Save size={20} className="mr-2" strokeWidth={3} />
                      {isSubmitting ? 'UPDATING...' : 'UPDATE PASSWORD'}
                    </Button>
                  )}
                />
              </div>
            </form>
          </section>

          {/* Security / Role Section */}
          <section className="island-shell rounded-3xl p-6 sm:p-10">
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground mb-8 flex items-center gap-2">
              <Shield size={20} className="text-primary" strokeWidth={3} />
              Access Level
            </h2>
            <div className="flex items-center justify-between p-6 rounded-2xl border-3 border-border bg-muted/20">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Authenticated As</p>
                <p className="text-2xl font-black uppercase text-foreground tracking-tight">{session?.user?.role || 'Reader'}</p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary">
                <Shield size={32} strokeWidth={2.5} />
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          {/* Subscription Section */}
          <section className="island-shell rounded-3xl p-8 bg-secondary/5 border-secondary/20">
            <h3 className="font-black uppercase tracking-widest text-foreground mb-6 flex items-center gap-2 text-sm">
              <CreditCard size={18} className="text-primary" strokeWidth={3} />
              Subscription
            </h3>
            <div className="mb-8">
              <p className="text-sm font-bold text-muted-foreground mb-1 uppercase tracking-wider">Current Plan</p>
              <p className="text-3xl font-black text-foreground uppercase tracking-tighter">Free Tier</p>
            </div>
            <p className="text-sm font-medium text-muted-foreground/80 mb-8 leading-relaxed">
              Unlock exclusive deep-dives, early access stories, and a premium ad-free experience.
            </p>
            <Button variant="zine-outline" className="w-full h-14 text-base font-black uppercase tracking-widest">
              Upgrade Now
            </Button>
          </section>

          {/* Danger Zone */}
          <section className="island-shell rounded-3xl p-8 border-destructive/30 bg-destructive/5">
            <h3 className="font-black uppercase tracking-widest text-destructive mb-6 text-sm">
              Session Management
            </h3>
            <Button 
              variant="zine-destructive" 
              className="w-full justify-center gap-3 h-14 text-base font-black uppercase tracking-widest"
              onClick={handleLogout}
            >
              <LogOut size={20} strokeWidth={3} />
              Sign Out
            </Button>
          </section>
        </aside>
      </div>
    </div>
  )
}
