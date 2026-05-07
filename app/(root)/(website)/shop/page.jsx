'use client'
import Filter from '@/components/Application/Website/Filter'
import Sorting from '@/components/Application/Website/Sorting'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import React, { useState, useEffect } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import useWindowSize from '@/hooks/useWindowSize'
import axios from 'axios'
import { useSearchParams } from 'next/navigation'
import { useInfiniteQuery } from '@tanstack/react-query'
import ProductBox from '@/components/Application/Website/ProductBox'
import ButtonLoading from '@/components/Application/ButtonLoading'

const breadcrumb = {
    title: 'Shop',
    links: [
        { label: 'Shop', href: WEBSITE_SHOP }
    ]
}

const Shop = () => {
    const searchParams = useSearchParams()
    const typeParam = searchParams.get('type')
    const searchString = searchParams.toString()
    
    const [limit] = useState(12)
    const [sorting, setSorting] = useState('default_sorting')
    const [isMobileFilter, setIsMobileFilter] = useState(false)
    const windowSize = useWindowSize()
    
    // ✅ Dynamic title based on type
    const getPageTitle = () => {
        if (typeParam === 'thrift') return 'Thrift Finds'
        if (typeParam === 'brand_new') return 'Brand New'
        return 'Shop'
    }

    const fetchProduct = async (pageParam) => {
        const { data: getProduct } = await axios.get(`/api/shop?page=${pageParam}&limit=${limit}&sort=${sorting}&${searchString}`)

        if (!getProduct.success) {
            return { products: [], nextPage: null }
        }

        return getProduct.data
    }

    const { error, data, isFetching, fetchNextPage, hasNextPage } = useInfiniteQuery({
        queryKey: ['products', limit, sorting, searchString],
        queryFn: async ({ pageParam = 0 }) => await fetchProduct(pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (lastPage?.nextPage !== null && lastPage?.nextPage !== undefined) {
                return lastPage.nextPage
            }
            return undefined
        }
    })

    return (
        <div>
            <WebsiteBreadcrumb props={{
                title: getPageTitle(),
                links: [{ label: getPageTitle(), href: WEBSITE_SHOP + (typeParam ? `?type=${typeParam}` : '') }]
            }} />
            
            <section className='lg:flex lg:px-32 px-4 my-20'>
                {windowSize.width > 1024 ? (
                    <div className='w-72 me-4'>
                        <div className='sticky top-20 bg-gray-50 p-4 rounded'>
                            <Filter />
                        </div>
                    </div>
                ) : (
                    <Sheet open={isMobileFilter} onOpenChange={() => setIsMobileFilter(false)}>
                        <SheetContent side='left' className="block">
                            <SheetHeader className="border-b">
                                <SheetTitle>Filter</SheetTitle>
                            </SheetHeader>
                            <div className='p-4 overflow-auto h-[calc(100vh-80px)]'>
                                <Filter />
                            </div>
                        </SheetContent>
                    </Sheet>
                )}

                <div className='lg:w-[calc(100%-18rem)]'>
                    <Sorting
                        limit={limit}
                        sorting={sorting}
                        setSorting={setSorting}
                        mobileFilterOpen={isMobileFilter}
                        setMobileFilterOpen={setIsMobileFilter}
                    />

                    {/* ✅ Show type-specific header */}
                    {typeParam && (
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold">
                                {typeParam === 'thrift' ? '♻️ Thrift Finds' : '✨ Brand New'}
                            </h2>
                            <p className="text-gray-500 text-sm">
                                {typeParam === 'thrift' 
                                    ? 'Unique pre-loved items at great prices' 
                                    : 'Fresh stock from independent brands'}
                            </p>
                        </div>
                    )}

                    {isFetching && !data?.pages?.length && (
                        <div className='p-3 font-semibold text-center'>Loading...</div>
                    )}
                    
                    {error && (
                        <div className='p-3 font-semibold text-center text-red-500'>
                            {error.message}
                        </div>
                    )}

                    {data?.pages?.some(page => page?.products?.length > 0) ? (
                        <div className='grid lg:grid-cols-3 grid-cols-2 lg:gap-10 gap-5 mt-10'>
                            {data.pages.map((page, i) => (
                                <React.Fragment key={i}>
                                    {page?.products?.map(product => (
                                        <ProductBox key={product._id} product={product} />
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    ) : !isFetching && (
                        <div className='text-center py-20 text-gray-500'>
                            <p className='text-lg'>No products found</p>
                            <p className='text-sm mt-2'>Try adjusting your filters</p>
                        </div>
                    )}

                    <div className='flex justify-center mt-10'>
                        {hasNextPage ? (
                            <ButtonLoading 
                                type="button" 
                                loading={isFetching} 
                                text="Load More" 
                                onClick={fetchNextPage}
                                className="bg-[#E8B931] hover:bg-[#d4a520] text-black px-8 py-3 rounded-full"
                            />
                        ) : (
                            data?.pages?.length > 0 && !isFetching && data.pages.some(p => p?.products?.length > 0) && (
                                <span className="text-gray-500">No more products to load.</span>
                            )
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Shop