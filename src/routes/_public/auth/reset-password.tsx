import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { KeyRound, Lock, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/_public/auth/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token } = Route.useSearch()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Invalid or missing reset token.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    
    setIsPending(true)
    setError('')
    
    try {
      await authClient.resetPassword({
        newPassword: password,
        token: token,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setIsPending(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="mx-auto w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-4 text-secondary">
          <Lock size={32} />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">Password Reset</h2>
        <p className="text-muted-foreground">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
        <Button asChild variant="default" className="w-full h-12 rounded-xl mt-4">
          <Link to="/auth/login" className="no-underline">Go to Sign In</Link>
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
        <h2 className="text-3xl font-black tracking-tight text-foreground">Set New Password</h2>
        <p className="text-muted-foreground">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-black uppercase tracking-wider text-muted-foreground ml-1">New Password</label>
          <input
            type="password"
            placeholder="Min. 8 characters"
            className="w-full bg-muted/30 border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black uppercase tracking-wider text-muted-foreground ml-1">Confirm New Password</label>
          <input
            type="password"
            placeholder="Repeat new password"
            className="w-full bg-muted/30 border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
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
          className="w-full h-12 rounded-xl text-lg font-black shadow-sm hover:shadow-md active:shadow-none transition-all mt-2"
          disabled={isPending}
        >
          {isPending ? 'Resetting...' : 'Reset Password'}
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
