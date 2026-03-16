/**
 * Cloudflare Environment Helper
 * 
 * Uses the `cloudflare:workers` module which works both in:
 * - Production: native Workers runtime
 * - Dev: @cloudflare/vite-plugin simulated environment
 */

let _env: Record<string, unknown> | null = null
const workerSpecifier = ['cloudflare', 'workers'].join(':')

function getEnv() {
  if (_env) return _env

  try {
    // Dynamic import to avoid build issues in non-CF environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(workerSpecifier)
    _env = mod.env
    return _env
  } catch {
    // Not in Cloudflare environment
    return null
  }
}

/**
 * Get a specific Cloudflare binding (D1, R2, KV, etc.) or env var.
 */
export function getBinding<T = unknown>(name: string): T | undefined {
  const env = getEnv()
  if (env && env[name] !== undefined) {
    return env[name] as T
  }
  return undefined
}

/**
 * Get the full Cloudflare env object with all bindings.
 */
export function getCloudflareEnv() {
  return getEnv()
}
