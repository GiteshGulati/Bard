
        BardAuth.updateNav();

        // ── Mobile menu ──
        document.getElementById('menu-btn').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });

        // ── Writers Data ──
        const WRITERS = [
            {
                id: 'priya',
                name: 'Priya Nair',
                avatar: 'https://i.pravatar.cc/160?img=5',
                bio: 'Writing about gut health, nutrition, and the quiet power of eating well.',
                topics: ['Gut Health', 'Nutrition', 'Wellness'],
                color: '#5C7A6E',
                posts: [
                    { title: 'The Gut-Brain Connection', excerpt: 'Your gut is your second brain. Discover how a diverse, fibre-rich diet can transform your wellbeing from the inside out.', topicLabel: 'Gut Health', cover: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop', date: 'Jun 10, 2022', read: '4 min read' },
                    { title: 'Fermented Foods 101', excerpt: 'A beginner-friendly guide to incorporating kimchi, kefir, and sauerkraut into your daily meals.', topicLabel: 'Nutrition', cover: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&auto=format&fit=crop', date: 'Aug 22, 2022', read: '6 min read' }
                ]
            },
            {
                id: 'arjun',
                name: 'Arjun Mehta',
                avatar: 'https://i.pravatar.cc/160?img=12',
                bio: 'Batch cooking, seasonal ingredients, and making peace with your kitchen.',
                topics: ['Meal Prep', 'Cooking', 'Organic'],
                color: '#A07850',
                posts: [
                    { title: 'Meal Prep Like a Pro', excerpt: 'Stop wasting Sunday evenings on last-minute cooking. A step-by-step guide to batch-cooking wholesome, organic meals.', topicLabel: 'Meal Prep', cover: 'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=800&auto=format&fit=crop', date: 'Aug 3, 2022', read: '5 min read' },
                    { title: 'One Pot, Thirty Meals', excerpt: 'How a single Dutch oven became the most-used tool in my kitchen — and saved me hours every week.', topicLabel: 'Cooking', cover: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop', date: 'Oct 15, 2022', read: '4 min read' }
                ]
            },
            {
                id: 'leena',
                name: 'Leena Shah',
                avatar: 'https://i.pravatar.cc/160?img=22',
                bio: 'Sleep science, evening routines, and the art of doing less with more intention.',
                topics: ['Sleep', 'Recovery', 'Mindfulness'],
                color: '#3D5A80',
                posts: [
                    { title: 'Sleep: The Ultimate Recovery Tool', excerpt: 'Quality sleep is the most powerful recovery tool you have. Learn how nutrition and routine can help you rest deeper.', topicLabel: 'Sleep', cover: 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=800&auto=format&fit=crop', date: 'Jan 15, 2023', read: '3 min read' },
                    { title: 'Wind Down, Not Out', excerpt: 'A two-hour evening routine that changed everything — from blue light to breathwork to bedtime tea.', topicLabel: 'Recovery', cover: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&auto=format&fit=crop', date: 'Mar 8, 2023', read: '5 min read' }
                ]
            },
            {
                id: 'riya',
                name: 'Riya Desai',
                avatar: 'https://i.pravatar.cc/160?img=33',
                bio: 'Slow fashion, natural fibres, and building a wardrobe that lasts a lifetime.',
                topics: ['Fashion', 'Sustainability', 'Lifestyle'],
                color: '#7B5E7B',
                posts: [
                    { title: 'Why Slow Fashion Wins', excerpt: 'Fast fashion harms the planet — and your skin. The case for natural-fibre wearables that look better and last longer.', topicLabel: 'Fashion', cover: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop', date: 'Apr 2, 2023', read: '6 min read' },
                    { title: 'Ten Pieces, Thirty Outfits', excerpt: 'How a curated capsule wardrobe simplified my mornings and reduced my environmental footprint.', topicLabel: 'Sustainability', cover: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop', date: 'Jul 19, 2023', read: '4 min read' }
                ]
            },
            {
                id: 'anika',
                name: 'Anika Rao',
                avatar: 'https://i.pravatar.cc/160?img=44',
                bio: 'Morning rituals, digital detox, and finding stillness in a noisy world.',
                topics: ['Mindfulness', 'Mental Health', 'Focus'],
                color: '#4A5D4E',
                posts: [
                    { title: 'Mornings Without a Phone', excerpt: 'The first hour of the day sets the tone for everything that follows. Here is the quiet ritual that stuck.', topicLabel: 'Mindfulness', cover: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop', date: 'Mar 12, 2026', read: '4 min read' },
                    { title: 'The 30-Day Digital Detox', excerpt: 'What happened when I deleted social media for a month — and what I brought back, and what I did not.', topicLabel: 'Mental Health', cover: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop', date: 'May 5, 2026', read: '7 min read' }
                ]
            },
            {
                id: 'rohan',
                name: 'Rohan Kapoor',
                avatar: 'https://i.pravatar.cc/160?img=51',
                bio: 'Journaling, breathwork, and the quiet practice of paying attention.',
                topics: ['Mindfulness', 'Journaling', 'Wellness'],
                color: '#82915F',
                posts: [
                    { title: 'Write Before You Wake', excerpt: 'Three pages of longhand, stream-of-consciousness writing every morning. The practice that rewired my brain.', topicLabel: 'Journaling', cover: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&auto=format&fit=crop', date: 'Feb 20, 2026', read: '3 min read' },
                    { title: 'Breathwork for Beginners', excerpt: 'You do not need a retreat or an app. Just five minutes, a quiet room, and this simple four-step technique.', topicLabel: 'Wellness', cover: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&auto=format&fit=crop', date: 'Apr 14, 2026', read: '4 min read' }
                ]
            }
        ];

        // ── Follow State ──
        const FOLLOW_KEY = 'bard-following';
        let followed = new Set(JSON.parse(localStorage.getItem(FOLLOW_KEY) || '[]'));

        function saveFollowed() {
            localStorage.setItem(FOLLOW_KEY, JSON.stringify([...followed]));
        }

        // ── Render Writers ──
        function renderWriters() {
            const grid = document.getElementById('writers-grid');
            document.getElementById('following-count').textContent = followed.size;

            const allFollowed = followed.size === WRITERS.length;
            const selectAllBtn = document.getElementById('select-all-btn');
            selectAllBtn.textContent = allFollowed ? 'Unfollow All' : 'Follow All';

            grid.innerHTML = WRITERS.map(w => {
                const isFollowed = followed.has(w.id);
                return `
                    <div class="writer-card" data-writer="${w.id}">
                        <div class="writer-img" style="background:${w.color};">
                            <img src="${w.avatar}" alt="${w.name}" class="mix-blend-multiply opacity-85" />
                        </div>
                        <div class="p-5 md:p-6 flex flex-col justify-between">
                            <div>
                                <h3 class="font-display text-xl md:text-2xl uppercase leading-[1.15] mb-1">${w.name}</h3>
                                <p class="text-sm text-brand-gray leading-relaxed mb-3 line-clamp-2">${w.bio}</p>
                                <div class="mb-3">
                                    ${w.topics.map(t => `<span class="topic-tag">${t}</span>`).join('')}
                                </div>
                            </div>
                            <div class="flex items-center justify-between">
                                <p class="text-xs text-brand-gray">${w.posts.length} post${w.posts.length !== 1 ? 's' : ''}</p>
                                <button class="follow-btn ${isFollowed ? 'active' : ''}" data-writer-id="${w.id}">
                                    ${isFollowed ? 'Following' : 'Follow'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            grid.querySelectorAll('.follow-btn').forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const id = this.dataset.writerId;
                    if (followed.has(id)) {
                        followed.delete(id);
                    } else {
                        followed.add(id);
                    }
                    saveFollowed();
                    renderWriters();
                    renderFeed();
                });
            });
        }

        // ── Render Feed ──
        function renderFeed() {
            const list = document.getElementById('feed-list');
            const empty = document.getElementById('feed-empty');

            const posts = [];
            WRITERS.forEach(w => {
                if (followed.has(w.id)) {
                    w.posts.forEach(p => {
                        posts.push({ ...p, author: w.name, avatar: w.avatar, color: w.color });
                    });
                }
            });

            posts.sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });

            if (!posts.length) {
                list.classList.add('hidden');
                empty.classList.remove('hidden');
                return;
            }

            list.classList.remove('hidden');
            empty.classList.add('hidden');

            list.innerHTML = posts.map(p => `
                <article class="post-row">
                    <div class="h-full min-h-[140px] overflow-hidden" style="background:${p.color};">
                        <img src="${p.cover}" alt="" class="w-full h-full object-cover mix-blend-multiply opacity-80" />
                    </div>
                    <div class="p-5 md:p-6 flex flex-col justify-between">
                        <div>
                            <div class="flex items-center gap-2 mb-2">
                                <img src="${p.avatar}" alt="${p.author}" class="w-5 h-5 rounded-full" />
                                <p class="text-xs text-brand-gray">${p.author} &middot; ${p.date} &middot; ${p.read}</p>
                            </div>
                            <h3 class="font-display text-xl md:text-2xl uppercase leading-[1.15] mb-2">${p.title}</h3>
                            <p class="text-sm text-brand-gray leading-relaxed line-clamp-2">${p.excerpt}</p>
                        </div>
                        <p class="text-xs font-semibold tracking-widest uppercase text-brand-gray mt-3">${p.topicLabel}</p>
                    </div>
                </article>
            `).join('');
        }

        // ── Tabs ──
        function switchTab(tab) {
            const writersTab = document.getElementById('tab-writers');
            const feedTab = document.getElementById('tab-feed');
            const writersPanel = document.getElementById('panel-writers');
            const feedPanel = document.getElementById('panel-feed');

            if (tab === 'writers') {
                writersTab.classList.add('font-bold', 'border-black');
                writersTab.classList.remove('font-medium', 'text-on-surface-variant', 'border-transparent');
                feedTab.classList.add('font-medium', 'text-on-surface-variant', 'border-transparent');
                feedTab.classList.remove('font-bold', 'border-black');
                writersPanel.classList.remove('hidden');
                feedPanel.classList.add('hidden');
            } else {
                feedTab.classList.add('font-bold', 'border-black');
                feedTab.classList.remove('font-medium', 'text-on-surface-variant', 'border-transparent');
                writersTab.classList.add('font-medium', 'text-on-surface-variant', 'border-transparent');
                writersTab.classList.remove('font-bold', 'border-black');
                feedPanel.classList.remove('hidden');
                writersPanel.classList.add('hidden');
            }
        }

        document.getElementById('tab-writers').addEventListener('click', () => switchTab('writers'));
        document.getElementById('tab-feed').addEventListener('click', () => switchTab('feed'));

        // ── Follow All ──
        document.getElementById('select-all-btn').addEventListener('click', () => {
            const allFollowed = followed.size === WRITERS.length;
            if (allFollowed) {
                followed.clear();
            } else {
                WRITERS.forEach(w => followed.add(w.id));
            }
            saveFollowed();
            renderWriters();
            renderFeed();
        });

        // ── Init ──
        renderWriters();
        renderFeed();