import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, minlength: 3, maxlength: 20 },
    emailNormalized: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    sessionVersion: { type: Number, default: 1 },
    displayName: { type: String, required: true, trim: true, maxlength: 60 },
    bio: { type: String, default: '', maxlength: 280 },
    avatarPath: { type: String, default: null },
    avatarAsset: { type: mongoose.Schema.Types.ObjectId, ref: 'CloudAsset', default: null },
    websiteUrl: { type: String, default: '', maxlength: 200 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true },
);

userSchema.index({ createdAt: -1 });

export const User = mongoose.model('User', userSchema);
