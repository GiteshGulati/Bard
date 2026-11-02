import mongoose from 'mongoose';

const followSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    followed: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notificationPendingAt: { type: Date, default: null },
    notificationDeliveredAt: { type: Date, default: null },
    notificationAttemptedAt: { type: Date, default: null },
    notificationAttempts: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

followSchema.index({ follower: 1, followed: 1 }, { unique: true });
followSchema.index({ followed: 1, createdAt: -1, _id: -1 });
followSchema.index({ follower: 1, createdAt: -1, _id: -1 });
followSchema.index({ notificationPendingAt: 1, notificationDeliveredAt: 1, notificationAttemptedAt: 1 });

export const Follow = mongoose.model('Follow', followSchema);
