'use client'
import ButtonLoading from '@/components/Application/ButtonLoading'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { showToast } from '@/lib/showToast'
import { WEBSITE_SHOP, WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import { clearCart } from '@/store/reducer/cartReducer'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { z } from 'zod'
import { FaShippingFast } from "react-icons/fa"
import { Textarea } from '@/components/ui/textarea'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { CreditCard, Loader2 } from 'lucide-react'
import loading from '@/public/assets/images/loading.svg'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { getImageUrl } from '@/lib/imageUtils'

const breadCrumb = { title: 'Checkout', links: [{ label: "Checkout" }] }

const Checkout = () => {
    const router = useRouter()
    const dispatch = useDispatch()
    const cart = useSelector(store => store.cartStore)
    const auth = useSelector(store => store.authStore.auth)
    const [step, setStep] = useState(1)
    const [savingOrder, setSavingOrder] = useState(false)
    const [placingOrder, setPlacingOrder] = useState(false)
    const [subtotal, setSubTotal] = useState(0)
    const [discount, setDiscount] = useState(0)
    const [totalAmount, setTotalAmount] = useState(0)
    const [codEnabled, setCodEnabled] = useState(true)
    const [codFee, setCodFee] = useState(49)
    const [codFreeAbove, setCodFreeAbove] = useState(999)
    const [paymentMethod, setPaymentMethod] = useState('online')
    const [pincodeLoading, setPincodeLoading] = useState(false)
    const [pincodeError, setPincodeError] = useState('')
    const [acceptPolicy, setAcceptPolicy] = useState(false)

    const validProducts = (cart.products || []).filter(p => p != null)

    useEffect(() => {
        if (!auth) { router.push(`${WEBSITE_LOGIN}?callback=/checkout`); return }
        fetchCODSettings()
    }, [auth])

    useEffect(() => {
        const s = validProducts.reduce((sum, p) => sum + ((p.sellingPrice || 0) * (p.qty || 1)), 0)
        const d = validProducts.reduce((sum, p) => sum + (((p.mrp || 0) - (p.sellingPrice || 0)) * (p.qty || 1)), 0)
        setSubTotal(s); setDiscount(d)
        const codExtra = (paymentMethod === 'cod' && codFee && s < codFreeAbove) ? codFee : 0
        setTotalAmount(s + codExtra)
    }, [cart, paymentMethod, codFee, codFreeAbove])

    const fetchCODSettings = async () => {
        try {
            const { data } = await axios.get('/api/admin/settings?type=cod')
            if (data.success && data.data) {
                setCodEnabled(data.data.data?.enabled ?? true)
                setCodFee(data.data.data?.fee ?? 49)
                setCodFreeAbove(data.data.data?.freeAbove ?? 999)
            }
        } catch (e) {}
    }

    const addressSchema = z.object({
        name: z.string().min(2, 'Name required'),
        email: z.string().email('Valid email required for order updates').optional().or(z.literal('')),
        phone: z.string().length(10, 'Valid 10-digit number required'),
        altPhone: z.string().optional().refine(val => !val || val.length === 10, { message: 'Valid 10-digit number' }),
        pincode: z.string().length(6, 'Valid pincode required'),
        city: z.string().min(1, 'City required'),
        state: z.string().min(1, 'State required'),
        landmark: z.string().min(3, 'Landmark required'),
        address: z.string().min(10, 'Full address required'),
        ordernote: z.string().optional().default(''),
    })

    const addressForm = useForm({
        resolver: zodResolver(addressSchema),
        defaultValues: { name: '', email: auth?.email || '', phone: auth?.phone || '', altPhone: '', pincode: '', city: '', state: '', landmark: '', address: '', ordernote: '' }
    })

    useEffect(() => {
        if (auth?.phone && !addressForm.getValues('phone')) addressForm.setValue('phone', auth.phone)
        if (auth?.email && !addressForm.getValues('email')) addressForm.setValue('email', auth.email)
    }, [auth])

    const handlePincodeChange = async (e) => {
        const pincode = e.target.value.replace(/[^0-9]/g, '')
        addressForm.setValue('pincode', pincode)
        if (pincode.length === 6) {
            setPincodeLoading(true); setPincodeError('')
            try {
                const res = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`)
                if (res.data[0]?.Status === 'Success') {
                    addressForm.setValue('city', res.data[0].PostOffice[0].District || '')
                    addressForm.setValue('state', res.data[0].PostOffice[0].State || '')
                } else { setPincodeError('Invalid pincode') }
            } catch { setPincodeError('Could not verify') }
            finally { setPincodeLoading(false) }
        }
    }

    const handleAddressSubmit = () => {
        const vals = addressForm.getValues()
        if (!vals.name || !vals.phone || !vals.pincode || !vals.city || !vals.landmark || !vals.address) {
            showToast('error', 'Please fill all required fields'); return
        }
        setStep(2)
    }

    // ✅ Get auth token for API calls
    const placeOrder = async () => {
        if (!acceptPolicy) { showToast('error', 'Please accept the return policy'); return }
        setPlacingOrder(true)
        try {
            const formData = addressForm.getValues()
            const products = validProducts.map(p => ({
                productId: p.productId,
                variantId: p.variantId || null,
                sellerId: p.sellerId?._id || p.sellerId?.toString() || null,
                name: p.name,
                qty: p.qty || 1,
                mrp: p.mrp || p.sellingPrice,
                sellingPrice: p.sellingPrice
            }))

            if (paymentMethod === 'cod') {
                const { data } = await axios.post('/api/payment/save-order', {
                    ...formData, country: 'India', products,
                    subtotal, discount, couponDiscountAmount: 0, totalAmount,
                    paymentMethod: 'cod',
                    codFee: (paymentMethod === 'cod' && subtotal < codFreeAbove) ? codFee : 0
                })
                
                if (data.success) {
                    dispatch(clearCart())
                    window.location.href = `/order-confirmation/${data.data.orderId}`
                } else { showToast('error', data.message || 'Order failed') }
            } else {
                const { data: orderIdData } = await axios.post('/api/payment/get-order-id', { amount: totalAmount })
                if (!orderIdData.success) throw new Error(orderIdData.message)

                const rzp = new Razorpay({
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: totalAmount * 100, currency: 'INR',
                    name: 'ThriftYatra', description: 'Order Payment',
                    image: '/assets/images/logo-black.png', order_id: orderIdData.data,
                    handler: async function (response) {
                        setSavingOrder(true)
                        const { data: saveData } = await axios.post('/api/payment/save-order', {
                            ...formData, country: 'India',
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            products, subtotal, discount, couponDiscountAmount: 0, totalAmount,
                            paymentMethod: 'online'
                        })
                        
                        if (saveData.success) {
                            dispatch(clearCart())
                            window.location.href = `/order-confirmation/${saveData.data.orderId}`
                        } else { showToast('error', saveData.message || 'Payment failed') }
                        setSavingOrder(false)
                    },
                    prefill: { name: formData.name, contact: formData.phone, email: formData.email || '' },
                    theme: { color: '#E8B931' },
                    modal: { ondismiss: function () { showToast('info', 'Payment cancelled') } }
                })
                rzp.on('payment.failed', (r) => showToast('error', r.error.description || 'Payment failed'))
                rzp.open()
            }
        } catch (e) { showToast('error', e.response?.data?.message || e.message || 'Something went wrong') }
        finally { setPlacingOrder(false) }
    }

    if (!auth) return null
    if (cart.count === 0) return (
        <div className='flex justify-center items-center h-[400px]'>
            <div className='text-center'><h1 className='text-2xl font-bold mb-4'>Your cart is empty!</h1><Link href={WEBSITE_SHOP}><Button>Continue Shopping</Button></Link></div>
        </div>
    )

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumb} />
            {savingOrder && (
                <div className='fixed inset-0 z-50 bg-black/10 flex items-center justify-center'>
                    <div className='text-center'><Image src={loading.src} height={80} width={80} alt='Loading' /><p className='font-semibold mt-2'>Confirming Order...</p></div>
                </div>
            )}

            <div className='flex lg:flex-nowrap flex-wrap gap-10 my-10 lg:px-32 px-4'>
                <div className='lg:w-[60%] w-full'>
                    <div className='flex items-center gap-2 mb-8'>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-[#E8B931] text-black' : 'bg-gray-300'}`}>1</div>
                        <span className={step >= 1 ? 'font-semibold' : 'text-gray-400'}>Address</span>
                        <div className='flex-1 h-0.5 bg-gray-300 mx-2'><div className={`h-full transition-all ${step >= 2 ? 'bg-[#E8B931] w-full' : 'bg-gray-300 w-0'}`} /></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-[#E8B931] text-black' : 'bg-gray-300'}`}>2</div>
                        <span className={step >= 2 ? 'font-semibold' : 'text-gray-400'}>Payment</span>
                    </div>

                    {step === 1 && (
                        <div>
                            <h2 className='text-xl font-bold mb-4'><FaShippingFast className="text-[#E8B931] inline mr-2" />Shipping Address</h2>
                            <Form {...addressForm}>
                                <form className='space-y-4' onSubmit={(e) => { e.preventDefault(); handleAddressSubmit() }}>
                                    <FormField control={addressForm.control} name='name' render={({ field }) => <FormItem><FormControl><Input placeholder="Full Name *" {...field} className='h-12' /></FormControl><FormMessage /></FormItem>} />
                                    <FormField control={addressForm.control} name='email' render={({ field }) => (
                                        <FormItem><FormControl><Input type="email" placeholder="Email for order updates" {...field} className='h-12' /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={addressForm.control} name='phone' render={({ field }) => (
                                        <FormItem><FormControl><Input type="tel" placeholder="Phone Number *" maxLength={10} {...field} onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ''))} className='h-12' /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={addressForm.control} name='altPhone' render={({ field }) => (
                                        <FormItem><FormControl><Input type="tel" placeholder="Alternative Phone (Optional)" maxLength={10} {...field} onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ''))} className='h-12' /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={addressForm.control} name='pincode' render={({ field }) => (
                                        <FormItem><FormControl><div className='relative'><Input placeholder="Pincode *" maxLength={6} {...field} onChange={handlePincodeChange} className='h-12 pr-10' />{pincodeLoading && <Loader2 className='absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-gray-400' />}</div></FormControl>{pincodeError && <p className='text-red-500 text-xs'>{pincodeError}</p>}<FormMessage /></FormItem>
                                    )} />
                                    <div className='grid grid-cols-2 gap-4'>
                                        <FormField control={addressForm.control} name='city' render={({ field }) => <FormItem><FormControl><Input placeholder="City *" {...field} className='h-12 bg-gray-50' /></FormControl><FormMessage /></FormItem>} />
                                        <FormField control={addressForm.control} name='state' render={({ field }) => <FormItem><FormControl><Input placeholder="State *" {...field} className='h-12 bg-gray-50' /></FormControl><FormMessage /></FormItem>} />
                                    </div>
                                    <FormField control={addressForm.control} name='address' render={({ field }) => <FormItem><FormControl><Textarea placeholder="Full Address *" {...field} rows={2} /></FormControl><FormMessage /></FormItem>} />
                                    <FormField control={addressForm.control} name='landmark' render={({ field }) => <FormItem><FormControl><Input placeholder="Landmark *" {...field} className='h-12' /></FormControl><FormMessage /></FormItem>} />
                                    <FormField control={addressForm.control} name='ordernote' render={({ field }) => <FormItem><FormControl><Textarea placeholder="Order note (Optional)" {...field} rows={2} /></FormControl></FormItem>} />
                                    <Button type="submit" className='w-full bg-[#E8B931] hover:bg-[#d4a520] text-black h-12 text-lg font-semibold rounded-full'>Continue to Payment</Button>
                                </form>
                            </Form>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <h2 className='text-xl font-bold mb-4'><CreditCard className="text-[#E8B931] inline mr-2" />Payment Method</h2>
                            <div className='space-y-3 mb-6'>
                                <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${paymentMethod === 'online' ? 'border-[#E8B931] bg-yellow-50' : ''}`}>
                                    <input type="radio" name="payment" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="accent-[#E8B931]" />
                                    <div><p className='font-semibold'>Pay Online</p><p className='text-sm text-gray-500'>UPI, Cards, Netbanking</p></div>
                                </label>
                                {codEnabled && (
                                    <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${paymentMethod === 'cod' ? 'border-[#E8B931] bg-yellow-50' : ''}`}>
                                        <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-[#E8B931]" />
                                        <div><p className='font-semibold'>Cash on Delivery</p><p className='text-sm text-gray-500'>{subtotal >= codFreeAbove ? 'No extra fee' : `+₹${codFee} COD fee`}</p></div>
                                    </label>
                                )}
                            </div>
                            <label className="flex items-start gap-3 p-4 border rounded-lg bg-yellow-50 cursor-pointer mb-6">
                                <input type="checkbox" checked={acceptPolicy} onChange={(e) => setAcceptPolicy(e.target.checked)} className="mt-1 accent-[#E8B931]" />
                                <span className="text-sm">I agree to <Link href="/return-policy" target="_blank" className="text-[#E8B931] underline">Return Policy</Link> and <Link href="/shipping-policy" target="_blank" className="text-[#E8B931] underline">Shipping Policy</Link></span>
                            </label>
                            <div className='flex gap-3'>
                                <Button variant="outline" onClick={() => setStep(1)} className='flex-1 rounded-full'>Back</Button>
                                <ButtonLoading type="button" onClick={placeOrder} loading={placingOrder} text={paymentMethod === 'cod' ? 'Place COD Order' : `Pay ₹${totalAmount.toLocaleString('en-IN')}`} className='flex-1 bg-[#E8B931] hover:bg-[#d4a520] text-black h-12 rounded-full' disabled={!acceptPolicy} />
                            </div>
                        </div>
                    )}
                </div>

                <div className='lg:w-[40%] w-full'>
                    <div className='rounded bg-gray-50 p-5 sticky top-5'>
                        <h4 className='text-lg font-semibold mb-4'>Order Summary ({validProducts.length} items)</h4>
                        <div className='max-h-[300px] overflow-auto mb-4'>
                            {validProducts.map((p, i) => (
                                <div key={p.variantId || i} className='flex items-center gap-3 py-3 border-b last:border-0'>
                                    <Image src={getImageUrl(p.media)} width={50} height={50} alt={p.name} className='rounded object-cover flex-shrink-0' onError={(e) => { e.target.src = imgPlaceholder.src }} />
                                    <div className='flex-1 min-w-0'><p className='text-sm font-medium line-clamp-1'>{p.name}</p><p className='text-xs text-gray-500'>Qty: {p.qty} | {p.size}/{p.color}</p></div>
                                    <p className='text-sm font-semibold'>₹{((p.sellingPrice || 0) * (p.qty || 1)).toLocaleString('en-IN')}</p>
                                </div>
                            ))}
                        </div>
                        <div className='space-y-2 text-sm'>
                            <div className='flex justify-between'><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                            {discount > 0 && <div className='flex justify-between text-green-600'><span>Discount</span><span>-₹{discount.toLocaleString('en-IN')}</span></div>}
                            {paymentMethod === 'cod' && codFee && subtotal < codFreeAbove && <div className='flex justify-between text-orange-600'><span>COD Fee</span><span>₹{codFee}</span></div>}
                            <div className='flex justify-between font-bold text-lg border-t pt-2'><span>Total</span><span className='text-[#E8B931]'>₹{totalAmount.toLocaleString('en-IN')}</span></div>
                        </div>
                    </div>
                </div>
            </div>
            <Script src='https://checkout.razorpay.com/v1/checkout.js' />
        </div>
    )
}

export default Checkout
