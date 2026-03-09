import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '#/components/ui/card'
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/login')({
  component: DashboardLoginPage,
})

function DashboardLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      })

      if (error) {
        toast.error(error.message || 'Falha ao entrar')
      } else {
        // After login, better-auth session is updated.
        // We check the role here or just redirect and let beforeLoad handle it.
        // But it's better to check here to show a nice error if they are just a reader.
        const session = await authClient.getSession()
        if (session?.data?.user.role === 'reader') {
             toast.error('Acesso negado. Esta área é apenas para equipe editorial.')
             await authClient.signOut()
        } else {
            toast.success('Bem-vindo ao Dashboard!')
            navigate({ to: '/dashboard' })
        }
      }
    } catch (err) {
      toast.error('Ocorreu um erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6 selection:bg-primary/30">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_0%,transparent_100%)] pointer-events-none" />
        
        <div className="w-full max-w-md z-10 space-y-8">
            <div className="text-center space-y-2">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-4 animate-in fade-in zoom-in duration-700">
                    <ShieldCheck className="text-primary" size={32} strokeWidth={2.5} />
                </div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter sm:text-5xl">Staff Access</h1>
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Secure Editorial Gateway</p>
            </div>

            <Card className="bg-[#111] border-2 border-white/5 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-xl">
                <CardHeader className="pt-8 px-8">
                    <CardTitle className="text-xl font-bold text-white tracking-tight">Sign In</CardTitle>
                    <CardDescription className="text-zinc-500 font-medium">Enter your credentials to manage the publication.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-primary transition-colors">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                <Input 
                                    type="email" 
                                    placeholder="admin@blog.com" 
                                    className="bg-zinc-900/50 border-zinc-800 pl-10 h-12 rounded-xl focus:ring-primary/20 focus:border-primary/50 text-white font-medium"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-primary transition-colors">Security Key</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                <Input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    className="bg-zinc-900/50 border-zinc-800 pl-10 h-12 rounded-xl focus:ring-primary/20 focus:border-primary/50 text-white font-medium"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <Button 
                            type="submit" 
                            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/10 transition-all hover:scale-[1.01] active:scale-95 group"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <span className="flex items-center gap-2">
                                    Authenticate <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="bg-white/5 border-t border-white/5 p-6 flex justify-center">
                    <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors no-underline">
                        Return to Public Interface
                    </Link>
                </CardFooter>
            </Card>
            
            <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest px-8">
                Strictly for authorized personnel. All access attempts are logged and monitored.
            </p>
        </div>
    </div>
  )
}
