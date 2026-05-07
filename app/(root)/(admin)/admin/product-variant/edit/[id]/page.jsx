'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { useRouter, useParams } from 'next/navigation'
import ButtonLoading from '@/components/Application/ButtonLoading'
import MobileImageUploader from '@/components/Application/MobileImageUploader'

const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '28', '30', '32', '34', '36', '38', '40', '42', '44']
const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Grey', 'Brown', 'Navy', 'Beige']

const variantSchema = z.object({
    size: z.string().min(1, 'Size is required'),
    color: z.string().min(1, 'Color is required'),
    mrp: z.number().min(1, 'MRP is required').or(z.string().transform(val => Number(val))),
    sellingPrice: z.number().min(1, 'Selling price is required').or(z.string().transform(val => Number(val))),
    quantity: z.number().min(0, 'Quantity is required').or(z.string().transform(val => Number(val))),
    sku: z.string().min(3, 'SKU is required'),
    media: z.array(z.any()).optional(),
})

const EditVariantPage = () => {
    const router = useRouter()
    const params = useParams()
    const variantId = params.id
    const [loading, setLoading] = useState(false)
    const [fetchLoading, setFetchLoading] = useState(true)
    const [formError, setFormError] = useState(null)
    const [product, setProduct] = useState(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        control,
        watch,
        trigger,
        reset,
    } = useForm({
        resolver: zodResolver(variantSchema),
        defaultValues: {
            media: [],
            size: '',
            color: '',
            mrp: '',
            sellingPrice: '',
            quantity: '',
            sku: '',
        },
        mode: 'onChange'
    })

    useEffect(() => {
        fetchVariant()
    }, [variantId])

    const fetchVariant = async () => {
        try {
            setFetchLoading(true)
            const { data } = await axios.get(`/api/product-variant/get/${variantId}`)
            if (data.success) {
                const variant = data.data
                reset({
                    size: variant.size,
                    color: variant.color,
                    mrp: variant.mrp,
                    sellingPrice: variant.sellingPrice,
                    quantity: variant.quantity,
                    sku: variant.sku,
                    media: variant.media || [],
                })
                setProduct(variant.product)
            } else {
                showToast('error', 'Variant not found')
                router.push('/admin/product-variant')
            }
        } catch (error) {
            showToast('error', 'Failed to load variant')
            router.push('/admin/product-variant')
        } finally {
            setFetchLoading(false)
        }
    }

    const onSubmit = async (data) => {
        try {
            setLoading(true)
            setFormError(null)

            const formattedMedia = data.media?.map(item => ({
                _id: item._id || `img_${Date.now()}`,
                secure_url: item.secure_url,
                public_id: item.public_id || `variant_${Date.now()}`,
                alt: item.alt || `${product?.name} - ${data.color}`,
                isBase64: true
            })) || []

            const payload = {
                ...data,
                media: formattedMedia,
                discountPercentage: Math.round(((data.mrp - data.sellingPrice) / data.mrp) * 100)
            }

            const response = await axios.put(`/api/product-variant?id=${variantId}`, payload)

            if (response.data.success) {
                showToast('success', 'Variant updated successfully')
                router.push('/admin/product-variant')
            } else {
                throw new Error(response.data.message || 'Failed to update variant')
            }
        } catch (error) {
            console.error('Submit error:', error)
            const errorMsg = error.response?.data?.message || error.message || 'Failed to update variant'
            setFormError(errorMsg)
            showToast('error', errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const generateSKU = () => {
        const sizeCode = watch('size') || 'XX'
        const colorCode = (watch('color') || 'XXX').substring(0, 3).toUpperCase()
        const prefix = product?.uniqueCode || 'VAR'
        setValue('sku', `${prefix}-${sizeCode}-${colorCode}`)
    }

    if (fetchLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading variant...</p>
                </div>
            </div>
        )
    }

    const mrpValue = watch('mrp')
    const sellingPriceValue = watch('sellingPrice')
    const sizeValue = watch('size')
    const colorValue = watch('color')
    const skuValue = watch('sku')
    const quantityValue = watch('quantity')

    const isFormValid = sizeValue && colorValue && Number(mrpValue) >= 1 && Number(sellingPriceValue) >= 1 && skuValue?.length >= 3

    return (
        <div className='w-full max-w-2xl mx-auto'>
            <Card>
                <CardHeader>
                    <h1 className='text-2xl font-bold'>Edit Variant</h1>
                    <p className='text-gray-500'>Update product variant details</p>
                    {product && <p className='text-sm text-gray-500 mt-1'>Product: {product.name}</p>}
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                        {formError && (
                            <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm'>
                                {formError}
                            </div>
                        )}

                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <Label>Size <span className='text-red-500'>*</span></Label>
                                <Select value={sizeValue} onValueChange={(v) => setValue('size', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                                    <SelectContent>{sizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                                {errors.size && <p className='text-red-500 text-sm mt-1'>{errors.size.message}</p>}
                            </div>
                            <div>
                                <Label>Color <span className='text-red-500'>*</span></Label>
                                <Select value={colorValue} onValueChange={(v) => setValue('color', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                                    <SelectContent>{colors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                                {errors.color && <p className='text-red-500 text-sm mt-1'>{errors.color.message}</p>}
                            </div>
                        </div>

                        <div>
                            <Label>SKU <span className='text-red-500'>*</span></Label>
                            <div className='flex gap-2'>
                                <Input {...register('sku')} placeholder="Variant SKU" />
                                <Button type="button" variant="outline" onClick={generateSKU}>Generate</Button>
                            </div>
                            {errors.sku && <p className='text-red-500 text-sm mt-1'>{errors.sku.message}</p>}
                        </div>

                        <div className='grid grid-cols-3 gap-4'>
                            <div>
                                <Label>MRP (₹) <span className='text-red-500'>*</span></Label>
                                <Input type="number" {...register('mrp')} />
                                {errors.mrp && <p className='text-red-500 text-sm mt-1'>{errors.mrp.message}</p>}
                            </div>
                            <div>
                                <Label>Selling Price (₹) <span className='text-red-500'>*</span></Label>
                                <Input type="number" {...register('sellingPrice')} />
                                {errors.sellingPrice && <p className='text-red-500 text-sm mt-1'>{errors.sellingPrice.message}</p>}
                            </div>
                            <div>
                                <Label>Stock Quantity</Label>
                                <Input type="number" {...register('quantity')} min="0" />
                                {errors.quantity && <p className='text-red-500 text-sm mt-1'>{errors.quantity.message}</p>}
                            </div>
                        </div>

                        {mrpValue && sellingPriceValue && Number(mrpValue) > Number(sellingPriceValue) && (
                            <div className='bg-green-50 p-3 rounded-lg'>
                                <p className='text-sm'>Discount: {Math.round(((mrpValue - sellingPriceValue) / mrpValue) * 100)}% off</p>
                            </div>
                        )}

                        <div>
                            <Label>Variant Images (Optional)</Label>
                            <Controller
                                name="media"
                                control={control}
                                render={({ field }) => (
                                    <MobileImageUploader
                                        value={field.value || []}
                                        onChange={(newMedia) => { field.onChange(newMedia); trigger('media') }}
                                        maxFiles={3}
                                    />
                                )}
                            />
                        </div>

                        <div className='flex gap-3 pt-4'>
                            <ButtonLoading
                                loading={loading}
                                type="submit"
                                text={isFormValid ? "Update Variant" : "Complete Required Fields"}
                                className="flex-1"
                                disabled={!isFormValid || loading}
                            />
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default EditVariantPage