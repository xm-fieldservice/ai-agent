import { DefineComponent } from 'vue'

declare const LazyMedia: DefineComponent<{
  url: string
  type: 'image' | 'video' | 'audio' | 'file'
  thumbnailUrl?: string
  alt?: string
  width?: number
  height?: number
  mediaType?: string
  fileName?: string
  fileSize?: number
}>

export default LazyMedia 