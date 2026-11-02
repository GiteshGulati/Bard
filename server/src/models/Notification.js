import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['follow', 'like', 'comment', 'reply'], required: true },
    blog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', default: null },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    dedupeKey: { type: String },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, _id: -1 });
notificationSchema.index({ recipient: 1, readAt: 1 });
notificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

export const Notification = mongoose.model('Notification', notificationSchema);
