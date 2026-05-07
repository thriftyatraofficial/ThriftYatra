'use client'
import AppSidebar from '@/components/Application/Admin/AppSidebar'
import ThemeProvider from '@/components/Application/Admin/ThemeProvider'
import Topbar from '@/components/Application/Admin/Topbar'
import { SidebarProvider } from '@/components/ui/sidebar'
import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import axios from 'axios'

const AdminLayout = ({ children }) => {
    const [logoSrc, setLogoSrc] = useState('/assets/images/admin-logo.png')

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
                <AppSidebar />
                <main className="md:w-[calc(100vw-16rem)] w-full overflow-x-hidden">
                    <div className='pt-[70px] md:px-8 px-5 min-h-[calc(100vh-40px)] pb-10'>
                        <Topbar />
                        {children}
                    </div>
                    <div className='border-t h-[40px] flex justify-center items-center gap-2 bg-gray-50 dark:bg-background text-sm'>
                        <Image src={logoSrc} width={20} height={20} alt='' className='h-4 w-auto object-contain opacity-50' unoptimized={logoSrc?.startsWith('data:')} />
                        <span className='text-gray-500'>ThriftYatra™</span>
                    </div>
                </main>
            </SidebarProvider>
        </ThemeProvider>
    )
}

export default AdminLayout