export function slugify(input) {
  return String(input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'article';
}

export function withSuffix(base, suffix) {
  const cut = base.slice(0, Math.max(8, 72 - suffix.length - 1));
  return `${cut}-${suffix}`;
}
