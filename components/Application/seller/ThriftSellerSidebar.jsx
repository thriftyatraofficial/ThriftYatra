'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, ShoppingBag, TrendingUp, Settings, Home } from 'lucide-react'
import Image from 'next/image'
import axios from 'axios'
import {
    Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
    SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader,
    useSidebar
} from "@/components/ui/sidebar"

const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/seller/thrift/dashboard' },
    { icon: Package, label: 'My Products', href: '/seller/thrift/products' },
    { icon: ShoppingBag, label: 'Orders', href: '/seller/thrift/orders' },
    { icon: TrendingUp, label: 'Earnings', href: '/seller/thrift/earnings' },
    { icon: Settings, label: 'Store Settings', href: '/seller/thrift/settings' },
]

const ThriftSellerSidebar = () => {
    const pathname = usePathname()
    const { isMobile, setOpenMobile } = useSidebar()
    const [logoSrc, setLogoSrc] = useState('/assets/images/logo-black.png')

    useEffect(() => {
        fetchLogo()
    }, [])

    const fetchLogo = async () => {
        try {
            const { data } = await axios.get('/api/banners?active=true&location=logo_light&limit=1')
            if (data.success && data.data.length > 0 && data.data[0].base64Image) {
                setLogoSrc(data.data[0].base64Image)
            }
        } catch (error) {
            console.error('Failed to load sidebar logo:', error)
        }
    }
    
    return (
        <Sidebar className="z-50">
            <SidebarHeader className="p-4 border-b flex flex-col gap-1">
                <Link href="/seller/thrift/dashboard" onClick={() => { if (isMobile) setOpenMobile(false) }} className="flex items-center">
                    <Image 
                        src={logoSrc} 
                        width={100} 
                        height={32} 
                        alt='ThriftYatra' 
                        className='h-8 w-auto object-contain'
                        unoptimized={logoSrc.startsWith('data:')}
                    />
                </Link>
                <p className='text-[10px] text-gray-400 font-medium uppercase tracking-wide'>Thrift Seller Panel</p>
            </SidebarHeader>
            
            <SidebarContent className="pt-2">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item, index) => (
                                <SidebarMenuItem key={index}>
                                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                                        <Link href={item.href} onClick={() => { if (isMobile) setOpenMobile(false) }}>
                                            <item.icon className='h-5 w-5' />
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}

export default ThriftSellerSidebar