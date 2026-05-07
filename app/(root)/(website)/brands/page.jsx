'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import axios from 'axios'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import { Store, MapPin, Package } from 'lucide-react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const breadcrumb = {
    title: 'Brands',
    links: [{ label: 'Brands', href: '/brands' }]
}

const BrandsPage = () => {
    const [brands, setBrands] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBrands()
    }, [])

    const fetchBrands = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/brands')
            if (data.success) setBrands(data.data)
        } catch (error) {
            console.error('Failed to load brands:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-96">Loading...</div>
    }

    return (
        <div>
            <WebsiteBreadcrumb props={breadcrumb} />
            <section className='lg:px-32 px-4 py-10'>
                <div className='mb-8'>
                    <h1 className='text-3xl font-bold'>🇮🇳 Indian Brands</h1>
                    <p className='text-gray-500'>Discover independent brands from across India</p>
                </div>
                
                <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {brands.map((brand) => (
                        <Link href={`/brands/${brand.slug}`} key={brand._id}>
                            <Card className='overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full'>
                                <div className='aspect-video bg-gradient-to-br from-[#E8B931] to-[#F5C542] relative'>
                                    {brand.sellerProfile?.storeLogo ? (
                                        <Image src={brand.sellerProfile.storeLogo} fill alt={brand.sellerProfile.storeName} className='object-cover' />
                                    ) : (
                                        <div className='flex items-center justify-center h-full text-white text-4xl font-bold'>
                                            {brand.sellerProfile?.storeName?.charAt(0) || 'B'}
                                        </div>
                                    )}
                                </div>
                                <CardContent className='p-5'>
                                    <div className='flex items-center gap-2 mb-2'>
                                        <Store className='h-4 w-4 text-[#E8B931]' />
                                        <h3 className='font-bold text-xl'>{brand.sellerProfile?.storeName || 'Brand'}</h3>
                                    </div>
                                    <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
                                        {brand.sellerProfile?.storeDescription || 'Independent brand from India'}
                                    </p>
                                    <div className='flex items-center gap-4 text-xs text-gray-500'>
                                        {brand.pickupAddress?.city && (
                                            <span className='flex items-center gap-1'>
                                                <MapPin className='h-3 w-3' /> {brand.pickupAddress.city}
                                            </span>
                                        )}
                                        <span className='flex items-center gap-1'>
                                            <Package className='h-3 w-3' /> {brand.sellerProfile?.totalProducts || 0} products
                                        </span>
                                    </div>
                                    <Button variant="link" className='text-[#E8B931] p-0 mt-3'>
                                        dive in →
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
                
                {brands.length === 0 && !loading && (
                    <div className='text-center py-20'>
                        <Store className='h-16 w-16 mx-auto text-gray-300 mb-4' />
                        <p className='text-gray-500'>No brands yet</p>
                    </div>
                )}
            </section>
        </div>
    )
}

export default BrandsPage