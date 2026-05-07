import Image from 'next/image'
import React from 'react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import Link from 'next/link'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import { getImageUrl } from '@/lib/imageUtils'

const ProductBox = ({ product }) => {
    const primaryImage =
        product?.media?.[0] ||
        product?.base64Media?.[0] ||
        product?._firstVariant?.media?.[0] ||
        product?._firstVariant?.base64Media?.[0] ||
        null

    let validImage = getImageUrl(primaryImage)
    if (!validImage || validImage === 'undefined' || validImage === 'null') {
        validImage = imgPlaceholder.src
    }

    const isThrift = product.productType === 'thrift'
    const storeName = product?.sellerId?.sellerProfile?.storeName || product?.sellerId?.name || ''

    return (
        <div className='rounded-lg hover:shadow-lg border overflow-hidden bg-white transition-shadow'>
            <Link href={WEBSITE_PRODUCT_DETAILS(product.slug)}>
                <Image
                    src={validImage}
                    width={400}
                    height={533}
                    alt={product?.name || 'Product'}
                    className='w-full aspect-[3/4] object-cover object-top'
                    unoptimized={validImage.startsWith('data:')}
                />
                <div className="p-3 border-t">
                    <h4 className="font-medium truncate text-sm">{product?.name}</h4>
                    {isThrift ? (
                        <div className="mt-2">
                            <span className='font-semibold text-base'>₹{product?.sellingPrice?.toLocaleString('en-IN')}</span>
                            {product?.condition && (
                                <span className='ml-2 text-xs bg-gray-100 px-2 py-1 rounded capitalize'>{product.condition.replace('_', ' ')}</span>
                            )}
                            {storeName && <p className="text-xs text-gray-500 mt-1 truncate">{storeName}</p>}
                        </div>
                    ) : (
                        <>
                            <p className='flex gap-2 text-sm mt-2'>
                                <span className='line-through text-gray-400 text-xs'>₹{product?.mrp?.toLocaleString('en-IN')}</span>
                                <span className='font-semibold'>₹{product?.sellingPrice?.toLocaleString('en-IN')}</span>
                            </p>
                            {product?.discountPercentage > 0 && (
                                <span className='bg-red-500 text-white text-xs px-2 py-0.5 rounded-full'>-{product.discountPercentage}%</span>
                            )}
                            {storeName && <p className="text-xs text-gray-500 mt-1 truncate">{storeName}</p>}
                        </>
                    )}
                </div>
            </Link>
        </div>
    )
}

export default ProductBox