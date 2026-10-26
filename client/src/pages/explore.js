import { Blogs, Social } from '../api.js';
import { blogCard } from '../components/cards.js';
import { emptyState, errorBox, escapeHtml, qs, spinner } from '../utils.js';

function paint(target, data, append) {
  if (!data.items?.length && !append) {
    target.innerHTML = emptyState('Nothing in this aisle', 'Try another tag or come back after someone publishes.');
    return;
  }
  const grid = append ? target.querySelector('.grid') : null;
  const html = data.items.map(blogCard).join('');
  if (grid) grid.insertAdjacentHTML('beforeend', html);
  else target.innerHTML = `<div class="grid">${html}</div>`;
}

export async function explorePage() {
  const root = document.createElement('div');
  let cursor = null;
  root.innerHTML = `
    <div class="wrap">
      <p class="kicker">Explore</p>
      <h1>The public table</h1>
      <p class="lede">Newest published writing, one stack at a time.</p>
      <div id="list">${spinner()}</div>
      <button class="btn-ghost more" type="button" hidden>Load more</button>
    </div>
  `;
  const list = root.querySelector('#list');
  const more = root.querySelector('.more');
  async function load(reset = false) {
    try {
      const data = await Blogs.list(qs({ limit: 12, cursor: reset ? '' : cursor }));
      paint(list, data, !reset && cursor);
      cursor = data.nextCursor;
      more.hidden = !cursor;
    } catch (err) {
      list.innerHTML = errorBox(err);
    }
  }
  more.addEventListener('click', () => load(false));
  await load(true);
  return root;
}

export async function searchPage({ q }) {
  const root = document.createElement('div');
  const query = q || new URLSearchParams(location.search).get('q') || '';
  root.innerHTML = `
    <div class="wrap">
      <p class="kicker">Search</p>
      <h1>${query ? `Results for “${escapeHtml(query)}”` : 'Look through the shelves'}</h1>
      <form class="row" id="sform">
        <input class="field" name="q" value="${escapeHtml(query)}" placeholder="Title or text">
        <button class="btn" type="submit">Search</button>
      </form>
      <div id="list">${spinner()}</div>
      <button class="btn-ghost more" type="button" hidden>Load more</button>
    </div>
  `;
  const list = root.querySelector('#list');
  const more = root.querySelector('.more');
  let cursor = null;
  let current = query;
  async function load(reset) {
    if (!current.trim()) {
      list.innerHTML = emptyState('Enter a search', 'We look through titles and article text. Drafts stay private.');
      more.hidden = true;
      return;
    }
    try {
      const data = await Social.search(qs({ q: current, limit: 12, cursor: reset ? '' : cursor }));
      if (!data.items?.length && reset) list.innerHTML = emptyState('No matching essays', 'Try a simpler phrase or a tag name.');
      else {
        const html = data.items.map(blogCard).join('');
        if (!reset && list.querySelector('.grid')) list.querySelector('.grid').insertAdjacentHTML('beforeend', html);
        else list.innerHTML = `<div class="grid">${html}</div>`;
      }
      cursor = data.nextCursor;
      more.hidden = !cursor;
    } catch (err) {
      list.innerHTML = errorBox(err);
    }
  }
  root.querySelector('#sform').addEventListener('submit', (e) => {
    e.preventDefault();
    current = new FormData(e.currentTarget).get('q');
      history.replaceState({}, '', `/search?q=${encodeURIComponent(current)}`);
      root.querySelector('h1').textContent = current ? `Results for “${current}”` : 'Look through the shelves';
    cursor = null;
    load(true);
  });
  more.addEventListener('click', () => load(false));
  await load(true);
  return root;
}

export async function tagPage({ tag }) {
  const root = document.createElement('div');
  root.innerHTML = `
    <div class="wrap">
      <p class="kicker">Tag</p>
      <h1>#${tag}</h1>
      <div id="list">${spinner()}</div>
      <button class="btn-ghost more" hidden type="button">Load more</button>
    </div>
  `;
  let cursor = null;
  const list = root.querySelector('#list');
  const more = root.querySelector('.more');
  async function load(reset) {
    try {
      const data = await Social.tag(tag, qs({ limit: 12, cursor: reset ? '' : cursor }));
      if (!data.items?.length && reset) {
        list.innerHTML = emptyState('No essays with this tag', 'Tags appear once a published article uses them.');
      } else {
        const html = data.items.map(blogCard).join('');
        if (!reset && list.querySelector('.grid')) list.querySelector('.grid').insertAdjacentHTML('beforeend', html);
        else list.innerHTML = `<div class="grid">${html}</div>`;
      }
      cursor = data.nextCursor;
      more.hidden = !cursor;
    } catch (err) {
      list.innerHTML = errorBox(err);
    }
  }
  more.addEventListener('click', () => load(false));
  await load(true);
  return root;
}
