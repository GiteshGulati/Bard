import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    blog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    body: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ['visible', 'hidden', 'deleted'], default: 'visible' },
    notificationPendingAt: { type: Date, default: null },
    notificationDeliveredAt: { type: Date, default: null },
    notificationAttemptedAt: { type: Date, default: null },
    notificationAttempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);

commentSchema.index({ blog: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ notificationPendingAt: 1, notificationDeliveredAt: 1, notificationAttemptedAt: 1 });

export const Comment = mongoose.model('Comment', commentSchema);
