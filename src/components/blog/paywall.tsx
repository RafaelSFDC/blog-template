import { Link } from '@tanstack/react-router'
import { Button } from "../ui/button";
import { Lock } from 'lucide-react'

interface PaywallProps {
  onSubscribe?: () => void
}

export function Paywall({ onSubscribe }: PaywallProps) {
  return (
    <div className="relative mt-8">
      {/* Content blur effect */}
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent z-10 h-64 -top-64" />
      
      <div className="relative z-20 bg-card border rounded-2xl p-8 text-center shadow-xl space-y-6 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <div className="bg-primary/10 p-4 rounded-full">
            <Lock className="w-10 h-10 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">Este conteúdo é exclusivo</h3>
          <p className="text-muted-foreground text-lg">
            Assine nosso plano premium para ter acesso a este artigo completo e todo o nosso acervo exclusivo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button size="lg" className="text-lg px-8 font-semibold" onClick={onSubscribe}>
            Assinar agora
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/">Entrar na minha conta</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Cancele quando quiser. Suporte prioritário incluso.
        </p>
      </div>
    </div>
  )
}
