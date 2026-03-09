import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { Mail } from 'lucide-react'
import { SocialLogin } from '#/components/auth/social-login'
import { createServerFn } from '@tanstack/react-start'

const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const { getAuthSession } = await import('#/lib/admin-auth')
  return await getAuthSession()
})

export const Route = createFileRoute('/_public/auth/login')({
  beforeLoad: async () => {
    const session = await getSession()
    if (session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setError('')
    
    try {
      await authClient.signIn.email({
        email,
        password,
        callbackURL: '/dashboard',
      })
    } catch (err) {
      setError('Invalid email or password. Please try again.')
    } finally {
      setIsPending(false)
    }
  }



  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-foreground">Welcome Back</h2>
        <p className="text-muted-foreground">Enter your credentials to access your account</p>
      </div>

      <SocialLogin />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground font-bold tracking-widest">Or continue with</span>
        </div>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-black uppercase tracking-wider text-muted-foreground ml-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full bg-muted/30 border border-border rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-sm font-black uppercase tracking-wider text-muted-foreground">Password</label>
            <Link 
              to="/auth/forgot-password" 
              className="text-xs font-bold text-primary hover:underline decoration-2 underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full bg-muted/30 border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          variant="default" 
          className="w-full h-12 rounded-xl text-lg font-black shadow-sm hover:shadow-md active:shadow-none transition-all"
          disabled={isPending}
        >
          {isPending ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center pt-2">
        <p className="text-sm text-muted-foreground font-medium">
          Don&apos;t have an account?{' '}
          <Link 
            to="/auth/register" 
            className="text-primary font-black hover:underline decoration-2 underline-offset-4"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
