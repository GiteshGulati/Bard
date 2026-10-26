import mongoose from 'mongoose';

const cloudAssetSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  publicId: { type: String, required: true, unique: true },
  providerAssetId: { type: String, default: null },
  secureUrl: { type: String, required: true, unique: true },
  kind: { type: String, enum: ['avatar', 'cover', 'inline'], required: true },
}, { timestamps: true });

cloudAssetSchema.index({ owner: 1, kind: 1, createdAt: -1 });
cloudAssetSchema.index({ providerAssetId: 1 }, {
  unique: true,
  partialFilterExpression: { providerAssetId: { $type: 'string' } },
});

export const CloudAsset = mongoose.model('CloudAsset', cloudAssetSchema);
