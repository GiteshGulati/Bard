import Quill from 'quill';
import { Blogs, Uploads } from '../api.js';
import { debounce, escapeHtml, toast } from '../utils.js';
import { navigate } from '../router.js';

export async function writePage({ id } = {}) {
  let blog = null;
  if (id) ({ blog } = await Blogs.byId(id));
  const root = document.createElement('section');
  root.className = 'wrap writer-wrap';
  root.innerHTML = `
    <div class="toolbar"><div><p class="kicker">Writing desk</p><h1>${id ? 'Return to your draft' : 'Begin an essay'}</h1></div><span id="save-state" class="save-state" role="status">${id ? 'Loading draft…' : 'Not saved yet'}</span></div>
    <form id="editor-form" class="writer-form">
      <label for="title">Title</label><input class="field title-field" id="title" maxlength="160" required placeholder="A title worth keeping" value="${escapeHtml(blog?.title || '')}">
      <label for="excerpt">Short introduction</label><textarea class="field" id="excerpt" maxlength="400" rows="2" placeholder="A few lines to invite the reader">${escapeHtml(blog?.excerpt || '')}</textarea>
      <label for="tags">Tags <span class="meta">(comma separated, up to 8)</span></label><input class="field" id="tags" maxlength="260" placeholder="essays, craft, travel" value="${escapeHtml(blog?.tags?.join(', ') || '')}">
      <label for="cover">Cover image</label><input class="field" id="cover" type="file" accept="image/png,image/jpeg,image/webp,image/gif">
      ${blog?.coverImageUrl ? `<img class="writer-cover" src="${escapeHtml(blog.coverImageUrl)}" alt="Current cover image" width="720" height="360">` : ''}
      <label>Article</label><div id="quill-editor" class="editor-surface" aria-label="Article text editor"></div>
      <div class="row writer-actions"><button class="btn-ghost" id="preview" type="button">Preview</button><button class="btn-ghost" id="save-draft" type="button">Save draft</button><button class="btn" id="publish" type="button">${blog?.status === 'published' ? 'Update published essay' : 'Publish'}</button></div>
      <div id="preview-pane" class="article-body preview-pane" hidden></div>
    </form>`;
  const quill = new Quill(root.querySelector('#quill-editor'), {
    theme: 'snow',
    placeholder: 'Start with a sentence…',
    modules: { toolbar: {
      container: [
      [{ header: [2, 3, false] }], ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }], ['blockquote', 'code-block'],
      ['link', 'image'], ['clean'],
      ],
      handlers: {
        image() {
          const picker = document.createElement('input');
          picker.type = 'file'; picker.accept = 'image/png,image/jpeg,image/webp,image/gif';
          picker.onchange = async () => {
            const file = picker.files?.[0]; if (!file) return;
            const selection = quill.getSelection(true);
            state.textContent = 'Uploading image…';
            try {
              const { url } = await Uploads.inline(file);
              quill.insertEmbed(selection.index, 'image', url, 'user');
              quill.setSelection(selection.index + 1);
              dirty = true; state.textContent = 'Unsaved changes'; autosave();
            } catch (err) { state.textContent = 'Image upload failed'; toast(err.message); }
          };
          picker.click();
        },
      },
    } },
  });
  quill.setContents(blog?.content || { ops: [{ insert: '\n' }] });
  let dirty = false;
  let saving = false;
  let editVersion = 0;
  let queuedStatus = null;
  const state = root.querySelector('#save-state');
  const values = () => ({
    title: root.querySelector('#title').value.trim() || 'Untitled',
    excerpt: root.querySelector('#excerpt').value,
    content: quill.getContents(),
    tags: root.querySelector('#tags').value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 8),
  });
  async function save(status) {
    if (saving) { queuedStatus = status; return; }
    saving = true; state.textContent = 'Saving…';
    const savedVersion = editVersion;
    const payload = { ...values(), status, expectedUpdatedAt: blog?.updatedAt };
    try {
      const file = root.querySelector('#cover').files[0];
      let response;
      if (blog) {
        if (file) {
          const form = new FormData();
          Object.entries(payload).forEach(([k, v]) => form.append(k, typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)));
          form.append('cover', file);
          response = await Blogs.updateForm(blog.id, form);
        } else response = await Blogs.update(blog.id, payload);
      } else {
        if (file) {
          const form = new FormData();
          Object.entries({ ...payload, status: 'draft' }).forEach(([k, v]) => form.append(k, typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)));
          form.append('cover', file);
          response = await Blogs.createForm(form);
        } else response = await Blogs.create({ ...payload, status: 'draft' });
        blog = response.blog;
        history.replaceState({}, '', `/write/${blog.id}`);
        if (status === 'published') response = await Blogs.update(blog.id, { ...payload, status: 'published', expectedUpdatedAt: blog.updatedAt });
      }
      blog = response.blog || blog;
      dirty = editVersion !== savedVersion;
      state.textContent = dirty ? 'Newer edits need saving' : status === 'published' ? 'Published' : 'Saved';
      root.querySelector('#publish').textContent = 'Update published essay';
      if (status === 'published') { toast('Essay published'); navigate(`/article/${blog.slug}`); }
    } catch (err) {
      state.textContent = 'Save failed'; toast(err.message);
    } finally {
      saving = false;
      if (dirty && queuedStatus === null) queuedStatus = 'draft';
      if (queuedStatus !== null) {
        const nextStatus = queuedStatus;
        queuedStatus = null;
        save(nextStatus);
      }
    }
  }
  const autosave = debounce(() => { if (dirty) save('draft'); }, 1100);
  const changed = () => { editVersion += 1; dirty = true; state.textContent = 'Unsaved changes'; autosave(); };
  quill.on('text-change', changed);
  root.querySelectorAll('#title,#excerpt,#tags').forEach((el) => el.addEventListener('input', changed));
  root.querySelector('#cover').addEventListener('change', changed);
  root.querySelector('#save-draft').addEventListener('click', () => { autosave.flush(); save('draft'); });
  root.querySelector('#publish').addEventListener('click', () => { autosave.flush(); save('published'); });
  root.querySelector('#preview').addEventListener('click', () => {
    const pane = root.querySelector('#preview-pane');
    pane.hidden = !pane.hidden;
    if (!pane.hidden) pane.innerHTML = `<h2>${escapeHtml(root.querySelector('#title').value || 'Untitled')}</h2>${quill.root.innerHTML}`;
  });
  const onBeforeUnload = (e) => { if (dirty || saving) { e.preventDefault(); e.returnValue = ''; } };
  const onBeforeNavigate = (e) => {
    if ((dirty || saving) && !confirm('You have unsaved changes. Leave this writing desk?')) e.preventDefault();
  };
  const cleanup = () => {
    window.removeEventListener('beforeunload', onBeforeUnload);
    window.removeEventListener('bard:before-navigate', onBeforeNavigate);
    window.removeEventListener('bard:navigate', cleanup);
  };
  window.addEventListener('beforeunload', onBeforeUnload);
  window.addEventListener('bard:before-navigate', onBeforeNavigate);
  window.addEventListener('bard:navigate', cleanup, { once: true });
  return root;
}
