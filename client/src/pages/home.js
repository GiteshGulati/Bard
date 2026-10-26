import { Blogs } from '../api.js';
import { blogCard } from '../components/cards.js';
import { emptyState, errorBox, spinner } from '../utils.js';

export async function homePage() {
  const root = document.createElement('div');
  root.innerHTML = `
    <div class="wrap">
      <section class="hero">
        <div>
          <p class="kicker">Independent publishing</p>
          <h1 class="display">Write for the page, not the feed.</h1>
          <p class="lede">Bard is a quiet home for essays, letters, and long stories. Publish in your own name or a chosen one. Follow writers. Keep a private shelf.</p>
          <div class="row" style="margin-top:1.4rem">
            <a class="btn" href="/explore" data-link>Read the latest</a>
            <a class="btn-ghost" href="/register" data-link>Start writing</a>
          </div>
        </div>
        <div class="hero-panel" aria-hidden="true"></div>
      </section>
      <h2>Recently set in type</h2>
      <div id="latest">${spinner()}</div>
    </div>
  `;
  try {
    const data = await Blogs.list('?limit=6');
    const node = root.querySelector('#latest');
    node.innerHTML = data.items?.length
      ? `<div class="grid">${data.items.map(blogCard).join('')}</div>`
      : emptyState('The press is quiet', 'Published essays will appear here. Be the first to set one.');
  } catch (err) {
    root.querySelector('#latest').innerHTML = errorBox(err);
  }
  return root;
}
