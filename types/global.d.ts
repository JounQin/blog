import fetch from 'node-fetch'

declare global {
  namespace NodeJS {
    interface Global {
      fetch: typeof fetch
    }
  }
}
