import { v2 as cloudinary } from 'cloudinary'
import path from 'path'
import { existsSync } from 'fs'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function getLocalUploadPath(source) {
  if (typeof source !== 'string') return null
  if (!source.startsWith('/uploads/')) return null
  return path.join(process.cwd(), source.replace(/^\//, ''))
}

export async function uploadMediaToCloudinary(source, folder = 'thriftyatra/media') {
  if (!source) throw new Error('Missing media source for Cloudinary upload.')

  let uploadSource = source
  if (typeof source === 'object' && source?.secure_url) {
    uploadSource = source.secure_url
  }

  if (typeof uploadSource === 'string') {
    const localPath = getLocalUploadPath(uploadSource)
    if (localPath && existsSync(localPath)) {
      uploadSource = localPath
    }
  }

  const isVideo = typeof uploadSource === 'string' && uploadSource.startsWith('data:video')
  const resourceType = isVideo ? 'video' : 'image'
  const publicId = `thriftyatra_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  const uploadOptions = {
    folder,
    public_id: publicId,
    resource_type: resourceType,
  }

  if (resourceType === 'image') {
    uploadOptions.transformation = [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto' }
    ]
  }

  const result = await cloudinary.uploader.upload(uploadSource, uploadOptions)
  return result
}

export const uploadImageToCloudinary = uploadMediaToCloudinary
