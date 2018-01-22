declare module 'google-translate-api' {
  namespace GoggleTranslateAPI {

  }

  interface GoggleTranslateApiOptions {
    from?: string
    to?: string
    raw?: boolean
  }

  interface GoggleTranslateApiResponse {
    text: string
    from: {
      language: {
        didYouMean: boolean
        iso: string
      }
      text: {
        autoCorrected: boolean
        didYouMean: boolean
        value: string
      }
    }
    raw: boolean
  }

  function GoggleTranslateAPI(
    content: string,
    options: GoggleTranslateApiOptions,
  ): Promise<GoggleTranslateApiResponse>

  export = GoggleTranslateAPI
}
