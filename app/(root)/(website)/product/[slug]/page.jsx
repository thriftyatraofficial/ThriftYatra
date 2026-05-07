import React from 'react'
import ProductDetails from './ProductDetails'

const ProductPage = async ({ params, searchParams }) => {
    const { slug } = await params
    const { color, size } = await searchParams

    // Use internal API route with fetch instead of axios
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/product/details/${slug}${color && size ? `?color=${color}&size=${size}` : ''}`

    try {
        const response = await fetch(url, { cache: 'no-store' })
        const getProduct = await response.json()

        if (!getProduct.success || !getProduct.data?.product) {
            return (
                <div className='flex justify-center items-center py-20 h-[400px]'>
                    <div className='text-center'>
                        <h1 className='text-4xl font-semibold mb-4'>Product not found</h1>
                        <p className='text-gray-500 mb-6'>The product you're looking for doesn't exist or has been removed.</p>
                        <a href="/shop" className='bg-[#E8B931] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#d4a520] transition'>Browse Shop</a>
                    </div>
                </div>
            )
        }

        return (
            <ProductDetails
                product={getProduct?.data?.product}
                variant={getProduct?.data?.variant}
                colors={getProduct?.data?.colors}
                sizes={getProduct?.data?.sizes}
                validCombinations={getProduct?.data?.validCombinations}
                allVariants={getProduct?.data?.allVariants}
                reviewCount={getProduct?.data?.reviewCount}
                seller={getProduct?.data?.seller}
            />
        )
    } catch (error) {
        console.error('Product fetch error:', error)
        return (
            <div className='flex justify-center items-center py-20 h-[400px]'>
                <div className='text-center'>
                    <h1 className='text-4xl font-semibold mb-4'>Something went wrong</h1>
                    <p className='text-gray-500 mb-6'>Please try again later.</p>
                    <a href="/shop" className='bg-[#E8B931] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#d4a520] transition'>Browse Shop</a>
                </div>
            </div>
        )
    }
}

export default ProductPage