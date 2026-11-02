import mongoose from 'mongoose';

const blogDeletionSchema = new mongoose.Schema({
  blog: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, required: true },
  assetIds: { type: [{ type: mongoose.Schema.Types.ObjectId }], default: [] },
  status: { type: String, enum: ['pending', 'complete'], default: 'pending', index: true },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, default: Date.now, index: true },
  lastErrorCode: { type: String, default: null },
}, { timestamps: true });

blogDeletionSchema.index({ status: 1, nextAttemptAt: 1 });

export const BlogDeletion = mongoose.model('BlogDeletion', blogDeletionSchema);
