'use client'
import ThriftSellerSidebar from '@/components/Application/seller/ThriftSellerSidebar'
import ThemeProvider from '@/components/Application/Admin/ThemeProvider'
import SellerTopbar from '@/components/Application/seller/SellerTopbar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import axios from 'axios'

const ThriftSellerLayout = ({ children }) => {
    const [logoSrc, setLogoSrc] = useState('/assets/images/logo-black.png')

    useEffect(() => { fetchLogo() }, [])

    const fetchLogo = async () => {
        try {
            const { data } = await axios.get('/api/banners?active=true&location=logo_light&limit=1')
            if (data.success && data.data.length > 0 && data.data[0].base64Image) {
                setLogoSrc(data.data[0].base64Image)
            }
        } catch (error) {}
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SidebarProvider>
                <div className="flex h-screen w-full overflow-hidden">
                    <ThriftSellerSidebar />
                    <SidebarInset className="flex-1 flex flex-col overflow-auto">
                        <SellerTopbar sellerType="thrift" />
                        <main className="flex-1 overflow-auto pt-16 px-4 md:px-6">{children}</main>
                        <footer className='border-t h-10 flex justify-center items-center gap-2 bg-gray-50 dark:bg-background text-sm flex-shrink-0'>
                            <Image src={logoSrc} width={20} height={20} alt='' className='h-4 w-auto object-contain opacity-50' unoptimized={logoSrc?.startsWith('data:')} />
                            <span className='text-gray-500'>ThriftYatra™</span>
                        </footer>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </ThemeProvider>
    )
}

export default ThriftSellerLayout