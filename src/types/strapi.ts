export interface TImage {
  id: number
  url: string
  alternativeText?: string
  caption?: string
  width?: number
  height?: number
  formats?: {
    thumbnail?: { url: string }
    small?: { url: string }
    medium?: { url: string }
    large?: { url: string }
  }
}
