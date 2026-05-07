'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import axios from 'axios'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { getImageUrl } from '@/lib/imageUtils'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const VariantGrid = ({ productId, currentVariantId, slug, allVariants = [] }) => {
    const [variants, setVariants] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (allVariants && allVariants.length > 0) {
            // Use variants passed from product details API
            setVariants(allVariants.filter(v => v.status === 'active' && v.quantity > 0))
            setLoading(false)
        } else if (productId) {
            // Fallback to API call (should not happen in normal flow)
            fetchVariants()
        } else {
            setLoading(false)
        }
    }, [productId, allVariants])

    const fetchVariants = async () => {
        try {
            const { data } = await axios.get(`/api/seller/variants?productId=${productId}`)
            if (data.success) {
                setVariants((data.data || []).filter(v => v.status === 'active' && v.quantity > 0))
            }
        } catch (error) {
            console.error('Failed to fetch variants:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="text-center py-10">Loading options...</div>
    if (variants.length === 0) return <div className="text-center py-10 text-gray-500">No variants available</div>

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {variants.map((v) => {
                const vImage = getImageUrl(v.media?.[0]?.secure_url || v.media?.[0])
                const isSelected = currentVariantId === v._id

                return (
                    <Link
                        key={v._id}
                        href={`${WEBSITE_PRODUCT_DETAILS(slug)}?color=${encodeURIComponent(v.color)}&size=${encodeURIComponent(v.size)}`}
                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-[#E8B931] ring-2 ring-[#E8B931] bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <div className="aspect-[3/4] relative mb-3 bg-gray-100 rounded overflow-hidden">
                            <Image 
                                src={vImage} 
                                alt={`${v.size} ${v.color}`} 
                                fill 
                                className="object-cover" 
                                onError={(e) => { e.target.src = imgPlaceholder.src }} 
                            />
                            {v.quantity <= 3 && v.quantity > 0 && (
                                <Badge className="absolute top-2 left-2 bg-orange-500 text-white text-xs">Only {v.quantity}</Badge>
                            )}
                        </div>
                        <p className="font-medium text-sm">{v.size} / {v.color}</p>
                        <p className="font-bold text-sm mt-0.5">{formatCurrency(v.sellingPrice)}</p>
                        <p className="text-xs text-gray-400 line-through">{formatCurrency(v.mrp)}</p>
                        {isSelected && (
                            <Badge className="mt-2 bg-[#E8B931] text-black text-xs">Selected</Badge>
                        )}
                    </Link>
                )
            })}
        </div>
    )
}

export default VariantGrid