'use client'
import { Card, CardContent } from '@/components/ui/card'
import React, { useState } from 'react'
import Logo from '@/public/assets/images/logo-black.png'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from 'zod'
import ButtonLoading from '@/components/Application/ButtonLoading'
import Link from 'next/link'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const RegisterSellerPage = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const formSchema = z.object({
        name: z.string().min(2, 'Name required'),
        email: z.string().email('Invalid email'),
        password: z.string().min(6, 'Password must be 6+ characters'),
        phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit number required'),
        sellerType: z.enum(['thrift_seller', 'brand_seller']),
        storeName: z.string().min(3, 'Store name required'),
        storeDescription: z.string().optional()
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "", email: "", password: "", phone: "", 
            sellerType: "thrift_seller", storeName: "", storeDescription: ""
        },
    })

    const onSubmit = async (values) => {
        try {
            setLoading(true)
            const { data } = await axios.post('/api/auth/register-seller', values)
            if (!data.success) throw new Error(data.message)
            showToast('success', 'Seller account created! Please login.')
            router.push('/auth/login')
        } catch (error) {
            showToast('error', error.response?.data?.message || error.message)
        } finally { setLoading(false) }
    }

    const sellerType = form.watch('sellerType')

    return (
        <Card className="w-[500px] max-w-full">
            <CardContent className="pt-6">
                <div className='flex justify-center'>
                    <Image src={Logo.src} width={Logo.width} height={Logo.height} alt='ThriftYatra' className='max-w-[150px]' />
                </div>
                <div className='text-center mt-4'>
                    <h1 className='text-3xl font-bold'>Become a Seller</h1>
                    <p className='text-gray-500'>Join ThriftYatra and start selling today!</p>
                </div>
                <div className='mt-5'>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                        <div><Label>Full Name *</Label><Input {...form.register('name')} placeholder="Enter your full name" /></div>
                        <div><Label>Email *</Label><Input {...form.register('email')} type="email" placeholder="Enter your email" /></div>
                        <div><Label>Password *</Label><Input {...form.register('password')} type="password" placeholder="Min 6 characters" /></div>
                        <div><Label>Phone Number * (for delivery pickup)</Label><Input {...form.register('phone')} maxLength={10} placeholder="10-digit number" /></div>
                        <div>
                            <Label>What do you want to sell? *</Label>
                            <Select onValueChange={(v) => form.setValue('sellerType', v)} defaultValue="thrift_seller">
                                <SelectTrigger><SelectValue placeholder="Select seller type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="thrift_seller">Thrift Items (Pre-owned/Unique)</SelectItem>
                                    <SelectItem value="brand_seller">Brand New Items (With Variants)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div><Label>Store Name *</Label><Input {...form.register('storeName')} placeholder="Enter your store name" /></div>
                        <div><Label>Store Description (Optional)</Label><Textarea {...form.register('storeDescription')} placeholder="Tell customers about your store..." rows={3} /></div>
                        
                        {sellerType === 'thrift_seller' && (
                            <div className='p-3 bg-blue-50 rounded-lg'><p className='text-sm text-blue-800'><strong>Thrift Seller:</strong> Sell unique, pre-owned items. Each item has quantity 1.</p></div>
                        )}
                        {sellerType === 'brand_seller' && (
                            <div className='p-3 bg-green-50 rounded-lg'><p className='text-sm text-green-800'><strong>Brand Seller:</strong> Sell new items with multiple quantities and size/color variants.</p></div>
                        )}

                        <ButtonLoading loading={loading} type="submit" text="Register as Seller" className="w-full" />
                        <div className='text-center'>
                            <p className='text-gray-600'>Already have an account? <Link href="/auth/login" className='text-primary underline'>Login</Link></p>
                        </div>
                    </form>
                </div>
            </CardContent>
        </Card>
    )
}

export default RegisterSellerPage