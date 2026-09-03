        BardAuth.updateNav();
        var currentUser = BardAuth.getUser();
        if (currentUser) {
            var authorLabel = document.querySelector('#preview-date');
        }

        const DEFAULT_COVER = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop';
        const DRAFT_KEY = 'bard-draft';
        const POSTS_KEY = 'bard-posts';

        const form = document.getElementById('post-form');
        const titleEl = document.getElementById('title');
        const excerptEl = document.getElementById('excerpt');
        const bodyEl = document.getElementById('body');
        const topicEl = document.getElementById('topic');
        const coverUrlEl = document.getElementById('cover-url');
        const coverFileEl = document.getElementById('cover-file');
        const coverDrop = document.getElementById('cover-drop');
        const coverPreviewImg = document.getElementById('cover-preview-img');
        const chips = document.querySelectorAll('.topic-chip');

        const previewTitle = document.getElementById('preview-title');
        const previewExcerpt = document.getElementById('preview-excerpt');
        const previewCover = document.getElementById('preview-cover');
        const previewMedia = document.getElementById('preview-media');
        const previewTopic = document.getElementById('preview-topic');
        const previewRead = document.getElementById('preview-read');
        const previewDate = document.getElementById('preview-date');
        const wordCountEl = document.getElementById('word-count');
        const metaLine = document.getElementById('meta-line');
        const toast = document.getElementById('toast');
        const successBanner = document.getElementById('success-banner');

        let coverSrc = DEFAULT_COVER;
        let topicColor = '#5C7A6E';
        let topicLabel = 'Gut Health';

        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        previewDate.textContent = today + ' · 1 min read';

        function wordCount(text) {
            return (text.trim().match(/\S+/g) || []).length;
        }
        function readMins(words) {
            return Math.max(1, Math.round(words / 200) || 1);
        }

        function setCover(src) {
            coverSrc = src || DEFAULT_COVER;
            previewCover.src = coverSrc;
            coverPreviewImg.src = coverSrc;
            coverPreviewImg.hidden = false;
            coverDrop.classList.toggle('has-image', Boolean(src));
        }

        function refreshPreview() {
            const title = titleEl.value.trim() || 'A title worth reading';
            const excerpt = excerptEl.value.trim() || 'A short line that makes someone stop and read.';
            const words = wordCount(bodyEl.value);
            const mins = readMins(words);
            previewTitle.textContent = title;
            previewExcerpt.textContent = excerpt;
            previewTopic.textContent = topicLabel;
            previewMedia.style.background = topicColor;
            previewRead.textContent = mins + ' min read';
            previewDate.textContent = today + ' · ' + mins + ' min read';
            wordCountEl.textContent = words + ' word' + (words === 1 ? '' : 's');
            metaLine.textContent = words + ' words · ' + mins + ' min read';
        }

        chips.forEach((chip) => {
            chip.addEventListener('click', () => {
                chips.forEach((c) => c.classList.remove('active'));
                chip.classList.add('active');
                topicEl.value = chip.dataset.topic;
                topicColor = chip.dataset.color;
                topicLabel = chip.textContent.trim();
                refreshPreview();
            });
        });

        ['input', 'change'].forEach((evt) => {
            titleEl.addEventListener(evt, refreshPreview);
            excerptEl.addEventListener(evt, refreshPreview);
            bodyEl.addEventListener(evt, refreshPreview);
        });

        coverUrlEl.addEventListener('input', () => {
            if (coverUrlEl.value.trim()) setCover(coverUrlEl.value.trim());
            else if (!coverFileEl.files.length) setCover(DEFAULT_COVER);
        });

        coverFileEl.addEventListener('change', () => {
            const file = coverFileEl.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setCover(reader.result);
            reader.readAsDataURL(file);
        });

        ['dragenter', 'dragover'].forEach((evt) => {
            coverDrop.addEventListener(evt, (e) => {
                e.preventDefault();
                coverDrop.style.borderColor = '#000';
            });
        });
        coverDrop.addEventListener('dragleave', () => { coverDrop.style.borderColor = ''; });
        coverDrop.addEventListener('drop', (e) => {
            e.preventDefault();
            coverDrop.style.borderColor = '';
            const file = e.dataTransfer.files[0];
            if (!file || !file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = () => setCover(reader.result);
            reader.readAsDataURL(file);
        });

        function showToast(message) {
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2200);
        }

        function collectPost(status) {
            return {
                id: Date.now().toString(36),
                title: titleEl.value.trim(),
                excerpt: excerptEl.value.trim(),
                body: bodyEl.value.trim(),
                topic: topicEl.value,
                topicLabel,
                topicColor,
                cover: coverSrc,
                status,
                date: today,
                words: wordCount(bodyEl.value),
                read: readMins(wordCount(bodyEl.value)) + ' min read'
            };
        }

        document.getElementById('draft-btn').addEventListener('click', () => {
            const draft = collectPost('draft');
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
            showToast('Draft saved');
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!titleEl.value.trim() || !bodyEl.value.trim()) {
                showToast('Add a title and a story first');
                return;
            }
            const post = collectPost('published');
            const existing = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
            existing.unshift(post);
            localStorage.setItem(POSTS_KEY, JSON.stringify(existing));
            localStorage.removeItem(DRAFT_KEY);
            successBanner.classList.add('active');
            showToast('Published');
            successBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        try {
            const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
            if (saved) {
                titleEl.value = saved.title || '';
                excerptEl.value = saved.excerpt || '';
                bodyEl.value = saved.body || '';
                if (saved.cover) setCover(saved.cover);
                if (saved.topic) {
                    const match = [...chips].find((c) => c.dataset.topic === saved.topic);
                    if (match) match.click();
                }
            }
        } catch (err) { /* ignore bad draft */ }

        document.getElementById('menu-btn').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });

        refreshPreview();