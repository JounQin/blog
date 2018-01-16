declare module 'invert-color' {
  type RgbArray = string[]

  interface RgbObject {
    r: string
    g: string
    b: string
  }

  type Invert<T> = (
    color: string | RgbArray | RgbObject,
    bw?:
      | boolean
      | {
          black: string
          white: string
        },
  ) => T

  type InvertColor = Invert<string> & {
    asRgbArray: Invert<RgbArray>
    asRgbObject: Invert<RgbObject>
  }

  const invert: InvertColor

  export default invert
}
