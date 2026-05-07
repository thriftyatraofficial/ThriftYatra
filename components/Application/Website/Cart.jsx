'use client'
import { BsCart2 } from "react-icons/bs";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { removeFromCart } from "@/store/reducer/cartReducer";
import Link from "next/link";
import { WEBSITE_CART, WEBSITE_CHECKOUT } from "@/routes/WebsiteRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { showToast } from "@/lib/showToast";
import { formatCurrency } from "@/lib/utils";
import { getImageUrl } from '@/lib/imageUtils'

const Cart = () => {
    const [open, setOpen] = useState(false)
    const [subtotal, setSubTotal] = useState(0)
    const [discount, setDiscount] = useState(0)

    const cart = useSelector(store => store.cartStore)
    const dispatch = useDispatch()

    // Filter out any null/undefined products
    const validCartProducts = cart?.products?.filter(product => 
        product != null && product.productId != null
    ) || []

    useEffect(() => {
        const totalAmount = validCartProducts.reduce((sum, product) => {
            const price = product?.sellingPrice || 0
            const qty = product?.qty || 1
            return sum + (price * qty)
        }, 0)

        const totalDiscount = validCartProducts.reduce((sum, product) => {
            const mrp = product?.mrp || 0
            const sellingPrice = product?.sellingPrice || 0
            const qty = product?.qty || 1
            return sum + ((mrp - sellingPrice) * qty)
        }, 0)

        setSubTotal(totalAmount)
        setDiscount(totalDiscount)
    }, [cart])

    const handleRemoveItem = (productId, variantId) => {
        dispatch(removeFromCart({ productId, variantId }))
        showToast('success', 'Item removed from cart')
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="relative">
                <BsCart2 size={25} className="text-gray-500 hover:text-primary" />
                <span className="absolute bg-red-500 text-white text-xs rounded-full w-4 h-4 flex justify-center items-center -right-2 -top-1">
                    {cart?.count || 0}
                </span>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[450px] w-full">
                <SheetHeader className='py-2'>
                    <SheetTitle className="text-2xl">My Cart</SheetTitle>
                    <SheetDescription></SheetDescription>
                </SheetHeader>

                <div className="h-[calc(100vh-40px)] pb-10">
                    <div className="h-[calc(100%-128px)] overflow-auto px-2">
                        {validCartProducts.length === 0 && (
                            <div className="h-full flex justify-center items-center text-xl font-semibold text-gray-500">
                                Your Cart Is Empty.
                            </div>
                        )}

                        {validCartProducts.map((product, index) => {
                            const isThrift = product?.productType === 'thrift'
                            const imageUrl = getImageUrl(
                                product?.media ||
                                product?.imageUrl ||
                                product?.base64Media?.[0]?.secure_url ||
                                product?.base64Media?.[0]
                            )
                            const uniqueKey = `${product?.productId}-${product?.variantId || 'novariant'}-${index}`

                            return (
                                <div key={uniqueKey} className="flex justify-between items-start gap-3 mb-4 border-b pb-4">
                                    <div className="flex gap-3 items-start flex-1">
                                        <Image
                                            src={imageUrl}
                                            height={80}
                                            width={80}
                                            alt={product?.name || 'Product'}
                                            className="w-20 h-20 rounded border object-cover"
                                            onError={(e) => {
                                                e.target.src = imgPlaceholder.src
                                            }}
                                        />

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-base font-medium line-clamp-1">
                                                    {product?.name || 'Product'}
                                                </h4>
                                                {isThrift && (
                                                    <Badge className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0">
                                                        ♻️ Thrift
                                                    </Badge>
                                                )}
                                            </div>

                                            {!isThrift && (product?.size || product?.color) && (
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {product.size && `Size: ${product.size}`}
                                                    {product.size && product.color && ' / '}
                                                    {product.color && `Color: ${product.color}`}
                                                </p>
                                            )}

                                            {isThrift && product?.condition && (
                                                <p className="text-xs text-gray-500 mb-1 capitalize">
                                                    Condition: {product.condition.replace('_', ' ')}
                                                </p>
                                            )}

                                            {product?.uniqueCode && (
                                                <p className="text-[10px] text-gray-400">
                                                    SKU: {product.uniqueCode}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right flex-shrink-0">
                                        <button
                                            type="button"
                                            className="text-red-500 text-xs underline underline-offset-1 mb-2 cursor-pointer hover:text-red-700"
                                            onClick={() => handleRemoveItem(product.productId, product.variantId)}
                                        >
                                            Remove
                                        </button>

                                        <p className="font-semibold text-sm whitespace-nowrap">
                                            {product?.qty || 1} × {formatCurrency(product?.sellingPrice || 0)}
                                        </p>

                                        {product?.mrp && product.mrp > (product?.sellingPrice || 0) && (
                                            <p className="text-xs text-gray-400 line-through">
                                                {formatCurrency(product.mrp)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    
                    <div className="h-32 border-t pt-5 px-2">
                        <h2 className="flex justify-between items-center text-lg font-semibold">
                            <span>Subtotal</span> 
                            <span>{formatCurrency(subtotal)}</span>
                        </h2>
                        
                        {discount > 0 && (
                            <h2 className="flex justify-between items-center text-sm text-green-600">
                                <span>You Save</span> 
                                <span>{formatCurrency(discount)}</span>
                            </h2>
                        )}

                        <div className="flex justify-between mt-3 gap-3">
                            <Button 
                                type="button" 
                                asChild 
                                variant="secondary" 
                                className="flex-1"
                                onClick={() => setOpen(false)}
                            >
                                <Link href={WEBSITE_CART}>View Cart</Link>
                            </Button>
                            
                            <Button 
                                type="button" 
                                asChild 
                                className="flex-1 bg-[#E8B931] hover:bg-[#d4a520] text-black"
                                onClick={() => setOpen(false)}
                                disabled={validCartProducts.length === 0}
                            >
                                {validCartProducts.length > 0 ? (
                                    <Link href={WEBSITE_CHECKOUT}>Checkout</Link>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={() => showToast('error', 'Your cart is empty!')}
                                    >
                                        Checkout
                                    </button>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default Cart