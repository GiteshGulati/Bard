
        BardAuth.updateNav();
        var currentUser = BardAuth.getUser();
        if (currentUser) {
            document.querySelector('h1').textContent = currentUser.firstName;
            var avatar = document.querySelector('section img');
            if (avatar) avatar.alt = currentUser.firstName;
        }

        const SAMPLE = [
            {
                title: 'Mornings Without a Phone',
                excerpt: 'The first hour of the day sets the tone for everything that follows. Here is the quiet ritual that stuck.',
                topicLabel: 'Mindfulness',
                topicColor: '#4A5D4E',
                cover: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop',
                date: 'Mar 12, 2026',
                read: '4 min read'
            },
            {
                title: 'What I Eat When I Am Tired',
                excerpt: 'Hunger plus exhaustion is a dangerous combination. A short list of meals that ask almost nothing of you.',
                topicLabel: 'Meal Prep',
                topicColor: '#A07850',
                cover: 'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=800&auto=format&fit=crop',
                date: 'Jan 28, 2026',
                read: '5 min read'
            },
            {
                title: 'Sleep Is a Practice',
                excerpt: 'Not a hack. Not a luxury. Notes from a year of going to bed at the same time, even on weekends.',
                topicLabel: 'Sleep',
                topicColor: '#3D5A80',
                cover: 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=800&auto=format&fit=crop',
                date: 'Nov 4, 2025',
                read: '3 min read'
            }
        ];

        let published = [];
        try {
            published = JSON.parse(localStorage.getItem('bard-posts') || '[]');
        } catch (err) {
            published = [];
        }

        const stories = [...published, ...SAMPLE];
        document.getElementById('stat-posts').textContent = stories.length;

        const list = document.getElementById('stories');
        const empty = document.getElementById('empty');

        if (!stories.length) {
            list.classList.add('hidden');
            empty.classList.remove('hidden');
        } else {
            list.innerHTML = stories.map((s) => `
                <article class="story-row">
                    <div class="h-full min-h-[140px] overflow-hidden" style="background:${s.topicColor || '#5C7A6E'};">
                        <img src="${s.cover}" alt="" class="w-full h-full object-cover mix-blend-multiply opacity-80" />
                    </div>
                    <div class="p-5 md:p-6 flex flex-col justify-between">
                        <div>
                            <p class="text-xs text-brand-gray mb-2">${s.date || ''} · ${s.read || ''}</p>
                            <h3 class="font-display text-xl md:text-2xl uppercase leading-[1.15] mb-2">${s.title}</h3>
                            <p class="text-sm text-brand-gray leading-relaxed line-clamp-2">${s.excerpt || ''}</p>
                        </div>
                        <p class="text-xs font-semibold tracking-widest uppercase text-brand-gray mt-3">${s.topicLabel || s.topic || ''}</p>
                    </div>
                </article>
            `).join('');
        }

        document.getElementById('menu-btn').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });

        var profileStorage = JSON.parse(localStorage.getItem('bard-profile') || '{}');
        var modal = document.getElementById('edit-modal');
        var tagWrap = document.getElementById('tag-input-wrap');
        var tagInput = document.getElementById('tag-input');
        var profileTags = profileStorage.tags || [];
        var pendingAvatar = null;

        function renderTags() {
            tagWrap.querySelectorAll('.tag-chip').forEach(function(c) { c.remove(); });
            profileTags.forEach(function(t, i) {
                var chip = document.createElement('span');
                chip.className = 'tag-chip';
                chip.innerHTML = t + '<button type="button" data-i="' + i + '">&times;</button>';
                tagWrap.insertBefore(chip, tagInput);
            });
        }

        function loadProfile() {
            if (profileStorage.avatar) {
                document.querySelector('section img').src = profileStorage.avatar;
            }
            if (profileStorage.firstName) {
                document.querySelector('h1').textContent = profileStorage.firstName;
                document.querySelector('section img').alt = profileStorage.firstName;
            }
            if (profileStorage.bio) {
                document.querySelector('section .text-sm.text-on-surface-variant').textContent = profileStorage.bio;
            }
            if (profileStorage.tags && profileStorage.tags.length) {
                var tagContainer = document.querySelector('section .mb-6');
                tagContainer.innerHTML = profileStorage.tags.map(function(t) {
                    return '<span class="topic-tag">' + t + '</span>';
                }).join('');
            }
        }

        document.getElementById('edit-profile-btn').addEventListener('click', function() {
            var user = BardAuth.getUser();
            document.getElementById('field-first').value = (profileStorage.firstName) || (user ? user.firstName : '');
            document.getElementById('field-last').value = profileStorage.lastName || (user ? user.lastName || '' : '');
            document.getElementById('field-bio').value = profileStorage.bio || '';
            document.getElementById('field-avatar').value = profileStorage.avatar || '';
            var previewSrc = profileStorage.avatar || 'https://i.pravatar.cc/160?img=68';
            document.getElementById('avatar-preview').src = previewSrc;
            pendingAvatar = null;
            profileTags = profileStorage.tags ? profileStorage.tags.slice() : [];
            renderTags();
            modal.classList.add('active');
        });

        document.getElementById('modal-close').addEventListener('click', function() {
            modal.classList.remove('active');
        });
        document.getElementById('modal-cancel').addEventListener('click', function() {
            modal.classList.remove('active');
        });
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.classList.remove('active');
        });

        tagInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                var val = tagInput.value.trim();
                if (val && profileTags.indexOf(val) === -1) {
                    profileTags.push(val);
                    renderTags();
                }
                tagInput.value = '';
            }
        });
        tagWrap.addEventListener('click', function() { tagInput.focus(); });
        tagWrap.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON' && e.target.dataset.i !== undefined) {
                profileTags.splice(parseInt(e.target.dataset.i), 1);
                renderTags();
            }
        });

        var avatarFile = document.getElementById('avatar-file');
        var avatarPreview = document.getElementById('avatar-preview');

        document.getElementById('avatar-label').addEventListener('click', function(e) {
            if (e.target.tagName !== 'INPUT') e.preventDefault();
        });

        avatarFile.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) return;
            var reader = new FileReader();
            reader.onload = function(ev) {
                pendingAvatar = ev.target.result;
                avatarPreview.src = pendingAvatar;
                document.getElementById('field-avatar').value = '';
            };
            reader.readAsDataURL(file);
        });

        document.getElementById('field-avatar').addEventListener('input', function() {
            var url = this.value.trim();
            if (url) {
                pendingAvatar = null;
                avatarPreview.src = url;
            } else {
                avatarPreview.src = profileStorage.avatar || 'https://i.pravatar.cc/160?img=68';
            }
        });

        document.getElementById('profile-form').addEventListener('submit', function(e) {
            e.preventDefault();
            profileStorage.firstName = document.getElementById('field-first').value.trim();
            profileStorage.lastName = document.getElementById('field-last').value.trim();
            profileStorage.bio = document.getElementById('field-bio').value.trim();
            var urlVal = document.getElementById('field-avatar').value.trim();
            profileStorage.avatar = pendingAvatar || urlVal || '';
            profileStorage.tags = profileTags.slice();
            localStorage.setItem('bard-profile', JSON.stringify(profileStorage));
            loadProfile();
            pendingAvatar = null;
            modal.classList.remove('active');
        });

        loadProfile();