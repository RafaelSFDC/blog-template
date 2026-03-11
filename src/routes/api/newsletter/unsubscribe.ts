import { createFileRoute } from '@tanstack/react-router'
import { unsubscribeSubscriber } from '#/lib/newsletter'

export const Route = createFileRoute('/api/newsletter/unsubscribe')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url)
        const email = url.searchParams.get('email')
        const token = url.searchParams.get('token')

        if (!email || !token) {
          return new Response('Invalid unsubscribe link', { status: 400 })
        }

        try {
          await unsubscribeSubscriber(email, token)
          return new Response(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Unsubscribed</title>
                <style>
                  body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafafa; }
                  .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: center; max-width: 400px; }
                  h1 { color: #111; margin-bottom: 10px; }
                  p { color: #666; line-height: 1.5; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>You're unsubscribed</h1>
                  <p>We've removed <strong>${email}</strong> from our mailing list. You won't receive any more newsletters from us.</p>
                  <p><a href="/" style="color: var(--primary); font-weight: bold; text-decoration: none;">Back to blog</a></p>
                </div>
              </body>
            </html>
          `, {
            headers: { 'Content-Type': 'text/html' }
          })
        } catch {
          return new Response('Unsubscribe failed. Please contact support.', { status: 500 })
        }
      },
    }
  }
})
