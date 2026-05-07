'use client'
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Store, Instagram, Star, MapPin, Shield, Package } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'  // ✅ ADDED THIS IMPORT

const SellerInfoBox = ({ seller }) => {
    if (!seller) return null

    return (
        <Card className="mt-4">
            <CardContent className="p-5">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        {seller.sellerProfile?.storeLogo ? (
                            <Image 
                                src={seller.sellerProfile.storeLogo} 
                                width={64} 
                                height={64} 
                                alt={seller.sellerProfile?.storeName || seller.name} 
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                <Store className="h-8 w-8 text-gray-400" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-lg">
                                {seller.sellerProfile?.storeName || seller.name}
                            </h3>
                            {seller.sellerProfile?.isVerified && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">✓ Verified Seller</Badge>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3 mb-2">
                            
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                <Package className="h-3 w-3 inline mr-1" />
                                {seller.sellerProfile?.totalProducts || 0} Products
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                <Shield className="h-3 w-3 inline mr-1" />
                                {seller.sellerProfile?.totalSales || 0} Sales
                            </span>
                        </div>
                        
                        {seller.sellerProfile?.storeDescription && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {seller.sellerProfile.storeDescription}
                            </p>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                            {seller.sellerProfile?.instagram && (
                                <a href={`https://instagram.com/${seller.sellerProfile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" className="text-pink-600 border-pink-200 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-950">
                                        <Instagram className="h-4 w-4 mr-1" /> @{seller.sellerProfile.instagram.replace('@', '')}
                                    </Button>
                                </a>
                            )}
                        </div>
                        
                        {seller.pickupAddress?.city && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-3 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Ships from: {seller.pickupAddress.city}, {seller.pickupAddress.state}
                            </p>
                        )}
                        
                        <Link href={`/seller/${seller.sellerProfile?.storeName?.toLowerCase().replace(/\s+/g, '-') || seller._id}`} className="mt-3 inline-block">
                            <Button variant="link" className="text-[#E8B931] p-0 h-auto text-sm">
                                View Store →
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default SellerInfoBox