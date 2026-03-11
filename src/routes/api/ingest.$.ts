import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/ingest/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return proxyRequest(request)
      },
      POST: async ({ request }) => {
        return proxyRequest(request)
      },
    }
  }
})

async function proxyRequest(request: Request) {
  const url = new URL(request.url)
  const targetUrl = new URL(
    url.pathname.replace(/^\/api\/ingest/, ''),
    'https://us.i.posthog.com'
  )
  
  // Copy all search parameters
  url.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value)
  })

  // Prepare headers for proxying
  const headers = new Headers(request.headers)
  headers.set('host', 'us.i.posthog.com')
  
  // Remove headers that might cause issues with the target server
  headers.delete('connection')
  headers.delete('origin')
  headers.delete('referer')
  headers.delete('content-length') // Let fetch set this correctly

  try {
    // Only read body for POST requests
    const body = request.method === 'POST' ? await request.arrayBuffer() : undefined
    
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body,
      redirect: 'follow'
    })

    // Return the response as is
    return response
  } catch (error) {
    console.error('PostHog Proxy Error:', error)
    return new Response('PostHog Proxy Error', { status: 502 })
  }
}
