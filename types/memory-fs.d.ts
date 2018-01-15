declare module 'memory-fs' {
  namespace MemoryFileSystem {

  }

  class MemoryFileSystem {
    constructor(data?: any)

    public readFileSync(path: string, encoding?: string): any
  }

  export = MemoryFileSystem
}
