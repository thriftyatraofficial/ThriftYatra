'use client'
import React from 'react'
import Link from 'next/link'
import { FaInstagram } from "react-icons/fa"
import { WEBSITE_SHOP, SELLER_REGISTER } from '@/routes/WebsiteRoute'

const Footer = () => {
    return (
        <footer className='bg-gray-100 text-gray-700 border-t'>
            <div className='grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-10 py-10 lg:px-32 px-4'>
                <div>
                    <h3 className='text-lg font-bold text-black mb-4'>ThriftYatra</h3>
                    <p className='text-sm text-gray-500'>A circular fashion bazaar. Thrifted treasures • Indie brands • One community.</p>
                </div>

                <div>
                    <h4 className='font-semibold text-black mb-4'>Shop</h4>
                    <ul className='space-y-2'>
                        <li><Link href={`${WEBSITE_SHOP}?type=thrift`} className='text-gray-500 hover:text-black text-sm'>Thrift Finds</Link></li>
                        <li><Link href={`${WEBSITE_SHOP}?type=brand_new`} className='text-gray-500 hover:text-black text-sm'>Brand New</Link></li>
                        <li><Link href={`${WEBSITE_SHOP}?diy=true`} className='text-gray-500 hover:text-black text-sm'>DIY</Link></li>
                        <li><Link href={WEBSITE_SHOP} className='text-gray-500 hover:text-black text-sm'>All Products</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className='font-semibold text-black mb-4'>Support</h4>
                    <ul className='space-y-2'>
                        <li><Link href="/track-order" className='text-gray-500 hover:text-black text-sm'>Track Order</Link></li>
                        <li><Link href="/shipping-policy" className='text-gray-500 hover:text-black text-sm'>Shipping Policy</Link></li>
                        <li><Link href="/return-policy" className='text-gray-500 hover:text-black text-sm'>Return Policy</Link></li>
                        <li><Link href="/privacy-policy" className='text-gray-500 hover:text-black text-sm'>Privacy Policy</Link></li>
                        <li><Link href="/terms-and-conditions" className='text-gray-500 hover:text-black text-sm'>Terms & Conditions</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className='font-semibold text-black mb-4'>Sell With Us</h4>
                    <ul className='space-y-2'>
                        <li><Link href={SELLER_REGISTER} className='text-gray-500 hover:text-black text-sm'>Become a Seller</Link></li>
                        <li><Link href="/about-us" className='text-gray-500 hover:text-black text-sm'>About Us</Link></li>
                    </ul>
                    <div className='flex gap-4 mt-4'>
                        <a href="https://instagram.com/thriftyatra" target="_blank" rel="noopener noreferrer" className='text-gray-400 hover:text-black'>
                            <FaInstagram size={20} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer