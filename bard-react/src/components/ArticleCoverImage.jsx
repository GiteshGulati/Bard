import { markImageUnavailable } from './articleImages'

export default function ArticleCoverImage({ src, alt = '', className, style }) {
  if (!src) return null
  return <img src={src} alt={alt} className={className} style={style} referrerPolicy="no-referrer" onError={event => markImageUnavailable(event.currentTarget)} />
}
