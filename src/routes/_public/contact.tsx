import { createFileRoute } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { createServerFn } from '@tanstack/react-start'
import { db } from '#/db/index'
import { contactMessages } from '#/db/schema'
import { useState, type FormEvent } from 'react'
import { Mail, Send, CheckCircle2 } from 'lucide-react'

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

function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await submitContactForm({ data: { name, email, subject, message } })
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Falha ao enviar mensagem. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <main className="page-wrap px-4 py-20">
        <section className="island-shell mx-auto max-w-2xl rounded-4xl p-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-500">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="display-title text-4xl mb-4">Message Received!</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Thank you for reaching out. We'll get back to you soon.
          </p>
          <Button asChild variant="zine" size="lg" className="rounded-full">
            <a href="/">Return Home</a>
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 pb-20 pt-10">
      <section className="island-shell mx-auto max-w-4xl rounded-4xl p-8 sm:p-12">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="island-kicker mb-4">Support & Feedback</p>
            <h1 className="display-title text-5xl text-foreground sm:text-6xl mb-6">Get in Touch</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Have a question, feedback, or just want to say hi? Fill out the form and our team will get back to you as soon as possible.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email us</p>
                  <p className="font-bold text-lg">hello@vibezine.com</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="island-shell space-y-5 rounded-3xl bg-muted/30 p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="How can we help?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                placeholder="Your message here..."
              />
            </div>

            <Button type="submit" variant="zine" size="lg" className="w-full rounded-full" disabled={loading}>
              <Send size={18} className="mr-2" />
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
