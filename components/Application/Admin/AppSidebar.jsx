'use client'
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LuChevronRight } from "react-icons/lu";
import { IoMdClose } from "react-icons/io";
import { adminAppSidebarMenu } from "@/lib/adminSidebarMenu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Link from "next/link"
import { useState, useEffect } from "react"
import axios from "axios"

const AppSidebar = () => {
    const { toggleSidebar, isMobile, setOpenMobile } = useSidebar()
    const [logoSrc, setLogoSrc] = useState('/assets/images/logo-black.png')
    const [logoWhiteSrc, setLogoWhiteSrc] = useState('/assets/images/logo-white.png')

    useEffect(() => {
        fetchLogo()
    }, [])

    const fetchLogo = async () => {
        try {
            // Fetch light logo
            const { data: lightData } = await axios.get('/api/banners?active=true&location=logo_light&limit=1')
            if (lightData.success && lightData.data.length > 0 && lightData.data[0].base64Image) {
                setLogoSrc(lightData.data[0].base64Image)
            }
            
            // Fetch dark logo (for dark mode)
            const { data: darkData } = await axios.get('/api/banners?active=true&location=logo_dark&limit=1')
            if (darkData.success && darkData.data.length > 0 && darkData.data[0].base64Image) {
                setLogoWhiteSrc(darkData.data[0].base64Image)
            }
        } catch (error) {
            console.error('Failed to load admin sidebar logo:', error)
        }
    }

    return (
        <Sidebar className="z-50">
            <SidebarHeader className="border-b h-14 p-0">
                <div className="flex justify-between items-center px-4 h-full">
                    <Link href="/admin/dashboard" onClick={() => { if (isMobile) setOpenMobile(false) }} className="flex items-center">
                        {/* Light mode logo */}
                        <Image 
                            src={logoSrc} 
                            height={50} 
                            width={120} 
                            className="block dark:hidden h-[35px] w-auto object-contain" 
                            alt="logo light" 
                            unoptimized={logoSrc.startsWith('data:')}
                        />
                        {/* Dark mode logo */}
                        <Image 
                            src={logoWhiteSrc} 
                            height={50} 
                            width={120} 
                            className="hidden dark:block h-[35px] w-auto object-contain" 
                            alt="logo dark" 
                            unoptimized={logoWhiteSrc.startsWith('data:')}
                        />
                    </Link>
                    <Button onClick={toggleSidebar} type="button" size="icon" className="md:hidden">
                        <IoMdClose />
                    </Button>
                </div>
            </SidebarHeader>

            <SidebarContent className="p-3">
                <SidebarMenu>
                    {adminAppSidebarMenu.map((menu, index) => (
                        <Collapsible key={index} className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton className="font-semibold px-2 py-5">
                                        <menu.icon />
                                        {menu.title}

                                        {menu.submenu && menu.submenu.length > 0 &&
                                            <LuChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        }
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                {menu.submenu && menu.submenu.length > 0 && (
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {menu.submenu.map((submenuItem, subMenuIndex) => (
                                                <SidebarMenuSubItem key={subMenuIndex}>
                                                    <SidebarMenuSubButton asChild className="px-2 py-5">
                                                        <Link href={submenuItem.url} onClick={() => { if (isMobile) setOpenMobile(false) }}>
                                                            {submenuItem.title}
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                )}
                            </SidebarMenuItem>
                        </Collapsible>
                    ))}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    )
}

export default AppSidebar