import path from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import { env } from '../config/env.js';
import { badGateway, badRequest, tooLarge } from '../utils/errors.js';
import { cloudinaryEnabled, deleteCloudinaryImage, uploadCloudinaryImage } from '../config/cloudinary.js';
import { CloudAsset, Blog, User } from '../models/index.js';

const ALLOWED = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

const LIMITS = {
  avatar: 2 * 1024 * 1024,
  cover: 5 * 1024 * 1024,
  inline: 5 * 1024 * 1024,
};

export function uploadRoot() {
  return path.resolve(process.cwd(), env.UPLOAD_DIR);
}

export async function persistImage(file, kind, ownerId) {
  if (!file?.buffer) throw badRequest('No file uploaded');
  const max = LIMITS[kind] || LIMITS.cover;
  if (file.size > max) throw tooLarge(`File must be smaller than ${Math.round(max / 1024 / 1024)}MB`);
  const detected = await fileTypeFromBuffer(file.buffer);
  if (!detected || !ALLOWED.has(detected.mime)) {
    throw badRequest('Only JPEG, PNG, WebP, and GIF images are allowed');
  }
  if (!cloudinaryEnabled()) throw badGateway('Cloudinary image storage is unavailable');
  let uploaded;
  try {
    uploaded = await uploadCloudinaryImage(file.buffer, kind);
    const asset = await CloudAsset.create({
      owner: ownerId,
      publicId: uploaded.publicId,
      providerAssetId: uploaded.providerAssetId,
      secureUrl: uploaded.secureUrl,
      kind,
    });
    return {
      url: uploaded.secureUrl,
      publicId: uploaded.publicId,
      providerAssetId: uploaded.providerAssetId,
      assetId: String(asset._id),
      provider: 'cloudinary',
    };
  } catch {
    if (uploaded?.publicId) {
      try { await deleteCloudinaryImage(uploaded.publicId); } catch { /* provider cleanup is best effort */ }
    }
    throw badGateway('Image upload could not be completed');
  }
}

export async function discardAsset(assetId, ownerId) {
  if (!assetId) return;
  const asset = await CloudAsset.findOne({ _id: assetId, owner: ownerId });
  if (!asset) return;
  await deleteCloudinaryImage(asset.publicId);
  await CloudAsset.deleteOne({ _id: asset._id, owner: ownerId });
}

export async function cleanupAssetIfUnreferenced(assetId, ownerId) {
  if (!assetId || !ownerId) return;
  try {
    const id = assetId._id || assetId;
    const [avatar, blog] = await Promise.all([
      User.exists({ avatarAsset: id }),
      Blog.exists({ $or: [{ coverAsset: id }, { inlineAssets: id }] }),
    ]);
    if (avatar || blog) return;
    const asset = await CloudAsset.findOne({ _id: id, ...(ownerId ? { owner: ownerId } : {}) });
    if (!asset) return;
    await deleteCloudinaryImage(asset.publicId);
    await CloudAsset.deleteOne({ _id: asset._id });
  } catch {
    // Keep its metadata if Cloudinary has not confirmed deletion.
  }
}
