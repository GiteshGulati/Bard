import { v2 as cloudinary } from 'cloudinary';
import { env, isTest } from './env.js';

const configured = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
let testAdapter = null;
const folders = Object.freeze({
  avatar: 'bard/avatars',
  cover: 'bard/covers',
  inline: 'bard/article-images',
});

if (configured && !isTest) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
    timeout: 20000,
  });
}

export function cloudinaryEnabled() {
  return Boolean(testAdapter || (configured && !isTest));
}

export function setCloudinaryAdapterForTests(adapter) {
  if (!isTest) throw new Error('Cloudinary test adapter is only available in test mode');
  testAdapter = adapter;
}

export async function uploadCloudinaryImage(buffer, folder) {
  const cloudinaryFolder = folders[folder];
  if (!cloudinaryFolder) throw new Error('Unsupported Cloudinary image folder');
  if (testAdapter) return testAdapter.upload(buffer, cloudinaryFolder);
  if (!configured) throw new Error('Cloudinary is not configured');
  const uploaded = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: cloudinaryFolder,
      resource_type: 'image',
      use_filename: false,
      unique_filename: true,
      overwrite: false,
    }, (error, result) => error ? reject(error) : resolve(result));
    stream.end(buffer);
  });
  if (!uploaded?.secure_url?.startsWith('https://') || !uploaded?.public_id || !uploaded?.asset_id) {
    throw new Error('Cloudinary returned an incomplete image result');
  }
  return { secureUrl: uploaded.secure_url, publicId: uploaded.public_id, providerAssetId: uploaded.asset_id };
}

export async function deleteCloudinaryImage(publicId) {
  if (testAdapter) return testAdapter.remove(publicId);
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  if (!['ok', 'not found'].includes(result?.result)) throw new Error('Cloudinary asset removal failed');
  return result.result;
}

export function isCloudinaryImageUrl(value) {
  if (!configured || typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname === 'res.cloudinary.com'
      && url.pathname.startsWith(`/${env.CLOUDINARY_CLOUD_NAME}/image/upload/`);
  } catch {
    return false;
  }
}
