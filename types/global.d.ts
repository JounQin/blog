declare namespace NodeJS {
  interface Global {
    fetch: GlobalFetch['fetch']
  }
}
