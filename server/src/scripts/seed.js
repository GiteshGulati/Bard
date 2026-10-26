import bcrypt from 'bcrypt';
import { connectDb, disconnectDb } from '../config/db.js';
import { User, Blog } from '../models/index.js';
import { renderArticle } from '../utils/delta.js';
import { slugify } from '../utils/slug.js';

await connectDb();

const demo = process.env.SEED_DEMO === 'true';
const adminUser = process.env.ADMIN_SEED_USERNAME?.trim().toLowerCase();
const adminEmail = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
const adminPass = process.env.ADMIN_SEED_PASSWORD;

if (adminUser && adminEmail && adminPass) {
  const existing = await User.findOne({ $or: [{ username: adminUser }, { emailNormalized: adminEmail }] });
  if (!existing) {
    await User.create({
      username: adminUser,
      emailNormalized: adminEmail,
      passwordHash: await bcrypt.hash(adminPass, 12),
      displayName: 'Editor',
      role: 'admin',
      bio: 'Bard moderator.',
    });
    console.log(`Created administrator @${adminUser}`);
  } else if (existing.role !== 'admin') {
    existing.role = 'admin';
    await existing.save();
    console.log(`Promoted @${existing.username} to administrator`);
  } else {
    console.log('Administrator already exists');
  }
} else {
  console.log('Skipping admin seed (set ADMIN_SEED_USERNAME, ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD).');
}

if (demo) {
  const samples = [
    {
      username: 'ada',
      email: 'ada@example.com',
      displayName: 'Ada Voss',
      bio: 'Writes about attention, cities, and the weather of the mind.',
      title: 'The quiet work of attention',
      tags: ['attention', 'essays'],
      ops: [
        { insert: 'Most of what we call taste is just the residue of attention.' },
        { insert: '\n', attributes: { header: 2 } },
        { insert: 'If you sit with a paragraph long enough, it starts to answer back. Bard is a place for that slower exchange — not a scoreboard.\n' },
      ],
    },
    {
      username: 'julian',
      email: 'julian@example.com',
      displayName: 'Julian Cho',
      bio: 'Letters from the workshop. Wood, paper, patience.',
      title: 'A desk by the window',
      tags: ['craft', 'rooms'],
      ops: [
        { insert: 'I keep the same lamp, the same cup, the same hour.' },
        { insert: '\n', attributes: { blockquote: true } },
        { insert: 'Routine is not the enemy of surprise. It is how surprise finds you at home.\n' },
      ],
    },
  ];

  for (const sample of samples) {
    let user = await User.findOne({ username: sample.username });
    if (!user) {
      user = await User.create({
        username: sample.username,
        emailNormalized: sample.email,
        passwordHash: await bcrypt.hash('DemoPass123', 12),
        displayName: sample.displayName,
        bio: sample.bio,
      });
    }
    const exists = await Blog.findOne({ author: user._id, title: sample.title });
    if (!exists) {
      const rendered = renderArticle({ ops: sample.ops });
      await Blog.create({
        author: user._id,
        title: sample.title,
        slug: slugify(sample.title),
        excerpt: rendered.plainText.slice(0, 180),
        contentDelta: rendered.delta,
        htmlSanitized: rendered.html,
        plainText: rendered.plainText,
        tags: sample.tags,
        status: 'published',
        visibility: 'public',
        publishedAt: new Date(),
      });
    }
  }
  console.log('Demo authors and articles are ready. Demo password: DemoPass123');
}

await disconnectDb();
process.exit(0);
