'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import axios from 'axios'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getImageUrl } from '@/lib/imageUtils'

const HomeBanners = () => {
    const [banners, setBanners] = useState([])
    const [currentSlide, setCurrentSlide] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBanners()
    }, [])

    useEffect(() => {
        if (banners.length > 1) {
            const interval = setInterval(() => {
                setCurrentSlide(prev => (prev + 1) % banners.length)
            }, 4000)
            return () => clearInterval(interval)
        }
    }, [banners])

    const fetchBanners = async () => {
        try {
            const { data } = await axios.get('/api/banners?active=true&location=home_banner_right&limit=10')
            if (data.success && data.data.length > 0) {
                setBanners(data.data)
            }
        } catch (error) {
            console.error('Failed to load banners:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading || banners.length === 0) return null

    const nextSlide = () => {
        setCurrentSlide(prev => (prev + 1) % banners.length)
    }

    const prevSlide = () => {
        setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length)
    }

    const getBannerSize = (banner) => {
        const size = banner.size || 'medium'
        const sizes = {
            small: 'h-40',
            medium: 'h-60',
            large: 'h-80',
            full: 'h-96'
        }
        return sizes[size] || 'h-60'
    }

    return (
        <section className='lg:px-32 px-4 pt-12 pb-10'>
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-2xl font-bold uppercase tracking-tight'>Our Promise</h2>
            </div>
            
            <div className='relative w-full overflow-hidden rounded-2xl'>
                <div className='relative w-full'>
                    {banners.map((banner, index) => (
                        <div
                            key={banner._id}
                            className={`transition-opacity duration-500 ${index === currentSlide ? 'opacity-100 block' : 'opacity-0 hidden'}`}
                        >
                            {(banner.mediaType === 'video' && banner.videoUrl) ? (
                                <div className={`relative w-full ${getBannerSize(banner)}`}>
                                    <video
                                        src={banner.videoUrl}
                                        poster={getImageUrl(banner.posterUrl || banner.base64Poster)}
                                        autoPlay={banner.videoSettings?.autoplay !== false}
                                        loop={banner.videoSettings?.loop !== false}
                                        muted={banner.videoSettings?.muted !== false}
                                        controls={banner.videoSettings?.controls || false}
                                        playsInline
                                        className='absolute inset-0 w-full h-full object-cover rounded-2xl'
                                    />
                                    {(banner.title || banner.subtitle) && (
                                        <div className='absolute inset-0 bg-black/30 flex items-center justify-center rounded-2xl'>
                                            <div className='text-center text-white px-6'>
                                                {banner.title && <h3 className='text-2xl md:text-4xl font-bold mb-2'>{banner.title}</h3>}
                                                {banner.subtitle && <p className='text-lg md:text-xl'>{banner.subtitle}</p>}
                                                {banner.link && (
                                                    <Link href={banner.link} className='mt-4 inline-block bg-[#E8B931] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#d4a520] transition'>
                                                        {banner.buttonText || 'Learn More'}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (banner.imageUrl || banner.base64Image) ? (
                                <div className={`relative w-full ${getBannerSize(banner)}`}>
                                    <Image
                                        src={getImageUrl(banner.imageUrl || banner.base64Image)}
                                        alt={banner.title || 'Our Promise'}
                                        fill
                                        className='object-cover rounded-2xl'
                                        unoptimized
                                    />
                                    {(banner.title || banner.subtitle) && (
                                        <div className='absolute inset-0 bg-black/30 flex items-center justify-center rounded-2xl'>
                                            <div className='text-center text-white px-6'>
                                                {banner.title && <h3 className='text-2xl md:text-4xl font-bold mb-2'>{banner.title}</h3>}
                                                {banner.subtitle && <p className='text-lg md:text-xl'>{banner.subtitle}</p>}
                                                {banner.link && (
                                                    <Link href={banner.link} className='mt-4 inline-block bg-[#E8B931] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#d4a520] transition'>
                                                        {banner.buttonText || 'Learn More'}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>

                {banners.length > 1 && (
                    <>
                        <button onClick={prevSlide} className='absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition z-10'>
                            <ChevronLeft className='h-5 w-5' />
                        </button>
                        <button onClick={nextSlide} className='absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition z-10'>
                            <ChevronRight className='h-5 w-5' />
                        </button>
                        <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10'>
                            {banners.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`h-2 rounded-full transition-all ${index === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/60'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    )
}

export default HomeBanners