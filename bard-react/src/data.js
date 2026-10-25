// ── Static post data from blogs.js ────────────────────────────────────────
export const POSTS = [
  {
    id: 'gut',
    title: 'The Gut-Brain Connection',
    author: 'Priya Nair',
    avatar: 'https://i.pravatar.cc/64?img=5',
    avatarSm: 'https://i.pravatar.cc/32?img=5',
    date: 'Jun 10, 2022',
    read: '4 min read',
    views: '3,847 views',
    img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&auto=format&fit=crop',
    color: '#5C7A6E',
    tags: 'gut health nutrition',
    tagLabel: 'Gut Health',
    excerpt: 'Your gut is your second brain. Discover how a diverse, fibre-rich diet can reduce anxiety, sharpen focus, and transform your overall wellbeing from the inside out.',
    overlay: ['Feed your gut,', 'Feed your mind.'],
    body: `<p>Your gut is your second brain — and the science behind this statement is more compelling than most people realise. The gut-brain axis is a two-way communication highway between your enteric nervous system and your central nervous system.</p>
<h2>Why Your Gut Matters</h2>
<p>Roughly 95% of your body's serotonin is produced in the gut. This means that what you eat doesn't just affect how you feel physically — it directly shapes your mood, focus, and mental resilience.</p>
<blockquote>"A diverse microbiome is one of the best indicators of overall health." — Dr. Emeran Mayer</blockquote>
<p>Research shows that people with diets rich in fermented foods, fibre, and diverse plant matter report significantly lower rates of anxiety and depression compared to those eating processed, low-fibre diets.</p>
<h2>What to Eat</h2>
<p>Focus on variety: aim for 30 different plants a week. Include fermented staples like yoghurt, kefir, kimchi, and sauerkraut. Add prebiotic foods like garlic, onions, and oats — these feed the beneficial bacteria already living in your gut.</p>
<p>Reduce ultra-processed foods, artificial sweeteners, and excessive alcohol. These are consistently linked to reduced microbiome diversity and increased gut permeability — sometimes called "leaky gut."</p>
<h2>The Takeaway</h2>
<p>Small, consistent dietary shifts compound over time. Start by adding one fermented food and five new plant varieties per week. Your gut — and your mind — will thank you for it.</p>`,
    stats: { views: '3,847 views', comments: 3 },
    likes: 41,
    comments: [
      { name: 'Rohan Mehta', avatar: 'https://i.pravatar.cc/40?img=11', date: 'Jun 12, 2022', text: 'This completely changed how I approach my morning meals. Started adding kimchi to everything!', likes: 14 },
      { name: 'Anika Sharma', avatar: 'https://i.pravatar.cc/40?img=21', date: 'Jun 14, 2022', text: 'The 30 plants a week challenge sounds daunting but once I started counting, I was already at 18. Great motivator.', likes: 9 },
      { name: 'Dev Kapoor', avatar: 'https://i.pravatar.cc/40?img=33', date: 'Jun 18, 2022', text: 'Would love a follow-up on the gut-sleep connection specifically. Amazing article regardless.', likes: 6 },
    ],
  },
  {
    id: 'meal',
    title: 'Meal Prep Like a Pro',
    author: 'Arjun Mehta',
    avatar: 'https://i.pravatar.cc/64?img=12',
    avatarSm: 'https://i.pravatar.cc/32?img=12',
    date: 'Aug 3, 2022',
    read: '5 min read',
    views: '2,190 views',
    img: 'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=900&auto=format&fit=crop',
    color: '#A07850',
    tags: 'food cooking organic meal prep',
    tagLabel: 'Meal Prep',
    excerpt: 'Stop wasting time on last-minute cooking. Master the art of batch prep with organic, wholesome ingredients.',
    overlay: [],
    body: `<p>Sunday meal prep sounds like a chore — until you experience the calm of opening your fridge on a Wednesday evening and finding everything you need, ready and waiting. That calm is worth building a routine around.</p>
<h2>The 90-Minute Rule</h2>
<p>You don't need an entire day. A well-planned 90-minute session can produce five balanced, delicious meals. The key is batch cooking proteins and grains, then mixing components throughout the week for variety.</p>
<blockquote>"Failing to prepare is preparing to fail — especially when hunger strikes at 8pm."</blockquote>
<p>Choose one grain (brown rice, quinoa, farro), one protein (roast chicken, baked tofu, lentils), and three to four vegetables. Roast the vegetables together, cook the grain, and store separately. The combinations are endless.</p>
<h2>Container Strategy</h2>
<p>Invest in glass containers of two sizes: 500ml for lunches and 900ml for dinners. Label everything with the date. Use a lazy Susan in your fridge so nothing gets buried and forgotten.</p>
<h2>The Takeaway</h2>
<p>Start small. Prep just lunch for the week on your first attempt. Once that becomes second nature, add dinners. Within a month, you'll have reclaimed hours of your week and be eating better than ever.</p>`,
    stats: { views: '2,190 views', comments: 2 },
    likes: 19,
    comments: [
      { name: 'Sunita Rao', avatar: 'https://i.pravatar.cc/40?img=44', date: 'Aug 5, 2022', text: 'The 90-minute rule is a game changer. I always thought meal prep required half a Sunday.', likes: 22 },
      { name: 'Vikram Nair', avatar: 'https://i.pravatar.cc/40?img=55', date: 'Aug 9, 2022', text: 'Glass containers recommendation is spot on. Switched from plastic last month and everything tastes fresher.', likes: 11 },
    ],
  },
  {
    id: 'sleep',
    title: 'Sleep: The Ultimate Recovery Tool',
    author: 'Leena Shah',
    avatar: 'https://i.pravatar.cc/64?img=22',
    avatarSm: 'https://i.pravatar.cc/32?img=22',
    date: 'Jan 15, 2023',
    read: '3 min read',
    views: '5,502 views',
    img: 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=900&auto=format&fit=crop',
    color: '#3D5A80',
    tags: 'sleep recovery wellness lifestyle',
    tagLabel: 'Sleep & Recovery',
    excerpt: 'Quality sleep is the most powerful recovery tool you have. Learn how nutrition and routine can help you rest deeper.',
    overlay: [],
    body: `<p>We live in a culture that glorifies busyness and treats sleep as an optional luxury. The science says otherwise — sleep is the single most powerful performance-enhancing tool available to every human being, completely free of charge.</p>
<h2>What Happens When You Sleep</h2>
<p>During deep sleep, your brain clears metabolic waste products through the glymphatic system — think of it as a nightly pressure wash for your neurons. Memory consolidation, hormone regulation, tissue repair, and immune calibration all happen primarily during sleep.</p>
<blockquote>"Sleep is the Swiss Army knife of health." — Matthew Walker, Why We Sleep</blockquote>
<p>Chronic sleep deprivation — even just six hours a night over two weeks — impairs cognitive function to the same degree as 24 hours of total sleep deprivation. Most people simply can't tell how impaired they are.</p>
<h2>Foods That Help You Sleep</h2>
<p>Tart cherries, kiwi, and fatty fish are rich in natural melatonin or the nutrients that support its production. Magnesium — found in pumpkin seeds, spinach, and dark chocolate — activates the parasympathetic nervous system, helping you wind down.</p>
<h2>The Non-Negotiables</h2>
<p>Keep a consistent wake time seven days a week. Even on weekends. This one habit, more than any supplement or sleep hack, does the most to regulate your circadian rhythm and improve your sleep quality over time.</p>`,
    stats: { views: '5,502 views', comments: 4 },
    likes: 67,
    comments: [
      { name: 'Karan Singh', avatar: 'https://i.pravatar.cc/40?img=7', date: 'Jan 17, 2023', text: 'The consistent wake time tip changed my life. Three weeks in and I fall asleep in under 10 minutes every night now.', likes: 38 },
      { name: 'Meera Pillai', avatar: 'https://i.pravatar.cc/40?img=19', date: 'Jan 20, 2023', text: 'Finally someone explaining the glymphatic system simply. Share this with everyone you know who brags about sleeping 5 hours.', likes: 27 },
      { name: 'Aditya Rao', avatar: 'https://i.pravatar.cc/40?img=66', date: 'Jan 25, 2023', text: "Matthew Walker's book is incredible. This article is a great summary for people who haven't read it yet.", likes: 15 },
      { name: 'Tanya Gupta', avatar: 'https://i.pravatar.cc/40?img=48', date: 'Feb 2, 2023', text: 'Started eating two kiwis before bed after reading this. Absolutely notice a difference in how quickly I feel sleepy.', likes: 19 },
    ],
  },
  {
    id: 'fashion',
    title: 'Why Slow Fashion Wins',
    author: 'Riya Desai',
    avatar: 'https://i.pravatar.cc/64?img=33',
    avatarSm: 'https://i.pravatar.cc/32?img=33',
    date: 'Apr 2, 2023',
    read: '6 min read',
    views: '1,874 views',
    img: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop',
    color: '#7B5E7B',
    tags: 'fashion sustainability slow living',
    tagLabel: 'Slow Fashion',
    excerpt: 'Fast fashion harms the planet — and your skin. We make the case for natural-fibre wearables that last a lifetime.',
    overlay: [],
    body: `<p>The fashion industry produces 92 million tonnes of textile waste every year. Behind that number are overflowing landfills, polluted rivers, and garment workers paid wages that can't sustain a dignified life. Slow fashion isn't just an aesthetic — it's a response to this crisis.</p>
<h2>What Slow Fashion Actually Means</h2>
<p>Slow fashion means buying less, buying better, and wearing things for longer. It means understanding where your clothes come from, who made them, and what they're made of. It means treating a well-made garment the way previous generations did — as something valuable and long-lasting.</p>
<blockquote>"The most sustainable garment is the one already in your wardrobe."</blockquote>
<p>Natural fibres — organic cotton, linen, wool, and hemp — biodegrade at the end of their life and breathe better against your skin. Synthetic fabrics like polyester shed microplastics with every wash, entering waterways and eventually food chains.</p>
<h2>A Simple Framework</h2>
<p>Before any purchase, ask yourself three questions: Will I wear this at least 30 times? Could I find this second-hand? Is the brand transparent about its supply chain? If the answer to all three is uncertain, wait a week. You'll often find the impulse fades.</p>
<h2>Starting Points</h2>
<p>Begin by auditing your wardrobe. Pull out everything you haven't worn in a year and donate or sell it. Identify the gaps — real gaps, not wishful thinking gaps. Then fill them intentionally, with pieces built to last.</p>`,
    stats: { views: '1,874 views', comments: 2 },
    likes: 35,
    comments: [
      { name: 'Ishaan Verma', avatar: 'https://i.pravatar.cc/40?img=52', date: 'Apr 4, 2023', text: "The 30-wears question is something I now ask myself every single time. It's stopped at least four impulse purchases this month alone.", likes: 17 },
      { name: 'Priya Menon', avatar: 'https://i.pravatar.cc/40?img=29', date: 'Apr 7, 2023', text: 'Audited my wardrobe after reading this. Donated 40 items. Feel lighter already.', likes: 31 },
    ],
  },
];

