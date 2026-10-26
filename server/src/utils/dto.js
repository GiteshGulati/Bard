import { readingTimeMinutes } from './readingTime.js';

export function publicUser(user, extras = {}) {
  if (!user) return null;
  return {
    id: String(user._id),
    username: user.username,
    displayName: user.displayName,
    bio: user.bio || '',
    avatarUrl: user.avatarPath || null,
    websiteUrl: user.websiteUrl || '',
    role: user.role,
    createdAt: user.createdAt,
    ...extras,
  };
}

export function privateUser(user) {
  return {
    ...publicUser(user),
    email: user.emailNormalized,
    emailVerified: Boolean(user.emailVerified),
  };
}

export function publicBlog(blog, extras = {}) {
  if (!blog) return null;
  const author = blog.author && typeof blog.author === 'object' && blog.author.username
    ? publicUser(blog.author)
    : { id: String(blog.author) };
  return {
    id: String(blog._id),
    slug: blog.slug,
    title: blog.title,
    excerpt: blog.excerpt,
    html: blog.htmlSanitized,
    coverImageUrl: blog.coverImagePath || null,
    tags: blog.tags || [],
    status: blog.status,
    visibility: blog.visibility,
    commentsEnabled: blog.commentsEnabled,
    publishedAt: blog.publishedAt,
    updatedAt: blog.updatedAt,
    createdAt: blog.createdAt,
    readingTimeMinutes: readingTimeMinutes(blog.plainText),
    author,
    likeCount: extras.likeCount ?? blog.likeCount ?? 0,
    commentCount: extras.commentCount ?? blog.commentCount ?? 0,
    liked: extras.liked ?? false,
    bookmarked: extras.bookmarked ?? false,
    ...('delta' in extras ? { content: extras.delta ?? blog.contentDelta } : {}),
  };
}

export function publicComment(comment) {
  return {
    id: String(comment._id),
    blogId: String(comment.blog),
    parentId: comment.parent ? String(comment.parent) : null,
    body: comment.status === 'deleted' ? '' : comment.body,
    status: comment.status,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: comment.author && comment.author.username ? publicUser(comment.author) : { id: String(comment.author) },
  };
}
