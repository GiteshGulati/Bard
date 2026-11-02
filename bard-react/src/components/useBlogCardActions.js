import { useState } from 'react'
import { blogs as blogsApi, social as socialApi } from '../api'
import { useAuth } from '../context/authState'

export async function sendLikeChange(post, liked, onChange, api = blogsApi) {
  const response = liked ? await api.unlike(post.id) : await api.like(post.id)
  onChange?.({ ...post, liked: response.data.liked, likeCount: response.data.likeCount })
  return response.data
}

export async function sendBookmarkChange(post, bookmarked, onChange, api = socialApi) {
  const next = !bookmarked
  if (next) await api.addBookmark(post.id)
  else await api.removeBookmark(post.id)
  onChange?.({ ...post, bookmarked: next })
  return next
}

export function useBlogCardActions({ post, onChange, location, navigate }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(Boolean(post.liked))
  const [bookmarked, setBookmarked] = useState(Boolean(post.bookmarked))
  const [likeCount, setLikeCount] = useState(post.likeCount || 0)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  async function toggleLike(event) {
    event.stopPropagation()
    if (!user) return navigate('/login', { state: { from: location.pathname } })
    setBusy('like'); setMessage('')
    try {
      const result = await sendLikeChange(post, liked, onChange)
      setLiked(result.liked)
      setLikeCount(result.likeCount)
    } catch (error) { setMessage(error.message || 'Could not update like.') }
    finally { setBusy('') }
  }

  async function toggleBookmark(event) {
    event.stopPropagation()
    if (!user) return navigate('/login', { state: { from: location.pathname } })
    setBusy('bookmark'); setMessage('')
    try {
      setBookmarked(await sendBookmarkChange(post, bookmarked, onChange))
    } catch (error) { setMessage(error.message || 'Could not update bookmark.') }
    finally { setBusy('') }
  }

  return { user, liked, bookmarked, likeCount, busy, message, toggleLike, toggleBookmark }
}
