'use client'
import { USER_DASHBOARD, WEBSITE_HOME, WEBSITE_LOGIN, WEBSITE_SHOP, USER_ORDERS } from '@/routes/WebsiteRoute'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { IoIosSearch, IoMdClose } from "react-icons/io"
import { HiMiniBars3 } from "react-icons/hi2"
import Cart from './Cart'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { getImageUrl } from '@/lib/imageUtils'

const Header = () => {
    const auth = useSelector(store => store.authStore.auth)
    const router = useRouter()
    const [isMobileMenu, setIsMobileMenu] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [marqueeText, setMarqueeText] = useState('♻️ THRIFTED TREASURES • ✨ INDIE BRANDS • 🚚 FREE SHIPPING OVER ₹999')
    const [logoSrc, setLogoSrc] = useState('/assets/images/logo-black.png')
    
    useEffect(() => { fetchMarqueeText(); fetchLogo() }, [])
    
    const fetchMarqueeText = async () => {
        try {
            const { data } = await axios.get('/api/banners?active=true&location=marquee_text&limit=1')
            if (data.success && data.data.length > 0 && data.data[0].textContent) setMarqueeText(data.data[0].textContent)
        } catch (error) {}
    }
    
    const fetchLogo = async () => {
        try {
            const { data } = await axios.get('/api/banners?active=true&location=logo_light&limit=1')
            if (data.success && data.data.length > 0) {
                const banner = data.data[0]
                const logo = banner.imageUrl || banner.base64Image
                if (logo) setLogoSrc(getImageUrl(logo))
            }
        } catch (error) {}
    }
    
    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) router.push(`${WEBSITE_SHOP}?search=${encodeURIComponent(searchQuery)}`)
    }

    const goTo = (path) => router.push(path)
    
    return (
        <>
            <div className="bg-black text-white py-1 overflow-hidden text-xs tracking-wide">
                <div className="animate-marquee whitespace-nowrap">
                    <span className="mx-4">{marqueeText}</span>
                    <span className="mx-4">•</span>
                    <span className="mx-4">{marqueeText}</span>
                    <span className="mx-4">•</span>
                    <span className="mx-4">{marqueeText}</span>
                </div>
            </div>

            <div className='bg-white border-b sticky top-0 z-40'>
                <div className='flex justify-between items-center px-4 lg:px-8' style={{ height: '56px' }}>
                    
                    <button onClick={() => goTo(WEBSITE_HOME)} className="flex items-center gap-2 flex-shrink-0">
                        <Image src={logoSrc} width={36} height={36} alt='Logo' className='h-9 w-9 object-contain' unoptimized={logoSrc.startsWith('data:')} />
                        <span className='text-sm sm:text-lg font-bold tracking-tight'>Thrift<span className='text-[#E8B931]'>Yatra</span></span>
                    </button>

                    <div className='hidden md:block flex-1 max-w-lg mx-4'>
                        <form onSubmit={handleSearch} className='flex items-center bg-gray-100 rounded-full px-3 py-1.5'>
                            <input type="text" placeholder="Search thrift finds..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className='bg-transparent border-none outline-none flex-1 text-sm' />
                            <button type="submit" className='text-gray-500 hover:text-[#E8B931]'><IoIosSearch size={16} /></button>
                        </form>
                    </div>

                    <div className='flex items-center'>
                        <nav className={`lg:relative lg:w-auto lg:h-auto lg:top-0 lg:left-0 lg:p-0 bg-white fixed z-50 top-0 w-full h-screen transition-all ${isMobileMenu ? 'left-0' : '-left-full'}`}>
                            <div className='lg:hidden flex justify-between items-center bg-gray-50 py-3 border-b px-3'>
                                <span className='text-lg font-bold'>Thrift<span className='text-[#E8B931]'>Yatra</span></span>
                                <button type='button' onClick={() => setIsMobileMenu(false)}><IoMdClose size={22} /></button>
                            </div>
                            <ul className='lg:flex items-center gap-5 px-3 text-sm'>
                                <li><Link href={WEBSITE_HOME} onClick={() => setIsMobileMenu(false)} className='block py-2 text-gray-600 hover:text-[#E8B931] hover:font-semibold'>Home</Link></li>
                                <li><Link href={`${WEBSITE_SHOP}?type=thrift`} onClick={() => setIsMobileMenu(false)} className='block py-2 text-gray-600 hover:text-[#E8B931] hover:font-semibold'>Thrift</Link></li>
                                <li><Link href={`${WEBSITE_SHOP}?type=brand_new`} onClick={() => setIsMobileMenu(false)} className='block py-2 text-gray-600 hover:text-[#E8B931] hover:font-semibold'>Brand</Link></li>
                                <li><Link href={`${WEBSITE_SHOP}?diy=true`} onClick={() => setIsMobileMenu(false)} className='block py-2 text-gray-600 hover:text-[#E8B931] hover:font-semibold'>DIY</Link></li>
                                <li><Link href="/track-order" onClick={() => setIsMobileMenu(false)} className='block py-2 text-gray-600 hover:text-[#E8B931] hover:font-semibold'>Track</Link></li>
                                {/* ✅ Orders link for logged in users */}
                                {auth && (
                                    <li><Link href={USER_ORDERS} onClick={() => setIsMobileMenu(false)} className='block py-2 text-gray-600 hover:text-[#E8B931] hover:font-semibold'>Orders</Link></li>
                                )}
                            </ul>
                        </nav>

                        <div className='flex items-center gap-2 ml-2'>
                            <button type='button' className='md:hidden' onClick={() => goTo(WEBSITE_SHOP)}><IoIosSearch size={18} /></button>
                            <Cart />
                            {!auth ? (
                                <button onClick={() => goTo(WEBSITE_LOGIN)} className='bg-[#E8B931] text-black px-3 py-1.5 rounded-full font-semibold text-xs hover:bg-[#d4a520] transition whitespace-nowrap'>Login</button>
                            ) : (
                                <div className='flex items-center gap-2'>
                                    <button onClick={() => goTo(USER_ORDERS)} className='text-gray-500 hover:text-[#E8B931] text-xs hidden sm:block'>Orders</button>
                                    <button onClick={() => goTo(USER_DASHBOARD)} className='border border-gray-300 text-gray-700 px-3 py-1.5 rounded-full font-medium text-xs hover:bg-gray-100 transition whitespace-nowrap'>Account</button>
                                </div>
                            )}
                            <button type='button' className='lg:hidden block' onClick={() => setIsMobileMenu(true)}><HiMiniBars3 size={18} /></button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-marquee { animation: marquee 25s linear infinite; display: inline-block; }
            `}</style>
        </>
    )
}

export default Header