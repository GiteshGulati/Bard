export function articlePath(blog) {
  return blog.status === 'draft' || blog.status === 'hidden'
    ? `/article/id/${blog.id}`
    : `/article/${encodeURIComponent(blog.slug)}`
}
