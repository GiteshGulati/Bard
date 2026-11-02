import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    blog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
    notificationPendingAt: { type: Date, default: null },
    notificationDeliveredAt: { type: Date, default: null },
    notificationAttemptedAt: { type: Date, default: null },
    notificationAttempts: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

likeSchema.index({ user: 1, blog: 1 }, { unique: true });
likeSchema.index({ blog: 1 });
likeSchema.index({ notificationPendingAt: 1, notificationDeliveredAt: 1, notificationAttemptedAt: 1 });

export const Like = mongoose.model('Like', likeSchema);
