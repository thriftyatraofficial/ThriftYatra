'use client'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import { Button } from '@/components/ui/button'
import { WEBSITE_CHECKOUT, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP, WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { HiMinus, HiPlus } from "react-icons/hi2"
import { IoCloseCircleOutline } from "react-icons/io5"
import { decreaseQuantity, increaseQuantity, removeFromCart } from '@/store/reducer/cartReducer'
import { getImageUrl } from '@/lib/imageUtils'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

const breadCrumb = { title: 'Cart', links: [{ label: "Cart" }] }

const CartPage = () => {
    const dispatch = useDispatch()
    const cart = useSelector(store => store.cartStore)
    const auth = useSelector(store => store.authStore.auth)
    const router = useRouter()
    const [subtotal, setSubTotal] = useState(0)
    const [discount, setDiscount] = useState(0)

    useEffect(() => {
        const validProducts = (cart?.products || []).filter(p => p != null)
        const totalAmount = validProducts.reduce((sum, product) => sum + ((product?.sellingPrice || 0) * (product?.qty || 1)), 0)
        const totalDiscount = validProducts.reduce((sum, product) => sum + (((product?.mrp || 0) - (product?.sellingPrice || 0)) * (product?.qty || 1)), 0)
        setSubTotal(totalAmount)
        setDiscount(totalDiscount)
    }, [cart])

    const validProducts = (cart?.products || []).filter(p => p != null)

    const handleCheckout = () => {
        if (!auth) {
            router.push(`${WEBSITE_LOGIN}?callback=/checkout`)
        } else {
            router.push(WEBSITE_CHECKOUT)
        }
    }

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumb} />
            {!cart || cart.count === 0 ? (
                <div className='w-screen h-[500px] flex justify-center items-center py-32'>
                    <div className='text-center'>
                        <h4 className='text-4xl font-semibold mb-5'>Your cart is empty!</h4>
                        <Button type="button" asChild><Link href={WEBSITE_SHOP}>Continue Shopping</Link></Button>
                    </div>
                </div>
            ) : (
                <div className='flex lg:flex-nowrap flex-wrap gap-10 my-20 lg:px-32 px-4'>
                    <div className='lg:w-[70%] w-full'>
                        <table className='w-full border'>
                            <thead className='border-b bg-gray-50 md:table-header-group hidden'>
                                <tr>
                                    <th className='text-start p-3'>Product</th>
                                    <th className='text-center p-3'>Price</th>
                                    <th className='text-center p-3'>Quantity</th>
                                    <th className='text-center p-3'>Total</th>
                                    <th className='text-center p-3'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {validProducts.map(product => (
                                    <tr key={product.variantId || product.productId} className='md:table-row block border-b'>
                                        <td className='p-3'>
                                            <div className='flex items-center gap-5'>
                                                <Image src={getImageUrl(product.media)} width={60} height={60} alt={product.name} className='rounded object-cover' onError={(e) => { e.target.src = imgPlaceholder.src }} />
                                                <div>
                                                    <h4 className='text-lg font-medium line-clamp-1'>
                                                        <Link href={WEBSITE_PRODUCT_DETAILS(product.url)}>{product.name}</Link>
                                                    </h4>
                                                    {product.color && <p className='text-sm'>Color: {product.color}</p>}
                                                    {product.size && <p className='text-sm'>Size: {product.size}</p>}
                                                    {product.productType === 'thrift' && <Badge className='bg-purple-100 text-purple-800 text-xs'>Thrift</Badge>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className='md:table-cell flex justify-between md:p-3 px-3 pb-2 text-center'>
                                            <span className='md:hidden font-medium'>Price</span>
                                            <span>{(product.sellingPrice || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                        </td>
                                        <td className='md:table-cell flex justify-between md:p-3 px-3 pb-2'>
                                            <span className='md:hidden font-medium'>Quantity</span>
                                            <div className='flex justify-center'>
                                                <div className="flex justify-center items-center md:h-10 h-7 border w-fit rounded-full">
                                                    <button type="button" className="h-full w-10 flex justify-center items-center cursor-pointer disabled:opacity-50" 
                                                        onClick={() => dispatch(decreaseQuantity({ productId: product.productId, variantId: product.variantId }))}
                                                        disabled={product.productType === 'thrift' || product.qty <= 1}><HiMinus /></button>
                                                    <input type="text" value={product.qty} className="md:w-14 w-8 text-center border-none outline-offset-0" readOnly />
                                                    <button type="button" className="h-full w-10 flex justify-center items-center cursor-pointer disabled:opacity-50"
                                                        onClick={() => dispatch(increaseQuantity({ productId: product.productId, variantId: product.variantId }))}
                                                        disabled={product.productType === 'thrift'}><HiPlus /></button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='md:table-cell flex justify-between md:p-3 px-3 pb-2 text-center'>
                                            <span className='md:hidden font-medium'>Total</span>
                                            <span>{((product.sellingPrice || 0) * (product.qty || 1)).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                        </td>
                                        <td className='md:table-cell flex justify-between md:p-3 px-3 pb-2 text-center'>
                                            <span className='md:hidden font-medium'>Remove</span>
                                            <button type='button' onClick={() => dispatch(removeFromCart({ productId: product.productId, variantId: product.variantId }))} className='text-red-500'>
                                                <IoCloseCircleOutline />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className='lg:w-[30%] w-full'>
                        <div className='rounded bg-gray-50 p-5 sticky top-5'>
                            <h4 className='text-lg font-semibold mb-5'>Order Summary</h4>
                            <div>
                                <table className='w-full'>
                                    <tbody>
                                        <tr><td className='font-medium py-2'>Subtotal</td><td className='text-end py-2'>{subtotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td></tr>
                                        <tr><td className='font-medium py-2 text-green-600'>Discount</td><td className='text-end py-2 text-green-600'>-{discount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td></tr>
                                        <tr className='border-t'><td className='font-medium py-2'>Total</td><td className='text-end py-2 font-bold'>{subtotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td></tr>
                                    </tbody>
                                </table>
                                <Button type="button" onClick={handleCheckout} className="w-full bg-black rounded-full mt-5 mb-3 text-white">
                                    Proceed to Checkout
                                </Button>
                                <p className='text-center'><Link href={WEBSITE_SHOP} className='hover:underline text-sm'>Continue Shopping</Link></p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CartPage