// ── Writers data from following.js ─────────────────────────────────────────
export const WRITERS = [
  {
    id: 'priya', name: 'Priya Nair', avatar: 'https://i.pravatar.cc/160?img=5',
    bio: 'Writing about gut health, nutrition, and the quiet power of eating well.',
    topics: ['Gut Health', 'Nutrition', 'Wellness'], color: '#5C7A6E',
    posts: [
      { title: 'The Gut-Brain Connection', excerpt: 'Your gut is your second brain. Discover how a diverse, fibre-rich diet can transform your wellbeing from the inside out.', topicLabel: 'Gut Health', cover: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop', date: 'Jun 10, 2022', read: '4 min read' },
      { title: 'Fermented Foods 101', excerpt: 'A beginner-friendly guide to incorporating kimchi, kefir, and sauerkraut into your daily meals.', topicLabel: 'Nutrition', cover: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&auto=format&fit=crop', date: 'Aug 22, 2022', read: '6 min read' },
    ],
  },
  {
    id: 'arjun', name: 'Arjun Mehta', avatar: 'https://i.pravatar.cc/160?img=12',
    bio: 'Batch cooking, seasonal ingredients, and making peace with your kitchen.',
    topics: ['Meal Prep', 'Cooking', 'Organic'], color: '#A07850',
    posts: [
      { title: 'Meal Prep Like a Pro', excerpt: 'Stop wasting Sunday evenings on last-minute cooking. A step-by-step guide to batch-cooking wholesome, organic meals.', topicLabel: 'Meal Prep', cover: 'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=800&auto=format&fit=crop', date: 'Aug 3, 2022', read: '5 min read' },
      { title: 'One Pot, Thirty Meals', excerpt: 'How a single Dutch oven became the most-used tool in my kitchen — and saved me hours every week.', topicLabel: 'Cooking', cover: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop', date: 'Oct 15, 2022', read: '4 min read' },
    ],
  },
  {
    id: 'leena', name: 'Leena Shah', avatar: 'https://i.pravatar.cc/160?img=22',
    bio: 'Sleep science, evening routines, and the art of doing less with more intention.',
    topics: ['Sleep', 'Recovery', 'Mindfulness'], color: '#3D5A80',
    posts: [
      { title: 'Sleep: The Ultimate Recovery Tool', excerpt: 'Quality sleep is the most powerful recovery tool you have.', topicLabel: 'Sleep', cover: 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=800&auto=format&fit=crop', date: 'Jan 15, 2023', read: '3 min read' },
      { title: 'Wind Down, Not Out', excerpt: 'A two-hour evening routine that changed everything — from blue light to breathwork to bedtime tea.', topicLabel: 'Recovery', cover: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&auto=format&fit=crop', date: 'Mar 8, 2023', read: '5 min read' },
    ],
  },
  {
    id: 'riya', name: 'Riya Desai', avatar: 'https://i.pravatar.cc/160?img=33',
    bio: 'Slow fashion, natural fibres, and building a wardrobe that lasts a lifetime.',
    topics: ['Fashion', 'Sustainability', 'Lifestyle'], color: '#7B5E7B',
    posts: [
      { title: 'Why Slow Fashion Wins', excerpt: 'Fast fashion harms the planet — and your skin. The case for natural-fibre wearables.', topicLabel: 'Fashion', cover: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop', date: 'Apr 2, 2023', read: '6 min read' },
      { title: 'Ten Pieces, Thirty Outfits', excerpt: 'How a curated capsule wardrobe simplified my mornings and reduced my environmental footprint.', topicLabel: 'Sustainability', cover: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop', date: 'Jul 19, 2023', read: '4 min read' },
    ],
  },
  {
    id: 'anika', name: 'Anika Rao', avatar: 'https://i.pravatar.cc/160?img=44',
    bio: 'Morning rituals, digital detox, and finding stillness in a noisy world.',
    topics: ['Mindfulness', 'Mental Health', 'Focus'], color: '#4A5D4E',
    posts: [
      { title: 'Mornings Without a Phone', excerpt: 'The first hour of the day sets the tone for everything that follows. Here is the quiet ritual that stuck.', topicLabel: 'Mindfulness', cover: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop', date: 'Mar 12, 2026', read: '4 min read' },
      { title: 'The 30-Day Digital Detox', excerpt: 'What happened when I deleted social media for a month — and what I brought back, and what I did not.', topicLabel: 'Mental Health', cover: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop', date: 'May 5, 2026', read: '7 min read' },
    ],
  },
  {
    id: 'rohan', name: 'Rohan Kapoor', avatar: 'https://i.pravatar.cc/160?img=51',
    bio: 'Journaling, breathwork, and the quiet practice of paying attention.',
    topics: ['Mindfulness', 'Journaling', 'Wellness'], color: '#82915F',
    posts: [
      { title: 'Write Before You Wake', excerpt: 'Three pages of longhand, stream-of-consciousness writing every morning. The practice that rewired my brain.', topicLabel: 'Journaling', cover: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&auto=format&fit=crop', date: 'Feb 20, 2026', read: '3 min read' },
      { title: 'Breathwork for Beginners', excerpt: 'You do not need a retreat or an app. Just five minutes, a quiet room, and this simple four-step technique.', topicLabel: 'Wellness', cover: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&auto=format&fit=crop', date: 'Apr 14, 2026', read: '4 min read' },
    ],
  },
];

// ── Topic definitions for home page ───────────────────────────────────────
export const TOPICS = [
  { id: 'gut',         num: '01', label: 'Gut Health',     sub: '4 posts · Nutrition',    color: '#5C7A6E', img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&auto=format&fit=crop', desc: 'Your gut is your second brain. Discover how a diverse, fibre-rich diet can transform your wellbeing from the inside out.', tags: ['Nutrition','Microbiome','Wellness'], reverse: false },
  { id: 'sleep',       num: '02', label: 'Sleep & Recovery', sub: '3 posts · Lifestyle',  color: '#3D5A80', img: 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=900&auto=format&fit=crop', desc: 'Quality sleep is the most powerful recovery tool you have. Learn how nutrition and routine can help you rest deeper.', tags: ['Sleep','Recovery','Cortisol'], reverse: true },
  { id: 'meal',        num: '03', label: 'Meal Prep',       sub: '5 posts · Cooking',     color: '#A07850', img: 'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=900&auto=format&fit=crop', desc: 'Stop wasting time on last-minute cooking. Master the art of batch prep with organic, wholesome ingredients.', tags: ['Cooking','Organic','Batch Prep'], reverse: false },
  { id: 'fashion',     num: '04', label: 'Slow Fashion',    sub: '6 posts · Sustainability', color: '#7B5E7B', img: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop', desc: 'Fast fashion harms the planet — and your skin. We make the case for natural-fibre wearables that last a lifetime.', tags: ['Fashion','Sustainable','Natural Fibres'], reverse: true },
  { id: 'mindfulness', num: '05', label: 'Mindfulness',     sub: '7 posts · Mental Health', color: '#82915F', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&auto=format&fit=crop', desc: 'From morning rituals to breathwork — small daily practices that create profound shifts in focus, calm, and clarity.', tags: ['Mindfulness','Mental Health','Focus'], reverse: false },
];

// ── Sample profile stories ─────────────────────────────────────────────────
export const SAMPLE_STORIES = [
  { title: 'Mornings Without a Phone', excerpt: 'The first hour of the day sets the tone for everything that follows. Here is the quiet ritual that stuck.', topicLabel: 'Mindfulness', topicColor: '#4A5D4E', cover: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop', date: 'Mar 12, 2026', read: '4 min read' },
  { title: 'What I Eat When I Am Tired', excerpt: 'Hunger plus exhaustion is a dangerous combination. A short list of meals that ask almost nothing of you.', topicLabel: 'Meal Prep', topicColor: '#A07850', cover: 'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=800&auto=format&fit=crop', date: 'Jan 28, 2026', read: '5 min read' },
  { title: 'Sleep Is a Practice', excerpt: 'Not a hack. Not a luxury. Notes from a year of going to bed at the same time, even on weekends.', topicLabel: 'Sleep', topicColor: '#3D5A80', cover: 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=800&auto=format&fit=crop', date: 'Nov 4, 2025', read: '3 min read' },
];

// ── Topic chip options for post writer ────────────────────────────────────
export const TOPIC_CHIPS = [
  { id: 'gut',         label: 'Gut Health',     color: '#5C7A6E' },
  { id: 'meal',        label: 'Meal Prep',       color: '#A07850' },
  { id: 'sleep',       label: 'Sleep',           color: '#3D5A80' },
  { id: 'fashion',     label: 'Slow Fashion',    color: '#7B5E7B' },
  { id: 'mindfulness', label: 'Mindfulness',     color: '#4A5D4E' },
  { id: 'wellness',    label: 'Wellness',        color: '#82915F' },
];
