import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, default: '', maxlength: 400 },
    contentDelta: { type: mongoose.Schema.Types.Mixed, required: true },
    htmlSanitized: { type: String, default: '' },
    plainText: { type: String, default: '' },
    coverImagePath: { type: String, default: null },
    coverAsset: { type: mongoose.Schema.Types.ObjectId, ref: 'CloudAsset', default: null },
    inlineAssets: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CloudAsset' }], default: [] },
    tags: { type: [{ type: String, lowercase: true, trim: true, maxlength: 32 }], default: [], validate: [(v) => v.length <= 8, 'Too many tags'] },
    status: { type: String, enum: ['draft', 'published', 'hidden'], default: 'draft', index: true },
    visibility: { type: String, enum: ['public', 'unlisted'], default: 'public' },
    commentsEnabled: { type: Boolean, default: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

blogSchema.index({ title: 'text', excerpt: 'text', plainText: 'text' });
blogSchema.index({ status: 1, visibility: 1, publishedAt: -1, _id: -1 });
blogSchema.index({ author: 1, status: 1, publishedAt: -1 });
blogSchema.index({ tags: 1, status: 1, publishedAt: -1 });
blogSchema.index({ author: 1, updatedAt: -1 });

export const Blog = mongoose.model('Blog', blogSchema);
