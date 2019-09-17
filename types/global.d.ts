// eslint-disable-next-line @typescript-eslint/no-unused-vars
import fetch from 'node-fetch'

declare global {
  namespace NodeJS {
    interface Global {
      fetch: typeof fetch
    }
  }
}
