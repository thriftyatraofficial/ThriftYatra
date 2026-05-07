'use client'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import ProductBox from '@/components/Application/Website/ProductBox'
import { getImageUrl } from '@/lib/imageUtils'
import axios from 'axios'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'

const Home = () => {
    const [thriftProducts, setThriftProducts] = useState([])
    const [brandProducts, setBrandProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [carouselSlides, setCarouselSlides] = useState([])
    const [currentSlide, setCurrentSlide] = useState(0)
    const [promiseBanners, setPromiseBanners] = useState([])
    const [promiseSlide, setPromiseSlide] = useState(0)

    useEffect(() => { fetchAllData() }, [])

    useEffect(() => {
        if (carouselSlides.length > 0) {
            const interval = setInterval(() => setCurrentSlide(prev => (prev + 1) % carouselSlides.length), 5000)
            return () => clearInterval(interval)
        }
    }, [carouselSlides])

    useEffect(() => {
        if (promiseBanners.length > 1) {
            const interval = setInterval(() => setPromiseSlide(prev => (prev + 1) % promiseBanners.length), 4000)
            return () => clearInterval(interval)
        }
    }, [promiseBanners])

    const fetchAllData = async () => {
        try {
            setLoading(true)
            const bannersRes = await axios.get('/api/banners?active=true')
            const [thriftRes, brandRes] = await Promise.all([
                axios.get('/api/shop?type=thrift&limit=8'),
                axios.get('/api/shop?type=brand_new&limit=8')
            ])
            if (bannersRes.data.success) {
                const grouped = bannersRes.data.grouped || {}
                const slides = []
                for (let i = 1; i <= 4; i++) {
                    const slide = grouped?.[`carousel_${i}`]?.[0]
                    if (slide?.imageUrl || slide?.base64Image) slides.push(slide)
                }
                setCarouselSlides(slides)
                setPromiseBanners(grouped?.['home_banner_right'] || [])
            }
            if (thriftRes.data.success) setThriftProducts(thriftRes.data.data.products || [])
            if (brandRes.data.success) setBrandProducts(brandRes.data.data.products || [])
        } catch (error) {}
        finally { setLoading(false) }
    }

    return (
        <div className="bg-white">
            {/* Full-Width Carousel - No Arrows, Only Dots */}
            {carouselSlides.length > 0 ? (
                <section className="relative w-full h-[50vh] md:h-[75vh] overflow-hidden">
                    {carouselSlides.map((slide, index) => (
                        <div key={slide._id} className={`absolute inset-0 transition-opacity duration-700 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                            <Image src={getImageUrl(slide.imageUrl || slide.base64Image)} alt={slide.title || 'Banner'} fill className="object-cover" unoptimized priority={index === 0} />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="text-center text-white px-4 max-w-xl">
                                    {slide.title && <h1 className="text-4xl md:text-6xl font-bold mb-2 uppercase tracking-wider">{slide.title}</h1>}
                                    {slide.subtitle && <p className="text-lg md:text-xl mb-6">{slide.subtitle}</p>}
                                    {slide.link && (
                                        <Link href={slide.link} className="inline-block bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-[#E8B931] transition">
                                            {slide.buttonText || 'Shop Now'}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* Only Dots - No Arrows */}
                    {carouselSlides.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                            {carouselSlides.map((_, index) => (
                                <button key={index} onClick={() => setCurrentSlide(index)} className={`h-2.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/50'}`} />
                            ))}
                        </div>
                    )}
                </section>
            ) : (
                <section className="w-full h-[50vh] bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                    <h1 className="text-4xl font-bold text-gray-400 uppercase">New Collection</h1>
                </section>
            )}

            {/* Thrift Finds */}
            <section className='lg:px-32 px-4 pt-16 pb-8'>
                <div className='flex justify-between items-center mb-8'>
                    <div>
                        <h2 className='text-2xl font-bold uppercase tracking-tight'>Thrift Finds</h2>
                        <p className='text-gray-500 text-sm mt-1'>Pre-owned treasures waiting for you</p>
                    </div>
                    <Link href={`${WEBSITE_SHOP}?type=thrift`} className='text-black font-semibold text-sm hover:underline underline-offset-4'>VIEW ALL →</Link>
                </div>
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                    {loading ? <div className='col-span-4 text-center py-20'>Loading...</div> :
                     thriftProducts.length === 0 ? <div className='col-span-4 text-center py-20 text-gray-500'>No thrift items yet</div> :
                     thriftProducts.map(product => <ProductBox key={product._id} product={product} />)}
                </div>
            </section>

            {/* Brand New */}
            <section className='lg:px-32 px-4 pt-8 pb-16'>
                <div className='flex justify-between items-center mb-8'>
                    <div>
                        <h2 className='text-2xl font-bold uppercase tracking-tight'>Brand New</h2>
                        <p className='text-gray-500 text-sm mt-1'>Fresh styles from indie brands</p>
                    </div>
                    <Link href={`${WEBSITE_SHOP}?type=brand_new`} className='text-black font-semibold text-sm hover:underline underline-offset-4'>VIEW ALL →</Link>
                </div>
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                    {loading ? <div className='col-span-4 text-center py-20'>Loading...</div> :
                     brandProducts.length === 0 ? <div className='col-span-4 text-center py-20 text-gray-500'>No brand items yet</div> :
                     brandProducts.map(product => <ProductBox key={product._id} product={product} />)}
                </div>
            </section>

            {/* Our Promise Banners - No Arrows */}
            {promiseBanners.length > 0 && (
                <section className='lg:px-32 px-4 pt-8 pb-16'>
                    <h2 className='text-2xl font-bold uppercase text-center mb-6 tracking-tight'>Our Promise</h2>
                    <div className='relative w-full overflow-hidden rounded-2xl'>
                        <div className='relative w-full h-[300px] md:h-[400px]'>
                            {promiseBanners.map((banner, index) => (
                                <div key={banner._id} className={`absolute inset-0 transition-opacity duration-700 ${index === promiseSlide ? 'opacity-100' : 'opacity-0'}`}>
                                    {banner.mediaType === 'video' && banner.videoUrl ? (
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
                                    ) : (banner.imageUrl || banner.base64Image) ? (
                                        <Image src={getImageUrl(banner.imageUrl || banner.base64Image)} alt={banner.title || 'Our Promise'} fill className='object-cover rounded-2xl' unoptimized />
                                    ) : null}
                                    {(banner.title || banner.subtitle) && (
                                        <div className='absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl'>
                                            <div className='text-center text-white px-6'>
                                                {banner.title && <h3 className='text-3xl md:text-4xl font-bold mb-3'>{banner.title}</h3>}
                                                {banner.subtitle && <p className='text-lg'>{banner.subtitle}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {promiseBanners.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                {promiseBanners.map((_, index) => (
                                    <button key={index} onClick={() => setPromiseSlide(index)} className={`h-2 rounded-full transition-all ${index === promiseSlide ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    )
}

export default Home