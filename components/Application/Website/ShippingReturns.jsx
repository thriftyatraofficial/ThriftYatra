'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { renderSafeMarkdown } from '@/lib/safeMarkdown'

const ShippingReturns = () => {
    const [content, setContent] = useState(null)

    useEffect(() => { fetchContent() }, [])

    const fetchContent = async () => {
        try {
            const { data } = await axios.get('/api/content/shipping-returns')
            if (data.success && data.data) {
                const htmlContent = renderSafeMarkdown(data.data.content)
                setContent({ ...data.data, content: htmlContent })
            }
        } catch (error) { console.error('Failed to fetch shipping content:', error) }
    }

    if (!content) return null

    return (
        <div className="mb-10">
            <div className="border rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                    <h2 className="font-semibold text-xl uppercase">Shipping and Returns</h2>
                </div>
                <div className="p-6 text-gray-600 prose max-w-none" dangerouslySetInnerHTML={{ __html: content.content }} />
            </div>
        </div>
    )
}

export default ShippingReturns
