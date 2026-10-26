import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    blog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

likeSchema.index({ user: 1, blog: 1 }, { unique: true });
likeSchema.index({ blog: 1 });

export const Like = mongoose.model('Like', likeSchema);
