        BardAuth.updateNav();
        // ── Mobile menu ──
        const menuBtn = document.getElementById('menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

        // ── Reading progress bar ──
        const bar = document.createElement('div');
        bar.id = 'progress-bar';
        document.body.prepend(bar);
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const total = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';
        });

        const cards = document.querySelectorAll('.blog-card');

        document.querySelectorAll('.blog-card').forEach((card, idx) => {
            const likeCounts = [41, 19, 67, 35];
            const likeContainer = card.querySelector('.flex.items-center.space-x-1');
            if (!likeContainer) return;
            const count = likeCounts[idx] ?? 0;
            likeContainer.innerHTML = `
                <button class="like-btn" aria-label="Like post" data-count="${count}">
                    <span class="like-count">${count}</span>
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                    </svg>
                </button>`;

            likeContainer.querySelector('.like-btn').addEventListener('click', function (e) {
                e.stopPropagation();
                const isLiked = this.classList.toggle('liked');
                const countEl = this.querySelector('.like-count');
                let n = parseInt(this.dataset.count);
                n = isLiked ? n + 1 : n - 1;
                this.dataset.count = n;
                countEl.textContent = n;
            });
        });

        // ── Live search / filter ──
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');
        const noResults = document.getElementById('no-results');

        searchBtn.addEventListener('click', () => {
            searchInput.classList.toggle('open');
            if (searchInput.classList.contains('open')) {
                searchInput.focus();
            } else {
                searchInput.value = '';
                filterCards('');
            }
        });

        searchInput.addEventListener('input', () => filterCards(searchInput.value));
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.classList.remove('open');
                searchInput.value = '';
                filterCards('');
            }
        });

        function filterCards(query) {
            const q = query.toLowerCase().trim();
            let visibleCount = 0;
            cards.forEach(card => {
                const title = (card.dataset.title || '').toLowerCase();
                const tags = (card.dataset.tags || '').toLowerCase();
                const match = !q || title.includes(q) || tags.includes(q);
                card.style.display = match ? '' : 'none';
                if (match) visibleCount++;
            });
            noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        }

        cards.forEach(card => {
            const article = card.querySelector('article');
            card.addEventListener('mousemove', (e) => {
                const rect = article.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const cx = rect.width / 2;
                const cy = rect.height / 2;
                const rotateX = ((y - cy) / cy) * -3;
                const rotateY = ((x - cx) / cx) * 3;
                article.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                article.style.transition = 'transform 0.1s ease';
            });
            card.addEventListener('mouseleave', () => {
                article.style.transform = '';
                article.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            });
        });

        // ══════════════════════════════════════════════════════
        //   POST READER OVERLAY
        // ══════════════════════════════════════════════════════

        const POSTS = [
            {
                id: 'gut',
                title: 'The Gut-Brain Connection',
                author: 'Priya Nair',
                avatar: 'https://i.pravatar.cc/64?img=5',
                date: 'Jun 10, 2022',
                read: '4 min read',
                views: '3,847 views',
                img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&auto=format&fit=crop',
                color: '#5C7A6E',
                body: `
                    <p>Your gut is your second brain — and the science behind this statement is more compelling than most people realise. The gut-brain axis is a two-way communication highway between your enteric nervous system and your central nervous system.</p>
                    <h2>Why Your Gut Matters</h2>
                    <p>Roughly 95% of your body's serotonin is produced in the gut. This means that what you eat doesn't just affect how you feel physically — it directly shapes your mood, focus, and mental resilience.</p>
                    <blockquote>"A diverse microbiome is one of the best indicators of overall health." — Dr. Emeran Mayer</blockquote>
                    <p>Research shows that people with diets rich in fermented foods, fibre, and diverse plant matter report significantly lower rates of anxiety and depression compared to those eating processed, low-fibre diets.</p>
                    <h2>What to Eat</h2>
                    <p>Focus on variety: aim for 30 different plants a week. Include fermented staples like yoghurt, kefir, kimchi, and sauerkraut. Add prebiotic foods like garlic, onions, and oats — these feed the beneficial bacteria already living in your gut.</p>
                    <p>Reduce ultra-processed foods, artificial sweeteners, and excessive alcohol. These are consistently linked to reduced microbiome diversity and increased gut permeability — sometimes called "leaky gut."</p>
                    <h2>The Takeaway</h2>
                    <p>Small, consistent dietary shifts compound over time. Start by adding one fermented food and five new plant varieties per week. Your gut — and your mind — will thank you for it.</p>
                `,
                comments: [
                    { name: 'Rohan Mehta', avatar: 'https://i.pravatar.cc/40?img=11', date: 'Jun 12, 2022', text: 'This completely changed how I approach my morning meals. Started adding kimchi to everything!', likes: 14 },
                    { name: 'Anika Sharma', avatar: 'https://i.pravatar.cc/40?img=21', date: 'Jun 14, 2022', text: 'The 30 plants a week challenge sounds daunting but once I started counting, I was already at 18. Great motivator.', likes: 9 },
                    { name: 'Dev Kapoor', avatar: 'https://i.pravatar.cc/40?img=33', date: 'Jun 18, 2022', text: 'Would love a follow-up on the gut-sleep connection specifically. Amazing article regardless.', likes: 6 }
                ]
            },
            {
                id: 'meal',
                title: 'Meal Prep Like a Pro',
                author: 'Arjun Mehta',
                avatar: 'https://i.pravatar.cc/64?img=12',
                date: 'Aug 3, 2022',
                read: '5 min read',
                views: '2,190 views',
                img: 'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=900&auto=format&fit=crop',
                color: '#A07850',
                body: `
                    <p>Sunday meal prep sounds like a chore — until you experience the calm of opening your fridge on a Wednesday evening and finding everything you need, ready and waiting. That calm is worth building a routine around.</p>
                    <h2>The 90-Minute Rule</h2>
                    <p>You don't need an entire day. A well-planned 90-minute session can produce five balanced, delicious meals. The key is batch cooking proteins and grains, then mixing components throughout the week for variety.</p>
                    <blockquote>"Failing to prepare is preparing to fail — especially when hunger strikes at 8pm." </blockquote>
                    <p>Choose one grain (brown rice, quinoa, farro), one protein (roast chicken, baked tofu, lentils), and three to four vegetables. Roast the vegetables together, cook the grain, and store separately. The combinations are endless.</p>
                    <h2>Container Strategy</h2>
                    <p>Invest in glass containers of two sizes: 500ml for lunches and 900ml for dinners. Label everything with the date. Use a lazy Susan in your fridge so nothing gets buried and forgotten.</p>
                    <h2>The Takeaway</h2>
                    <p>Start small. Prep just lunch for the week on your first attempt. Once that becomes second nature, add dinners. Within a month, you'll have reclaimed hours of your week and be eating better than ever.</p>
                `,
                comments: [
                    { name: 'Sunita Rao', avatar: 'https://i.pravatar.cc/40?img=44', date: 'Aug 5, 2022', text: 'The 90-minute rule is a game changer. I always thought meal prep required half a Sunday.', likes: 22 },
                    { name: 'Vikram Nair', avatar: 'https://i.pravatar.cc/40?img=55', date: 'Aug 9, 2022', text: 'Glass containers recommendation is spot on. Switched from plastic last month and everything tastes fresher.', likes: 11 }
                ]
            },
            {
                id: 'sleep',
                title: 'Sleep: The Ultimate Recovery Tool',
                author: 'Leena Shah',
                avatar: 'https://i.pravatar.cc/64?img=22',
                date: 'Jan 15, 2023',
                read: '3 min read',
                views: '5,502 views',
                img: 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=900&auto=format&fit=crop',
                color: '#3D5A80',
                body: `
                    <p>We live in a culture that glorifies busyness and treats sleep as an optional luxury. The science says otherwise — sleep is the single most powerful performance-enhancing tool available to every human being, completely free of charge.</p>
                    <h2>What Happens When You Sleep</h2>
                    <p>During deep sleep, your brain clears metabolic waste products through the glymphatic system — think of it as a nightly pressure wash for your neurons. Memory consolidation, hormone regulation, tissue repair, and immune calibration all happen primarily during sleep.</p>
                    <blockquote>"Sleep is the Swiss Army knife of health." — Matthew Walker, Why We Sleep</blockquote>
                    <p>Chronic sleep deprivation — even just six hours a night over two weeks — impairs cognitive function to the same degree as 24 hours of total sleep deprivation. Most people simply can't tell how impaired they are.</p>
                    <h2>Foods That Help You Sleep</h2>
                    <p>Tart cherries, kiwi, and fatty fish are rich in natural melatonin or the nutrients that support its production. Magnesium — found in pumpkin seeds, spinach, and dark chocolate — activates the parasympathetic nervous system, helping you wind down.</p>
                    <h2>The Non-Negotiables</h2>
                    <p>Keep a consistent wake time seven days a week. Even on weekends. This one habit, more than any supplement or sleep hack, does the most to regulate your circadian rhythm and improve your sleep quality over time.</p>
                `,
                comments: [
                    { name: 'Karan Singh', avatar: 'https://i.pravatar.cc/40?img=7', date: 'Jan 17, 2023', text: 'The consistent wake time tip changed my life. Three weeks in and I fall asleep in under 10 minutes every night now.', likes: 38 },
                    { name: 'Meera Pillai', avatar: 'https://i.pravatar.cc/40?img=19', date: 'Jan 20, 2023', text: 'Finally someone explaining the glymphatic system simply. Share this with everyone you know who brags about sleeping 5 hours.', likes: 27 },
                    { name: 'Aditya Rao', avatar: 'https://i.pravatar.cc/40?img=66', date: 'Jan 25, 2023', text: 'Matthew Walker\'s book is incredible. This article is a great summary for people who haven\'t read it yet.', likes: 15 },
                    { name: 'Tanya Gupta', avatar: 'https://i.pravatar.cc/40?img=48', date: 'Feb 2, 2023', text: 'Started eating two kiwis before bed after reading this. Absolutely notice a difference in how quickly I feel sleepy.', likes: 19 }
                ]
            },
            {
                id: 'fashion',
                title: 'Why Slow Fashion Wins',
                author: 'Riya Desai',
                avatar: 'https://i.pravatar.cc/64?img=33',
                date: 'Apr 2, 2023',
                read: '6 min read',
                views: '1,874 views',
                img: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop',
                color: '#7B5E7B',
                body: `
                    <p>The fashion industry produces 92 million tonnes of textile waste every year. Behind that number are overflowing landfills, polluted rivers, and garment workers paid wages that can't sustain a dignified life. Slow fashion isn't just an aesthetic — it's a response to this crisis.</p>
                    <h2>What Slow Fashion Actually Means</h2>
                    <p>Slow fashion means buying less, buying better, and wearing things for longer. It means understanding where your clothes come from, who made them, and what they're made of. It means treating a well-made garment the way previous generations did — as something valuable and long-lasting.</p>
                    <blockquote>"The most sustainable garment is the one already in your wardrobe."</blockquote>
                    <p>Natural fibres — organic cotton, linen, wool, and hemp — biodegrade at the end of their life and breathe better against your skin. Synthetic fabrics like polyester shed microplastics with every wash, entering waterways and eventually food chains.</p>
                    <h2>A Simple Framework</h2>
                    <p>Before any purchase, ask yourself three questions: Will I wear this at least 30 times? Could I find this second-hand? Is the brand transparent about its supply chain? If the answer to all three is uncertain, wait a week. You'll often find the impulse fades.</p>
                    <h2>Starting Points</h2>
                    <p>Begin by auditing your wardrobe. Pull out everything you haven't worn in a year and donate or sell it. Identify the gaps — real gaps, not wishful thinking gaps. Then fill them intentionally, with pieces built to last.</p>
                `,
                comments: [
                    { name: 'Ishaan Verma', avatar: 'https://i.pravatar.cc/40?img=52', date: 'Apr 4, 2023', text: 'The 30-wears question is something I now ask myself every single time. It\'s stopped at least four impulse purchases this month alone.', likes: 17 },
                    { name: 'Priya Menon', avatar: 'https://i.pravatar.cc/40?img=29', date: 'Apr 7, 2023', text: 'Audited my wardrobe after reading this. Donated 40 items. Feel lighter already.', likes: 31 }
                ]
            }
        ];

        // Overlay DOM references
        const overlay = document.getElementById('post-overlay');
        const overlayClose = document.getElementById('overlay-close');
        const ovBgLeft = document.getElementById('overlay-bg-left');
        const ovBgRight = document.getElementById('overlay-bg-right');
        const ovScroll = document.getElementById('overlay-scroll');
        const ovAvatar = document.getElementById('ov-avatar');
        const ovAuthor = document.getElementById('ov-author');
        const ovDate = document.getElementById('ov-date');
        const ovRead = document.getElementById('ov-read');
        const ovTitle = document.getElementById('ov-title');
        const ovHero = document.getElementById('ov-hero');
        const ovBody = document.getElementById('ov-body');
        const ovViews = document.getElementById('ov-views');
        const ovCommCount = document.getElementById('ov-comments-count');
        const ovRecentGrid = document.getElementById('ov-recent-grid');
        const ovCommentList = document.getElementById('ov-comment-list');
        const ovCommentHead = document.getElementById('ov-comment-heading');
        const ovCommentInput = document.getElementById('ov-comment-input');
        const ovCommentSubmit = document.getElementById('ov-comment-submit');

        function openPost(postId) {
            const post = POSTS.find(p => p.id === postId);
            if (!post) return;

            // Populate fields
            ovAvatar.src = post.avatar;
            ovAuthor.textContent = post.author;
            ovDate.textContent = post.date;
            ovRead.textContent = post.read;
            ovTitle.textContent = post.title;
            ovHero.style.backgroundImage = `url('${post.img}')`;
            ovBody.innerHTML = post.body;
            ovViews.textContent = post.views;
            ovCommCount.textContent = `${post.comments.length} comments`;
            ovCommentHead.textContent = `${post.comments.length} Comments`;

            // Side panels — use post image as blurred background
            const bgStyle = `url('${post.img}')`;
            ovBgLeft.style.backgroundImage = bgStyle;
            ovBgRight.style.backgroundImage = bgStyle;

            // Recent posts (all others)
            const others = POSTS.filter(p => p.id !== postId);
            ovRecentGrid.innerHTML = others.map(p => `
                <div class="ov-recent-card" onclick="openPost('${p.id}')">
                    <img class="ov-recent-img" src="${p.img}" alt="${p.title}" />
                    <p class="ov-recent-title">${p.title}</p>
                    <p class="ov-recent-meta">${p.date} · ${p.read}</p>
                </div>
            `).join('');

            // Comments
            renderComments(post.comments.slice());

            // Show overlay
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
            ovScroll.scrollTop = 0;
        }

        function renderComments(comments) {
            ovCommentList.innerHTML = comments.map((c, i) => `
                <div class="ov-comment">
                    <img class="ov-comment-avatar" src="${c.avatar}" alt="${c.name}" />
                    <div class="ov-comment-body">
                        <div class="ov-comment-header">
                            <span class="ov-comment-name">${c.name}</span>
                            <span class="ov-comment-date">${c.date}</span>
                        </div>
                        <p class="ov-comment-text">${c.text}</p>
                        <div class="ov-comment-actions">
                            <button class="ov-comment-action-btn" onclick="likeComment(this, ${c.likes})">
                                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path stroke-linecap="round" stroke-linejoin="round" d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
                                <span class="like-num">${c.likes}</span>
                            </button>
                            <button class="ov-comment-action-btn">
                                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                                Reply
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function likeComment(btn, baseCount) {
            const isLiked = btn.classList.toggle('liked');
            btn.querySelector('.like-num').textContent = isLiked ? baseCount + 1 : baseCount;
            btn.style.color = isLiked ? '#000' : '';
        }

        function closePost() {
            overlay.classList.remove('open');
            document.body.style.overflow = '';
        }

        // Wire card clicks → open overlay
        cards.forEach(card => {
            const topic = card.dataset.topic;
            if (!topic) return;
            card.querySelector('article').addEventListener('click', () => openPost(topic));
            card.style.cursor = 'pointer';
        });

        // Close handlers
        overlayClose.addEventListener('click', closePost);
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closePost(); });

        // ══════════════════════════════════════════════════════
        //   INJECT USER-PUBLISHED POSTS FROM localStorage
        // ══════════════════════════════════════════════════════

        (function injectUserPosts() {
            const POSTS_KEY = 'bard-posts';
            let userPosts = [];
            try {
                userPosts = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]')
                    .filter(p => p.status === 'published');
            } catch (e) { return; }

            if (!userPosts.length) return;

            const list = document.querySelector('[data-purpose="blog-posts-list"]');
            if (!list) return;

            userPosts.forEach(post => {
                // ── Build card HTML matching existing .blog-card structure ──
                const cover = post.cover || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop';
                const color = post.topicColor || '#5C7A6E';
                const topicLabel = (post.topicLabel || post.topic || '').toUpperCase();
                const readTime = post.read || '1 min read';
                const date = post.date || '';
                const title = post.title || 'Untitled';
                const excerpt = post.excerpt || '';
                const safeId = 'user-' + post.id;

                const cardEl = document.createElement('div');
                cardEl.className = 'blog-card';
                cardEl.dataset.title = title.toLowerCase();
                cardEl.dataset.tags = (post.topicLabel || post.topic || '').toLowerCase();
                cardEl.dataset.topic = post.topic || '';
                cardEl.dataset.userId = post.id;

                cardEl.innerHTML = `
                    <article class="bg-brand-card-bg flex flex-col md:flex-row h-[400px] overflow-hidden shadow-sm">
                        <div class="md:w-[55%] h-full relative overflow-hidden" style="background:${color};">
                            <span class="read-badge">${readTime}</span>
                            <img alt="${title}" class="card-img w-full h-full object-cover mix-blend-multiply opacity-80"
                                src="${cover}" onerror="this.style.display='none'" />
                            <div class="absolute inset-0 flex flex-col items-center justify-end pb-8 text-white font-display text-center uppercase tracking-widest text-base px-4 overflow-hidden">
                                <p>${topicLabel}</p>
                            </div>
                        </div>
                        <div class="md:w-[45%] p-10 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center justify-between mb-6">
                                    <div class="flex items-center space-x-3">
                                        <img alt="You" class="w-8 h-8 rounded-full" src="https://i.pravatar.cc/32?img=68" />
                                        <div class="text-xs text-brand-gray">
                                            <p class="font-medium text-gray-800">You</p>
                                            <p>${date} · ${readTime}</p>
                                        </div>
                                    </div>
                                    <span class="text-[10px] font-bold tracking-widest uppercase bg-black text-white px-2 py-0.5">Your Post</span>
                                </div>
                                <h2 class="block font-display text-2xl md:text-3xl uppercase leading-[1.15] mb-4 text-[#2A2A2A] overflow-hidden">
                                    ${title}
                                </h2>
                                ${excerpt ? `<p class="text-brand-gray text-sm leading-relaxed mb-4 line-clamp-3">${excerpt}</p>` : ''}
                            </div>
                            <div>
                                <div class="h-px bg-brand-border w-full mb-4"></div>
                                <div class="flex items-center justify-between text-xs text-brand-gray">
                                    <div class="flex space-x-4">
                                        <span>${post.words || 0} words</span>
                                    </div>
                                    <div class="flex items-center space-x-1">
                                        <button class="like-btn" aria-label="Like post" data-count="0">
                                            <span class="like-count">0</span>
                                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                    stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>`;

                // Append to posts list
                list.appendChild(cardEl);

                // ── Wire like button ──
                const likeBtn = cardEl.querySelector('.like-btn');
                likeBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const isLiked = this.classList.toggle('liked');
                    const countEl = this.querySelector('.like-count');
                    let n = parseInt(this.dataset.count);
                    n = isLiked ? n + 1 : n - 1;
                    this.dataset.count = n;
                    countEl.textContent = n;
                });

                // ── Add to POSTS array so overlay works ──
                const overlayPost = {
                    id: safeId,
                    title: title,
                    author: 'You',
                    avatar: 'https://i.pravatar.cc/64?img=68',
                    date: date,
                    read: readTime,
                    views: (post.words || 0) + ' words',
                    img: cover,
                    color: color,
                    body: (post.body || '').split('\n\n')
                        .filter(p => p.trim())
                        .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
                        .join(''),
                    comments: []
                };
                POSTS.push(overlayPost);

                // ── Wire card click → overlay ──
                cardEl.querySelector('article').addEventListener('click', () => openPost(safeId));
                cardEl.style.cursor = 'pointer';
            });
        })();

        // Submit new comment (adds to top of list)
        ovCommentSubmit.addEventListener('click', () => {
            const text = ovCommentInput.value.trim();
            if (!text) return;
            const newComment = {
                name: 'You',
                avatar: 'https://i.pravatar.cc/40?img=1',
                date: 'Just now',
                text,
                likes: 0
            };
            const existing = Array.from(ovCommentList.querySelectorAll('.ov-comment')).length;
            ovCommentHead.textContent = `${existing + 1} Comments`;
            // Prepend new comment
            const tempWrapper = document.createElement('div');
            renderComments([newComment]);
            const newHtml = ovCommentList.innerHTML;
            const originalPost = POSTS.find(p => p.id === overlay.dataset.currentPost);
            if (originalPost) renderComments([newComment, ...originalPost.comments]);
            ovCommentInput.value = '';
        });