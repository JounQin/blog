declare global {
  import fetch from 'node-fetch'

  namespace NodeJS {
    interface Global {
      fetch: typeof fetch
    }
  }
}
