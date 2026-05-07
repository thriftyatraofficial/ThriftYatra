import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import ProductBox from '@/components/Application/Website/ProductBox'
import { Store, MapPin, Package, Star } from 'lucide-react'

const SellerPage = async ({ params }) => {
    const { sellerSlug } = await params

    let seller = null
    let products = []
    let error = null

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/seller/store/${sellerSlug}`, { cache: 'no-store' })
        const data = await response.json()
        
        if (data.success) {
            seller = data.data.seller
            products = data.data.products || []
        } else {
            error = 'Seller not found'
        }
    } catch (err) {
        console.error('Seller page error:', err)
        error = 'Failed to load seller information'
    }
    
    if (error || !seller) {
        return (
            <div className='flex justify-center items-center py-20 h-[400px]'>
                <div className='text-center'>
                    <h1 className='text-4xl font-semibold mb-4'>Store Not Found</h1>
                    <p className='text-gray-500 mb-6'>The store you're looking for doesn't exist.</p>
                    <Link href="/shop" className='bg-[#E8B931] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#d4a520] transition'>
                        Browse Shop
                    </Link>
                </div>
            </div>
        )
    }
    
    const isThriftSeller = seller.sellerType === 'thrift_seller'
    const storeName = seller.sellerProfile?.storeName || seller.name
    const storeLogo = seller.sellerProfile?.storeLogo
    
    // Separate products: available first, sold out last
    const availableProducts = products.filter(p => p.status === 'active' && p.quantity > 0)
    const soldOutProducts = products.filter(p => p.status === 'sold_out' || p.quantity <= 0)
    
    return (
        <div className='lg:px-32 px-4 py-10'>
            {/* Store Header */}
            <div className='bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-10'>
                <div className='flex items-start gap-6'>
                    <div className='flex-shrink-0'>
                        {storeLogo ? (
                            <Image 
                                src={storeLogo && (storeLogo.startsWith('http') || storeLogo.startsWith('data:') || storeLogo.startsWith('/')) ? storeLogo : '/assets/images/img-placeholder.webp'} 
                                width={100} height={100} alt={storeName}
                                className='rounded-full object-cover border-4 border-white shadow'
                            />
                        ) : (
                            <div className='w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center border-4 border-white shadow'>
                                <Store className='h-10 w-10 text-gray-400' />
                            </div>
                        )}
                    </div>
                    
                    <div className='flex-1'>
                        <div className='flex items-center gap-3 mb-2'>
                            <h1 className='text-3xl font-bold'>{storeName}</h1>
                            {seller.sellerProfile?.isVerified && (
                                <span className='bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full'>✓ Verified Seller</span>
                            )}
                            <span className={`text-xs px-3 py-1 rounded-full ${isThriftSeller ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                {isThriftSeller ? 'Thrift Store' : 'Brand Store'}
                            </span>
                        </div>
                        
                        {seller.sellerProfile?.storeDescription && (
                            <p className='text-gray-600 mb-3'>{seller.sellerProfile.storeDescription}</p>
                        )}
                        
                        <div className='flex items-center gap-6 text-sm text-gray-500'>
                            <div className='flex items-center gap-1'>
                                <Package className='h-4 w-4' />
                                <span>{seller.sellerProfile?.totalProducts || 0} Products</span>
                            </div>
                            <div className='flex items-center gap-1'>
                                <span className='w-3 h-3 rounded-full bg-green-500'></span>
                                <span>{availableProducts.length} Available</span>
                            </div>
                            <div className='flex items-center gap-1'>
                                <span className='w-3 h-3 rounded-full bg-red-500'></span>
                                <span>{soldOutProducts.length} Sold</span>
                            </div>
                            {seller.sellerProfile?.rating > 0 && (
                                <div className='flex items-center gap-1'>
                                    <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                                    <span>{seller.sellerProfile.rating.toFixed(1)} Rating</span>
                                </div>
                            )}
                            {seller.pickupAddress?.city && (
                                <div className='flex items-center gap-1'>
                                    <MapPin className='h-4 w-4' />
                                    <span>{seller.pickupAddress.city}, {seller.pickupAddress.state}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Available Products */}
            {availableProducts.length > 0 && (
                <div className="mb-10">
                    <h2 className='text-2xl font-bold mb-6'>Available Products</h2>
                    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                        {availableProducts.map(product => (
                            <ProductBox key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            )}

            {/* Sold Out Products - Show with Red Badge */}
            {soldOutProducts.length > 0 && (
                <div>
                    <h2 className='text-2xl font-bold mb-6 text-gray-500'>Sold Out</h2>
                    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 opacity-60'>
                        {soldOutProducts.map(product => (
                            <div key={product._id} className='relative'>
                                <div className='absolute top-2 right-2 z-10 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-semibold'>
                                    SOLD OUT
                                </div>
                                <ProductBox product={product} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {products.length === 0 && (
                <div className='text-center py-20 text-gray-500'>
                    <Package className='h-16 w-16 mx-auto mb-4 text-gray-300' />
                    <p className='text-lg'>No products available yet.</p>
                </div>
            )}
        </div>
    )
}

export default SellerPage