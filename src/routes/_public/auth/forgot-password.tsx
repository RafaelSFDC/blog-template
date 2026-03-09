import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { Mail, ArrowLeft, KeyRound } from 'lucide-react'

export const Route = createFileRoute('/_public/auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleResetRequest = async (e: FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setError('')
    
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: window.location.origin + '/auth/reset-password',
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="mx-auto w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-4 text-secondary">
          <Mail size={32} />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">Check your email</h2>
        <p className="text-muted-foreground">
          We have sent a password reset link to <span className="font-bold text-foreground">{email}</span>.
          Please check your inbox and spam folder.
        </p>
        <Button asChild variant="zine-outline" className="w-full h-12 rounded-xl mt-4">
          <Link to="/auth/login" className="no-underline">Return to Sign In</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-primary">
            <KeyRound size={24} />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">Forgot Password?</h2>
        <p className="text-muted-foreground">No worries, we'll send you reset instructions.</p>
      </div>

      <form onSubmit={handleResetRequest} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-black uppercase tracking-wider text-muted-foreground ml-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full bg-muted/30 border-2 border-border rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          variant="zine" 
          className="w-full h-12 rounded-xl text-lg font-black shadow-zine-sm hover:shadow-zine active:shadow-none transition-all mt-2"
          disabled={isPending}
        >
          {isPending ? 'Sending...' : 'Reset Password'}
        </Button>
      </form>

      <div className="text-center pt-2">
        <Link 
            to="/auth/login" 
            className="inline-flex items-center gap-2 text-sm font-black text-muted-foreground hover:text-primary transition-colors group"
        >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Back to Sign In
        </Link>
      </div>
    </div>
  )
}
