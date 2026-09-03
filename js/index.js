        (function () {
            const POSTS_KEY = 'bard-posts';

            function getPosts() {
                try {
                    return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
                } catch (e) {
                    return [];
                }
            }

            function escapeHtml(str) {
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
            }

            function buildPostCard(post) {
                const cover = escapeHtml(post.cover || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop');
                const title = escapeHtml(post.title || 'Untitled');
                const excerpt = escapeHtml(post.excerpt || '');
                const topicLabel = escapeHtml(post.topicLabel || post.topic || '');
                const topicColor = escapeHtml(post.topicColor || '#5C7A6E');
                const date = escapeHtml(post.date || '');
                const readTime = escapeHtml(post.read || '1 min read');

                return `
                <article class="feature-card bg-white border border-black/10 overflow-hidden flex flex-col">
                    <div class="relative h-48 overflow-hidden" style="background:${topicColor};">
                        <img src="${cover}" alt="${title}" class="w-full h-full object-cover mix-blend-multiply opacity-80" onerror="this.style.display='none'" />
                        <span class="absolute top-3 right-3 bg-black text-white text-[10px] font-bold tracking-widest uppercase px-2.5 py-1">${readTime}</span>
                    </div>
                    <div class="p-6 flex flex-col gap-3 flex-1">
                        <p class="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">${topicLabel}</p>
                        <h3 class="font-display text-2xl uppercase leading-tight" style="transform:scaleX(1.08);transform-origin:left;">${title}</h3>
                        ${excerpt ? `<p class="text-sm text-on-surface-variant leading-relaxed line-clamp-3">${excerpt}</p>` : ''}
                        <p class="text-xs text-on-surface-variant mt-auto pt-3 border-t border-black/10">${date}</p>
                    </div>
                </article>`;
            }

            function renderUserPosts() {
                const posts = getPosts().filter(p => p.status === 'published');
                if (!posts.length) return;

                const section = document.createElement('section');
                section.id = 'user-posts';
                section.className = 'max-w-7xl mx-auto px-6 py-20';
                section.innerHTML = `
                    <div class="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <p class="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2">Fresh from the community</p>
                            <h2 class="font-display text-5xl md:text-6xl" style="transform:scaleX(1.08);transform-origin:left;">Recent Posts</h2>
                        </div>
                        <a href="blogs.html" class="text-sm underline underline-offset-4 hover:opacity-60 transition-opacity self-start md:self-auto">View all &rarr;</a>
                    </div>
                    <div id="user-posts-grid" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${posts.map(buildPostCard).join('')}
                    </div>`;

                // Insert before the newsletter section so it sits naturally in the page flow
                const newsletter = document.getElementById('contact');
                if (newsletter) {
                    newsletter.parentNode.insertBefore(section, newsletter);
                } else {
                    // Fallback: insert before the footer
                    const footer = document.querySelector('footer');
                    if (footer) footer.parentNode.insertBefore(section, footer);
                }
            }

            // Run after DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', renderUserPosts);
            } else {
                renderUserPosts();
            }
        })();