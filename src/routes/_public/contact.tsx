import { createFileRoute } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { contactMessages } from '#/db/schema'
import { Mail, Send, CheckCircle2 } from 'lucide-react'
import { useForm } from '@tanstack/react-form'
import { cn } from '#/lib/utils'
import { useState } from 'react'

const submitContactForm = createServerFn({ method: 'POST' })
  .inputValidator((data: { name: string; email: string; subject: string; message: string }) => data)
  .handler(async ({ data }) => {
    await db.insert(contactMessages).values({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: 'new',
    })
    return { success: true }
  })

export const Route = createFileRoute('/_public/contact')({
  component: ContactPage,
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
  return <p className="text-[10px] font-bold uppercase tracking-widest text-destructive animate-in fade-in slide-in-from-top-1 px-1">{errors.join(", ")}</p>
}

const FormControl = ({ children }: { children: React.ReactNode }) => <>{children}</>

function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
    onSubmit: async ({ value }) => {
      try {
        await submitContactForm({ data: value })
        setSubmitted(true)
      } catch (err) {
        console.error(err)
        alert('Falha ao enviar mensagem. Tente novamente.')
      }
    },
  })

  if (submitted) {
    return (
      <main className="page-wrap px-4 py-20 text-center">
        <section className="island-shell mx-auto max-w-2xl rounded-4xl p-12 overflow-hidden relative">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 text-primary border-4 border-primary/20 rotate-3 transition-all hover:rotate-12">
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>
          <h1 className="display-title text-5xl mb-6 uppercase tracking-tighter">Message Received!</h1>
          <p className="text-muted-foreground text-xl mb-10 font-medium leading-relaxed">
            Thank you for reaching out. Your message is in our inbox, and we'll get back to you sooner than you think.
          </p>
          <Button asChild variant="zine" size="lg" className="h-16 px-12 rounded-2xl text-lg">
            <a href="/">BACK TO FEED</a>
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 pb-20 pt-10">
      <section className="island-shell mx-auto max-w-5xl rounded-4xl p-8 sm:p-12">
        <div className="grid gap-16 lg:grid-cols-2">
          <div className="py-4">
            <p className="island-kicker mb-6 inline-block">Support & Feedback</p>
            <h1 className="display-title text-6xl text-foreground sm:text-7xl mb-8 uppercase tracking-tighter leading-[0.9]">Get in <br className="hidden sm:block" />Touch</h1>
            <p className="text-muted-foreground text-xl mb-12 font-medium leading-relaxed max-w-md">
              Have a question, feedback, or just want to say hi? Fill out the form and our team will get back to you as soon as possible.
            </p>

            <div className="space-y-8">
              <div className="flex items-center gap-6 group">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary border-4 border-primary/20 group-hover:rotate-6 transition-transform">
                  <Mail size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Email us</p>
                  <p className="font-black text-2xl uppercase tracking-tight text-foreground">hello@vibezine.com</p>
                </div>
              </div>
            </div>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }} 
            className="island-shell space-y-6 rounded-3xl bg-muted/20 p-6 sm:p-10 border-3 border-border/40 shadow-xl"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => !value ? 'Full name required' : undefined,
                }}
                children={(field) => (
                  <FormItem>
                    <FormLabel htmlFor={field.name}>Name</FormLabel>
                    <FormControl>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="John Doe"
                        className="h-14 rounded-xl border-3 border-border bg-background px-6 text-base font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                      />
                    </FormControl>
                    <FormMessage errors={field.state.meta.errors} />
                  </FormItem>
                )}
              />
              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) => !value ? 'Email required' : (!/^\S+@\S+$/.test(value) ? 'Invalid email' : undefined),
                }}
                children={(field) => (
                  <FormItem>
                    <FormLabel htmlFor={field.name}>Email</FormLabel>
                    <FormControl>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="john@example.com"
                        className="h-14 rounded-xl border-3 border-border bg-background px-6 text-base font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                      />
                    </FormControl>
                    <FormMessage errors={field.state.meta.errors} />
                  </FormItem>
                )}
              />
            </div>
            <form.Field
              name="subject"
              validators={{
                onChange: ({ value }) => !value ? 'Subject is required' : (value.length < 3 ? 'Subject too short' : undefined),
              }}
              children={(field) => (
                <FormItem>
                  <FormLabel htmlFor={field.name}>Subject</FormLabel>
                  <FormControl>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="How can we help?"
                      className="h-14 rounded-xl border-3 border-border bg-background px-6 text-base font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                    />
                  </FormControl>
                  <FormMessage errors={field.state.meta.errors} />
                </FormItem>
              )}
            />
            <form.Field
              name="message"
              validators={{
                onChange: ({ value }) => !value ? 'Message required' : (value.length < 10 ? 'Message too short' : undefined),
              }}
              children={(field) => (
                <FormItem>
                  <FormLabel htmlFor={field.name}>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      rows={5}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Your message here..."
                      className="rounded-xl border-3 border-border bg-background px-6 py-4 text-base font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 min-h-[160px] resize-none"
                    />
                  </FormControl>
                  <FormMessage errors={field.state.meta.errors} />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button 
                    type="submit" 
                    variant="zine" 
                    size="lg" 
                    className="w-full h-16 text-lg font-black uppercase tracking-widest rounded-2xl shadow-xl hover:translate-y-[-2px] active:translate-y-[1px] transition-all" 
                    disabled={!canSubmit || isSubmitting}
                  >
                    <Send size={22} className="mr-3" strokeWidth={3} />
                    {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
                  </Button>
                )}
              />
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
