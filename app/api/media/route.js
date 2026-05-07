import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import MediaModel from "@/models/Media.model"
import { uploadMediaToCloudinary } from "@/lib/cloudinary"

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''
        const limit = parseInt(searchParams.get('limit')) || 50

        const query = { deletedAt: null }
        if (search) {
            query.$or = [
                { filename: { $regex: search, $options: 'i' } },
                { alt: { $regex: search, $options: 'i' } }
            ]
        }

        const media = await MediaModel.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean()

        return response(true, 200, 'Media fetched successfully.', media)
    } catch (error) {
        return catchError(error)
    }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const formData = await request.formData()
        const files = formData.getAll('files')

        if (!files || files.length === 0) {
            return response(false, 400, 'No files provided.')
        }

        const uploadedMedia = []

        for (const file of files) {
            if (!(file instanceof File)) continue

            const isImage = file.type.startsWith('image/')
            const isVideo = file.type.startsWith('video/')
            if (!isImage && !isVideo) continue

            const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024
            if (file.size > maxSize) continue

            try {
                const bytes = await file.arrayBuffer()
                const buffer = Buffer.from(bytes)
                const base64 = buffer.toString('base64')
                const dataURI = `data:${file.type};base64,${base64}`

                const uploadResult = await uploadMediaToCloudinary(dataURI, 'thriftyatra/media')

                const mediaDoc = new MediaModel({
                    filename: uploadResult.public_id,
                    originalName: file.name,
                    url: uploadResult.secure_url,
                    public_id: uploadResult.public_id,
                    secure_url: uploadResult.secure_url,
                    size: file.size,
                    mimeType: file.type,
                    resourceType: isVideo ? 'video' : 'image',
                    alt: file.name,
                    width: uploadResult.width,
                    height: uploadResult.height
                })

                await mediaDoc.save()
                uploadedMedia.push(mediaDoc)
            } catch (fileError) {
                console.error('File upload error:', fileError)
            }
        }

        if (uploadedMedia.length === 0) {
            return response(false, 400, 'No valid media were uploaded.')
        }

        return response(true, 200, `${uploadedMedia.length} media uploaded successfully.`, uploadedMedia)
    } catch (error) {
        return catchError(error)
    }
}
