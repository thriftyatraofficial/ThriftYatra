'use client'
import React from 'react'
import { useSelector } from 'react-redux'
import { Button } from '@/components/ui/button'
import { Bell, Store, Menu } from 'lucide-react'
import UserDropdown from '@/components/Application/Admin/UserDropdown'
import ThemeSwitch from '@/components/Application/Admin/ThemeSwitch'
import { useSidebar } from '@/components/ui/sidebar'

const SellerTopbar = ({ sellerType }) => {
    const { auth } = useSelector(state => state.authStore)
    const { toggleSidebar } = useSidebar()
    
    return (
        <header className='fixed top-0 right-0 left-0 md:left-64 h-14 border-b bg-background z-40 flex items-center justify-between px-4 shadow-sm'>
            <div className='flex items-center gap-3'>
                <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
                    <Menu className="h-5 w-5" />
                </Button>
                <Store className='h-5 w-5 text-primary hidden md:block' />
                <span className='font-semibold hidden md:block'>
                    {auth?.sellerProfile?.storeName || 'My Store'}
                </span>
                <span className='text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full font-mono'>
                    ID: {auth?.sellerId}
                </span>
            </div>
            
            <div className='flex items-center gap-1'>
                <ThemeSwitch />
                <Button variant="ghost" size="icon">
                    <Bell className='h-5 w-5' />
                </Button>
                <UserDropdown />
            </div>
        </header>
    )
}

export default SellerTopbar