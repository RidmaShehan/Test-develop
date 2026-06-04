import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
})

export { cloudinary }

// ─── FOLDER STRUCTURE ─────────────────────────────────────
//
//  educrm/
//  ├── students/
//  │   └── {seekerId}/
//  │       ├── identity/          ← NIC, passport, birth cert
//  │       ├── academic/          ← transcripts, certificates
//  │       ├── financial/         ← payment receipts, bank slips
//  │       ├── program/           ← offer letters, acceptance
//  │       └── other/             ← misc
//  ├── campaigns/
//  │   └── {campaignId}/          ← campaign images
//  ├── programs/
//  │   └── {programId}/           ← program description images
//  └── voice-notes/
//      └── {seekerId}/            ← call recordings

export type DocumentCategory = 'identity' | 'academic' | 'financial' | 'program' | 'other'

export function getStudentFolder(seekerId: string, category: DocumentCategory): string {
  return `educrm/students/${seekerId}/${category}`
}

export interface UploadResult {
  publicId: string
  secureUrl: string
  format: string
  bytes: number
  width?: number
  height?: number
  resourceType: string
  folder: string
  createdAt: string
  thumbnailUrl: string
}

// Upload a file buffer to Cloudinary
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: {
    folder: string
    fileName: string
    resourceType?: 'image' | 'raw' | 'video' | 'auto'
    tags?: string[]
  }
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.fileName,
        resource_type: options.resourceType ?? 'auto',
        tags: options.tags ?? [],
        overwrite: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Upload failed'))
          return
        }
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          resourceType: result.resource_type,
          folder: result.folder ?? options.folder,
          createdAt: result.created_at,
          thumbnailUrl: cloudinary.url(result.public_id, {
            width: 200,
            height: 200,
            crop: 'fill',
            format: 'jpg',
            quality: 'auto',
          }),
        })
      }
    )
    uploadStream.end(fileBuffer)
  })
}

// Delete a file from Cloudinary by publicId
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'raw' | 'video' = 'raw'
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

// Generate a signed download URL (expires in 1 hour)
export function getSignedUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  })
}

// Get all files in a student folder
export async function listStudentDocuments(seekerId: string, category?: DocumentCategory) {
  const folder = category
    ? `educrm/students/${seekerId}/${category}`
    : `educrm/students/${seekerId}`

  const result = await cloudinary.api.resources({
    type: 'upload',
    prefix: folder,
    max_results: 100,
  })
  return result.resources
}
