import type { H3Error, H3Event } from 'h3'

interface NitroErrorHandlerOptions {
  defaultHandler: (error: H3Error, event: H3Event) => unknown
}

/**
 * Nitro error handler: keeps the JSON error shape but also logs the stack, so
 * production errors are visible in `wrangler tail` / Workers Logs.
 */
const errorHandler = (
  error: H3Error,
  event: H3Event,
  { defaultHandler }: NitroErrorHandlerOptions,
) => {
   
  console.error(
    `[nitro] ${event.method} ${event.path} -> ${error.statusCode || 500}`,
    error.stack || error,
  )

  return defaultHandler(error, event)
}

export default defineNitroErrorHandler(
  errorHandler as unknown as Parameters<typeof defineNitroErrorHandler>[0],
)
