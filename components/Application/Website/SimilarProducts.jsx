'use client'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import ProductBox from './ProductBox'
import Link from 'next/link'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'

const SimilarProducts = ({ productId, categoryId, productType }) => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    
    useEffect(() => {
        fetchSimilarProducts()
    }, [productId, categoryId])
    
    const fetchSimilarProducts = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get(`/api/product/similar?productId=${productId}&category=${categoryId}&type=${productType}&limit=4`)
            
            if (data.success) {
                setProducts(data.data.products || [])
            }
        } catch (error) {
            console.error('Failed to fetch similar products:', error)
        } finally {
            setLoading(false)
        }
    }
    
    if (!loading && products.length === 0) return null
    
    return (
        <div className='lg:px-32 px-4 py-10'>
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-2xl font-bold'>You May Also Like</h2>
                <Link href={WEBSITE_SHOP} className='text-[#E8B931] font-semibold text-sm hover:underline'>
                    view all →
                </Link>
            </div>
            
            {loading ? (
                <div className='text-center py-10'>Loading...</div>
            ) : (
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                    {products.map(product => (
                        <ProductBox key={product._id} product={product} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default SimilarProducts