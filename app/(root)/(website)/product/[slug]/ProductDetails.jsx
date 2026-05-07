'use client'

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { WEBSITE_CART, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from "@/routes/WebsiteRoute"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { decode } from "entities"
import { HiMinus, HiPlus } from "react-icons/hi2"
import ButtonLoading from "@/components/Application/ButtonLoading"
import { useDispatch, useSelector } from "react-redux"
import { addIntoCart } from "@/store/reducer/cartReducer"
import { showToast } from "@/lib/showToast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import loadingSvg from '@/public/assets/images/loading.svg'
import SellerInfoBox from '@/components/Application/Website/SellerInfoBox'
import SimilarProducts from '@/components/Application/Website/SimilarProducts'
import VariantGrid from '@/components/Application/Website/VariantGrid'
import ShippingReturns from '@/components/Application/Website/ShippingReturns'
import React from 'react'
import { 
    Ruler, Package, Truck, CheckCircle, RotateCcw, Share2 
} from 'lucide-react'
import { getConditionDisplay, formatCurrency } from '@/lib/utils'
import { getImageUrl, getImageArray } from '@/lib/imageUtils'
import axios from 'axios'

const ProductDetails = ({ product, variant, colors, sizes, reviewCount, seller, validCombinations, allVariants }) => {

    const dispatch = useDispatch()
    const cartStore = useSelector(store => store.cartStore)
    
    const [activeThumb, setActiveThumb] = useState(null)
    const [qty, setQty] = useState(1)
    const [isAddedIntoCart, setIsAddedIntoCart] = useState(false)
    const [isProductLoading, setIsProductLoading] = useState(false)
    const [showSizeChart, setShowSizeChart] = useState(false)
    const [imageErrors, setImageErrors] = useState({})
    
    const isThrift = product?.productType === 'thrift'
    const isBrandNew = product?.productType === 'brand_new'
    
    const galleryImages = useMemo(() => getImageArray(product, variant), [product, variant])

    useEffect(() => {
        if (galleryImages.length > 0) setActiveThumb(galleryImages[0]?.secure_url)
    }, [galleryImages])

    useEffect(() => {
        if (cartStore.count > 0 && cartStore.products) {
            const validProducts = cartStore.products.filter(cartProduct => cartProduct != null && cartProduct.productId != null);
            const existingProduct = validProducts.findIndex((cartProduct) => 
                cartProduct.productId === product?._id && 
                (cartProduct.variantId === variant?._id || (!cartProduct.variantId && !variant?._id))
            );
            setIsAddedIntoCart(existingProduct >= 0);
        } else { setIsAddedIntoCart(false); }
        setIsProductLoading(false);
    }, [variant, product, cartStore])

    const handleThumb = (thumbUrl) => setActiveThumb(thumbUrl)

    const handleQty = (actionType) => {
        if (actionType === 'inc') {
            const maxQty = isBrandNew && variant ? variant.quantity : (isThrift ? 1 : 10)
            if (qty < maxQty) setQty(prev => prev + 1)
        } else { if (qty !== 1) setQty(prev => prev - 1) }
    }

    const handleAddToCart = () => {
        const cartProduct = {
            productId: product._id,
            variantId: variant?._id || null,
            sellerId: product.sellerId,
            name: product.name,
            url: product.slug,
            size: variant?.size || null,
            color: variant?.color || null,
            mrp: variant?.mrp || product.mrp || product.sellingPrice,
            sellingPrice: variant?.sellingPrice || product.sellingPrice,
            media: getImageUrl(galleryImages[0]?.secure_url) || null,
            qty: isThrift ? 1 : qty,
            maxQuantity: isThrift ? 1 : (variant?.quantity || 1),  // ✅ Store max stock
            productType: product.productType,
            uniqueCode: product.uniqueCode,
            condition: product.condition || null
        }
        dispatch(addIntoCart(cartProduct))
        setIsAddedIntoCart(true)
        showToast('success', 'Product added to cart')
    }

    const handleImageError = (imageUrl) => setImageErrors(prev => ({ ...prev, [imageUrl]: true }))

    const getFirstSizeForColor = (color) => {
        const combo = validCombinations?.find(vc => vc.color === color)
        return combo?.size || sizes[0]
    }

    const getFirstColorForSize = (size) => {
        const combo = validCombinations?.find(vc => vc.size === size)
        return combo?.color || colors[0]
    }

    const measurements = product?.sizeChart?.measurements || null
    const sizeTable = product?.sizeChart?.sizeTable || null
    const plainDescription = decode(product?.description || '').replace(/<[^>]*>/g, '').trim()

    return (
        <div className="lg:px-32 px-4">
            {isProductLoading && (
                <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50">
                    <Image src={loadingSvg} width={80} height={80} alt="Loading" unoptimized />
                </div>
            )}

            <div className="my-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem><BreadcrumbLink href={WEBSITE_SHOP}>Shop</BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem><BreadcrumbPage className="line-clamp-1">{product?.name}</BreadcrumbPage></BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="md:flex justify-between items-start lg:gap-10 gap-5 mb-10">
                <div className="md:w-1/2 xl:flex xl:justify-center xl:gap-5 md:sticky md:top-20">
                    <div className="xl:order-last xl:mb-0 mb-5 xl:w-[calc(100%-144px)]">
                        {activeThumb && !imageErrors[activeThumb] ? (
                            <Image src={getImageUrl(activeThumb)} width={650} height={867} alt={product?.name || 'Product'} className="border rounded max-w-full object-cover" unoptimized={typeof activeThumb === 'string' && activeThumb?.startsWith('data:')} onError={() => handleImageError(activeThumb)} />
                        ) : (
                            <Image src={imgPlaceholder} width={650} height={867} alt="Placeholder" className="border rounded max-w-full object-cover" />
                        )}
                    </div>
                    {galleryImages.length > 1 && (
                        <div className="flex xl:flex-col items-center xl:gap-5 gap-3 xl:w-36 overflow-auto xl:pb-0 pb-2 max-h-[600px]">
                            {galleryImages.map((thumb, index) => {
                                const thumbUrl = thumb?.secure_url;
                                if (imageErrors[thumbUrl]) return null;
                                return (
                                    <Image key={thumb?._id || thumb?.public_id || `thumb-${index}`} src={getImageUrl(thumbUrl)} width={100} height={133} alt="thumbnail" className={`md:max-w-full max-w-16 rounded cursor-pointer object-cover ${thumbUrl === activeThumb ? 'border-2 border-[#E8B931]' : 'border'}`} onClick={() => handleThumb(thumbUrl)} unoptimized={typeof thumbUrl === 'string' && thumbUrl?.startsWith('data:')} onError={() => handleImageError(thumbUrl)} />
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="md:w-1/2 md:mt-0 mt-5">
                    <div className="mb-2">
                        {isThrift && <Badge className="bg-purple-100 text-purple-800">Thrift Item • Unique Piece</Badge>}
                        {isBrandNew && <Badge className="bg-blue-100 text-blue-800">Brand New</Badge>}
                    </div>
                    <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">{product?.name}</h1>
                    
                    <div className="flex items-center gap-3 mb-4">
                        {isBrandNew && variant ? (
                            <>
                                <span className="text-2xl font-semibold">{formatCurrency(variant.sellingPrice)}</span>
                                {variant.mrp > variant.sellingPrice && (
                                    <>
                                        <span className="text-lg line-through text-gray-400">{formatCurrency(variant.mrp)}</span>
                                        <span className="bg-red-500 rounded-full px-3 py-1 text-white text-xs">-{Math.round(((variant.mrp - variant.sellingPrice) / variant.mrp) * 100)}%</span>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <span className="text-2xl font-semibold">{formatCurrency(product?.sellingPrice)}</span>
                                {product?.mrp > product?.sellingPrice && <span className="text-lg line-through text-gray-400">{formatCurrency(product?.mrp)}</span>}
                            </>
                        )}
                    </div>

                    {product?.uniqueCode && <p className="text-sm text-gray-500 mb-4">SKU: {product.uniqueCode}</p>}

                    {isThrift && (measurements || sizeTable) && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-5">
                            <h4 className="font-semibold mb-2 flex items-center gap-2"><Ruler className="h-4 w-4" /> Measurements</h4>
                            {measurements ? <pre className="text-sm whitespace-pre-wrap font-sans text-gray-600">{measurements}</pre> : sizeTable ? (
                                <div className="grid grid-cols-5 gap-2 text-sm">
                                    <div className="font-medium">Size</div><div className="font-medium">Chest</div><div className="font-medium">Length</div><div className="font-medium">Shoulder</div><div className="font-medium">Sleeve</div>
                                    {sizeTable.slice(0, 1).map((row, i) => (<React.Fragment key={i}><div>{row.size}</div><div>{row.chest}</div><div>{row.length}</div><div>{row.shoulder}</div><div>{row.sleeve}</div></React.Fragment>))}
                                </div>
                            ) : null}
                            {sizeTable && <button onClick={() => setShowSizeChart(!showSizeChart)} className="text-[#E8B931] text-sm mt-2 underline">{showSizeChart ? 'Hide' : 'View'} full size chart</button>}
                        </div>
                    )}

                    {isBrandNew && colors && colors.length > 0 && (
                        <div className="mb-5">
                            <p className="font-medium mb-2">Color: <span className="font-normal">{variant?.color}</span></p>
                            <div className="flex gap-3 flex-wrap">
                                {colors.map((color, index) => {
                                    const targetSize = variant?.color === color ? variant?.size : getFirstSizeForColor(color)
                                    return (
                                        <Link key={`color-${color}-${index}`} onClick={() => setIsProductLoading(true)} href={`${WEBSITE_PRODUCT_DETAILS(product.slug)}?color=${encodeURIComponent(color)}&size=${encodeURIComponent(targetSize)}`} className={`border py-2 px-4 rounded-lg cursor-pointer hover:border-[#E8B931] transition-colors ${color === variant?.color ? 'border-[#E8B931] bg-[#E8B931] text-white' : 'border-gray-300'}`}>{color}</Link>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {isBrandNew && sizes && sizes.length > 0 && (
                        <div className="mb-5">
                            <p className="font-medium mb-2">Size: <span className="font-normal">{variant?.size}</span></p>
                            <div className="flex gap-3 flex-wrap">
                                {sizes.map((size, index) => {
                                    const targetColor = variant?.size === size ? variant?.color : getFirstColorForSize(size)
                                    return (
                                        <Link key={`size-${size}-${index}`} onClick={() => setIsProductLoading(true)} href={`${WEBSITE_PRODUCT_DETAILS(product.slug)}?color=${encodeURIComponent(targetColor)}&size=${encodeURIComponent(size)}`} className={`border py-2 px-4 rounded-lg cursor-pointer hover:border-[#E8B931] transition-colors ${size === variant?.size ? 'border-[#E8B931] bg-[#E8B931] text-white' : 'border-gray-300'}`}>{size}</Link>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {isThrift && (
                        <div className="mb-5">
                            {product?.condition && <p className="mb-2"><span className="font-medium">Condition:</span> <span className="capitalize">{getConditionDisplay(product.condition)}</span></p>}
                            {product?.status === 'active' && product?.quantity > 0 ? (
                                <div className="flex items-center gap-2 text-green-600"><CheckCircle className="h-5 w-5" /><span>In Stock • Only 1 available</span></div>
                            ) : (
                                <div className="flex items-center gap-2 text-red-600"><Package className="h-5 w-5" /><span>Sold Out</span></div>
                            )}
                        </div>
                    )}

                    {isBrandNew && variant && variant.quantity > 0 && (
                        <div className="mb-6">
                            <p className="font-medium mb-2">Quantity</p>
                            <div className="flex items-center h-10 border w-fit rounded-full">
                                <button type="button" className="h-full w-10 flex justify-center items-center disabled:opacity-50" onClick={() => handleQty('desc')} disabled={qty <= 1}><HiMinus /></button>
                                <input type="text" value={qty} className="w-14 text-center border-none outline-none" readOnly />
                                <button type="button" className="h-full w-10 flex justify-center items-center disabled:opacity-50" onClick={() => handleQty('inc')} disabled={qty >= (variant?.quantity || 10)}><HiPlus /></button>
                            </div>
                            {variant?.quantity < 10 && <p className="text-sm text-orange-500 mt-1">Only {variant.quantity} left in stock</p>}
                        </div>
                    )}

                    <div className="flex gap-3 mb-6">
                        {product?.status === 'active' && (isThrift ? product?.quantity > 0 : variant?.quantity > 0) ? (
                            !isAddedIntoCart ? (
                                <ButtonLoading type="button" text="Add To Cart" className="flex-1 rounded-full py-6 text-md cursor-pointer bg-[#E8B931] hover:bg-[#d4a520] text-black" onClick={handleAddToCart} />
                            ) : (
                                <Button className="flex-1 rounded-full py-6 text-md cursor-pointer bg-[#E8B931] hover:bg-[#d4a520] text-black" type="button" asChild><Link href={WEBSITE_CART}>Go To Cart</Link></Button>
                            )
                        ) : (
                            <Button disabled className="flex-1 rounded-full py-6 text-md">Sold Out</Button>
                        )}
                        <Button variant="outline" className="rounded-full px-4"><Share2 className="h-5 w-5" /></Button>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1"><Truck className="h-4 w-4" /><span>For fast delivery send your location</span></div>
            <div className="flex items-start gap-2 text-sm text-gray-600">
        <RotateCcw className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>NOTE: Only damaged or defective items can be returned. Unboxing video is required for proof.</span>
    </div>
                    </div>
                </div> 
            </div>

            {/* Variant Grid for Brand Products */}
            {isBrandNew && (
                <div className="mb-10">
                    <h2 className="text-2xl font-bold uppercase mb-6">Available Options</h2>
                    <VariantGrid productId={product?._id} currentVariantId={variant?._id} slug={product?.slug} allVariants={allVariants} />
                </div>
            )}

            {showSizeChart && sizeTable && (
                <div className="mb-10">
                    <Card><CardContent className="p-6">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Size Chart</h3><button onClick={() => setShowSizeChart(false)} className="text-gray-500">✕</button></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr className="border-b"><th className="py-2 text-left">Size</th><th className="py-2 text-left">Chest</th><th className="py-2 text-left">Length</th><th className="py-2 text-left">Shoulder</th><th className="py-2 text-left">Sleeve</th></tr></thead>
                                <tbody>{sizeTable.map((row, i) => <tr key={i} className="border-b"><td className="py-2">{row.size}</td><td className="py-2">{row.chest}</td><td className="py-2">{row.length}</td><td className="py-2">{row.shoulder}</td><td className="py-2">{row.sleeve}</td></tr>)}</tbody>
                            </table>
                        </div>
                    </CardContent></Card>
                </div>
            )}

            <div className="mb-10">
                <div className="border rounded-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b"><h2 className="font-semibold text-xl uppercase">Description</h2></div>
                    <div className="p-6"><div className="whitespace-pre-line">{plainDescription}</div></div>
                </div>
            </div>

            {/* ✅ Dynamic Shipping & Returns */}
            <ShippingReturns />

            {seller && (
                <div className="mb-10">
                    <h2 className="text-2xl font-bold uppercase text-center mb-6">FROM OUR SELLER</h2>
                    <div className="flex justify-center"><div className="max-w-md w-full"><SellerInfoBox seller={seller} /></div></div>
                </div>
            )}

            <SimilarProducts productId={product?._id} categoryId={product?.category?._id} productType={product?.productType} />
        </div>
    )
}

export default ProductDetails
