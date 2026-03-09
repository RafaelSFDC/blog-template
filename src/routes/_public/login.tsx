import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '#/components/ui/card'
import { Mail, Lock, Loader2, Github, Chrome, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_public/login')({
  component: LoginPage,
})

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      })
      if (error) {
        toast.error(error.message || 'Error signing in')
      } else {
        toast.success('Welcome back!')
        navigate({ to: '/' })
      }
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: '/',
      })
    } catch (err) {
      toast.error(`Failed to sign in with ${provider}`)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 sm:p-12">
      <Card className="w-full max-w-lg border-[3px] border-border/50 shadow-zine rounded-[2rem] overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardHeader className="pt-12 px-10 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2">
            <MessageCircle size={32} strokeWidth={2.5} />
          </div>
          <CardTitle className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">Join the Conversation</CardTitle>
          <CardDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
            Sign in to comment and access premium content
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-12 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-2 border-border/60 hover:border-primary hover:bg-primary/5 transition-all group"
                onClick={() => handleSocialLogin('google')}
            >
              <Chrome className="mr-2 group-hover:scale-110 transition-transform" size={20} />
              <span className="font-black uppercase tracking-widest text-[10px]">Google</span>
            </Button>
            <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-2 border-border/60 hover:border-foreground hover:bg-muted transition-all group"
                onClick={() => handleSocialLogin('github')}
            >
              <Github className="mr-2 group-hover:scale-110 transition-transform" size={20} />
              <span className="font-black uppercase tracking-widest text-[10px]">Github</span>
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/40"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black">
              <span className="bg-card px-4 text-zinc-400">Or use email</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-primary transition-colors pl-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="h-14 pl-12 rounded-2xl bg-muted/30 border-2 border-border/40 focus:border-primary/50 transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2 group">
              <div className="flex items-center justify-between pl-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-primary transition-colors">Password</label>
                <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary no-underline transition-colors">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-14 pl-12 rounded-2xl bg-muted/30 border-2 border-border/40 focus:border-primary/50 transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-16 rounded-2xl bg-foreground text-background font-black uppercase tracking-widest text-sm hover:scale-[1.01] active:scale-95 transition-all shadow-zine-sm"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Enter the Community'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pb-12 px-10 flex flex-col items-center gap-4">
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
            Don't have an account? <Link to="/" className="text-primary hover:underline underline-offset-4">Create one</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
