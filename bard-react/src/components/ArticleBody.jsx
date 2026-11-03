import { useEffect, useRef } from 'react'
import { markImageUnavailable } from './articleImages'

export default function ArticleBody({ html }) {
  const bodyRef = useRef(null)

  useEffect(() => {
    const root = bodyRef.current
    if (!root) return undefined
    const images = [...root.querySelectorAll('img')]
    const handleError = event => markImageUnavailable(event.currentTarget)
    images.forEach(image => image.addEventListener('error', handleError, { once: true }))
    return () => images.forEach(image => image.removeEventListener('error', handleError))
  }, [html])

  return <article ref={bodyRef} className="ov-body" dangerouslySetInnerHTML={{ __html: html || '<p></p>' }} />
}
