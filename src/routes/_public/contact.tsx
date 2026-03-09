import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState, type FormEvent } from 'react'
import { resend } from '#/lib/resend'
import { db } from '#/db/index'
import { user } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react'

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const sendContactEmail = createServerFn({ method: 'POST' })
  .inputValidator((input: { name: string; email: string; message: string }) => {
    if (!input.name || input.name.length < 2) throw new Error('Name is too short')
    if (!EMAIL_REGEX.test(input.email)) throw new Error('Invalid email address')
    if (!input.message || input.message.length < 10) throw new Error('Message is too short')
    return input
  })
  .handler(async ({ data }) => {
    try {
      // Find the first admin user to send to
      const adminUser = await db.query.user.findFirst({
        where: eq(user.role, 'admin'),
      })

      const adminEmail = process.env.ADMIN_EMAIL || adminUser?.email

      if (!adminEmail) {
        throw new Error('No admin email configured to receive messages.')
      }

      await resend.emails.send({
        from: 'Blog Contact Form <onboarding@resend.dev>', // Use verified domain string in production
        to: adminEmail,
        replyTo: data.email,
        subject: `New Contact Form Message from ${data.name}`,
        html: `
          <h3>New Message via Contact Form</h3>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p>${data.message.replace(/\\n/g, '<br/>')}</p>
        `,
      })

      return { success: true }
    } catch (error: any) {
      console.error('Failed to send contact email:', error)
      throw new Error(error.message || 'Failed to send message')
    }
  })

export const Route = createFileRoute('/_public/contact')({
  component: ContactPage,
})

function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      await sendContactEmail({ data: formData })
      setStatus('success')
      setFormData({ name: '', email: '', message: '' })
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || "An error occurred. Please try again later.")
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <div className="text-center mb-12">
        <h1 className="display-title text-4xl font-bold tracking-tight text-foreground sm:text-6xl uppercase">
          Get in Touch
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto font-medium">
          Have a question, feedback, or want to collaborate? Drop us a line below and we'll get back to you as soon as possible.
        </p>
      </div>

      <div className="island-shell rounded-4xl p-8 sm:p-12 shadow-zine transition-all hover:-translate-y-1">
        {status === 'success' ? (
          <div className="flex flex-col flex-1 items-center justify-center text-center py-12 animate-in fade-in zoom-in duration-500">
            <div className="h-20 w-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Message Sent!</h2>
            <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">
              Thanks for reaching out. We've received your message and will respond to {formData.email} shortly.
            </p>
            <button 
              onClick={() => setStatus('idle')}
              className="font-bold text-primary hover:underline hover:underline-offset-4"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-black uppercase tracking-widest text-foreground">
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  disabled={status === 'loading'}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-2xl border-2 border-border bg-muted/50 px-5 py-4 text-sm font-bold text-foreground outline-none focus:border-primary transition-all disabled:opacity-50"
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-black uppercase tracking-widest text-foreground">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  disabled={status === 'loading'}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-2xl border-2 border-border bg-muted/50 px-5 py-4 text-sm font-bold text-foreground outline-none focus:border-primary transition-all disabled:opacity-50"
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-black uppercase tracking-widest text-foreground">
                Message
              </label>
              <textarea
                id="message"
                required
                disabled={status === 'loading'}
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="min-h-40 w-full rounded-2xl border-2 border-border bg-muted/50 px-5 py-4 text-sm font-bold text-foreground outline-none focus:border-primary transition-all disabled:opacity-50"
                placeholder="What's on your mind?"
              />
            </div>

            {status === 'error' && (
              <div className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 px-6 py-4 text-sm font-bold flex items-center gap-3 text-destructive animate-in fade-in">
                <AlertCircle size={18} />
                {errorMessage}
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="vibe-btn-primary w-full flex items-center justify-center gap-3 rounded-2xl py-5 text-sm font-black uppercase tracking-widest disabled:opacity-70 disabled:hover:scale-100 transition-all shadow-zine-sm"
              >
                {status === 'loading' ? (
                  <span className="animate-pulse">Sending Message...</span>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </button>
            </div>
            
            <p className="text-center text-xs font-medium text-muted-foreground flex items-center justify-center gap-2">
              <Mail size={14} />
              We respect your privacy. No spam.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
