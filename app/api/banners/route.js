import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import BannerModel from "@/models/Banner.model"
import { NextResponse } from "next/server"

export async function GET(request) {
    try {
        await connectDB()
        const { searchParams } = new URL(request.url)
        const activeOnly = searchParams.get('active') === 'true'
        const location = searchParams.get('location')
        const limit = parseInt(searchParams.get('limit')) || 50
        
        const filter = {}
        if (activeOnly) {
            filter.isActive = true
            const now = new Date()
            filter.$and = [
                { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
                { $or: [{ endDate: null }, { endDate: { $gte: now } }] }
            ]
        }
        if (location) filter.location = location
        
        const banners = await BannerModel.find(filter)
            .sort({ order: 1, createdAt: -1 })
            .limit(limit)
            .lean()
        
        // Group by location for easy frontend access
        const grouped = {}
        banners.forEach(b => {
            if (!grouped[b.location]) grouped[b.location] = []
            grouped[b.location].push(b)
        })
        
        return NextResponse.json({ success: true, data: banners, grouped })
    } catch (error) {
        return catchError(error)
    }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        await connectDB()
        const payload = await request.json()
        const allowedFields = [
            'title', 'subtitle', 'location', 'mediaType', 'imageUrl', 'videoUrl', 'posterUrl', 'textContent',
            'link', 'buttonText', 'size', 'customWidth', 'customHeight', 'isActive', 'order', 'startDate', 'endDate',
            'videoSettings'
        ]
        const data = {}
        allowedFields.forEach((field) => {
            if (payload[field] !== undefined) data[field] = payload[field]
        })
        const banner = new BannerModel(data)
        await banner.save()
        return response(true, 201, 'Banner created.', banner)
    } catch (error) {
        return catchError(error)
    }
}

export async function PUT(request) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        await connectDB()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const payload = await request.json()
        if (!id) return response(false, 400, 'Banner ID required.')
        const allowedFields = [
            'title', 'subtitle', 'location', 'mediaType', 'imageUrl', 'videoUrl', 'posterUrl', 'textContent',
            'link', 'buttonText', 'size', 'customWidth', 'customHeight', 'isActive', 'order', 'startDate', 'endDate',
            'videoSettings'
        ]
        const data = {}
        allowedFields.forEach((field) => {
            if (payload[field] !== undefined) data[field] = payload[field]
        })
        const banner = await BannerModel.findByIdAndUpdate(id, data, { new: true })
        return response(true, 200, 'Banner updated.', banner)
    } catch (error) {
        return catchError(error)
    }
}

export async function DELETE(request) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        await connectDB()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return response(false, 400, 'Banner ID required.')
        await BannerModel.findByIdAndDelete(id)
        return response(true, 200, 'Banner deleted.')
    } catch (error) {
        return catchError(error)
    }
}