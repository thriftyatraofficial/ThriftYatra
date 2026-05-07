'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import axios from 'axios'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import { Button } from '@/components/ui/button'
import { getImageUrl } from '@/lib/imageUtils'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

const HeroSlider = () => {
    const [banners, setBanners] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBanners()
    }, [])

    const fetchBanners = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/banners?active=true&limit=5')
            if (data.success) setBanners(data.data)
        } catch (error) {
            console.error('Failed to load banners:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="h-[400px] md:h-[500px] bg-gray-100 animate-pulse rounded-lg"></div>
    }

    if (banners.length === 0) {
        return null
    }

    return (
        <div className="relative">
            <Swiper
                spaceBetween={0}
                slidesPerView={1}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                navigation={true}
                modules={[Autoplay, Pagination, Navigation]}
                className="h-[400px] md:h-[500px] rounded-lg overflow-hidden"
            >
                {banners.map((banner) => (
                    <SwiperSlide key={banner._id}>
                        <div className="relative w-full h-full">
                            {banner.mediaType === 'video' && banner.videoUrl ? (
                                <video
                                    src={banner.videoUrl}
                                    poster={getImageUrl(banner.posterUrl || banner.base64Poster)}
                                    autoPlay={banner.videoSettings?.autoplay !== false}
                                    loop={banner.videoSettings?.loop !== false}
                                    muted={banner.videoSettings?.muted !== false}
                                    controls={banner.videoSettings?.controls || false}
                                    playsInline
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            ) : (banner.imageUrl || banner.base64Image) ? (
                                <Image
                                    src={getImageUrl(banner.imageUrl || banner.base64Image)}
                                    alt={banner.title || 'Banner'}
                                    fill
                                    className="object-cover"
                                    priority
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <p className="text-gray-500">No image</p>
                                </div>
                            )}
                            {(banner.title || banner.subtitle) && (
                                <div className="absolute inset-0 bg-black/40 flex items-center">
                                    <div className="container mx-auto px-8 md:px-16">
                                        <div className="max-w-lg text-white">
                                            {banner.subtitle && (
                                                <p className="text-sm md:text-lg mb-2 uppercase tracking-wider">{banner.subtitle}</p>
                                            )}
                                            {banner.title && (
                                                <h1 className="text-3xl md:text-5xl font-bold mb-4">{banner.title}</h1>
                                            )}
                                            <Link href={banner.link || '/shop'}>
                                                <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                                                    {banner.buttonText || 'Shop Now'}
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    )
}

export default HeroSlider