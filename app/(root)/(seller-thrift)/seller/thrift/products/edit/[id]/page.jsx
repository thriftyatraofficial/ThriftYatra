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
import SizeChartBuilder from '@/components/Application/SizeChartBuilder'
import { productCondition } from '@/lib/utils'
import Editor from '@/components/Application/Admin/Editor'
import slugify from 'slugify'

const productSchema = z.object({
    name: z.string().min(3, 'Product name is required'),
    category: z.string().min(1, 'Category is required'),
    sellingPrice: z.number().min(1, 'Selling price is required').or(z.string().transform(val => Number(val))),
    condition: z.enum(['like_new', 'excellent', 'good', 'fair']),
    media: z.array(z.any()).min(1, 'At least one image is required'),
    uniqueCode: z.string().min(3, 'SKU/Unique Code is required'),
})

const EditThriftProduct = () => {
    const router = useRouter()
    const params = useParams()
    const productId = params.id
    const [loading, setLoading] = useState(false)
    const [fetchLoading, setFetchLoading] = useState(true)
    const [formError, setFormError] = useState(null)
    const [categories, setCategories] = useState([])
    const [description, setDescription] = useState('')
    const [sizeChart, setSizeChart] = useState(null)

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
        resolver: zodResolver(productSchema),
        defaultValues: {
            media: [],
            name: '',
            category: '',
            sellingPrice: '',
            condition: undefined,
            uniqueCode: '',
        },
    })

    useEffect(() => {
        fetchCategories()
        fetchProduct()
    }, [productId])

    const fetchCategories = async () => {
        try {
            const { data } = await axios.get('/api/category/get-category')
            if (data.success) {
                setCategories(data.data)
            }
        } catch (error) {
            showToast('error', 'Failed to load categories')
        }
    }

    const fetchProduct = async () => {
        try {
            setFetchLoading(true)
            const { data } = await axios.get(`/api/seller/products/${productId}`)
            if (data.success) {
                const product = data.data.product
                reset({
                    name: product.name,
                    category: product.category?._id || product.category,
                    sellingPrice: product.sellingPrice,
                    condition: product.condition,
                    uniqueCode: product.uniqueCode,
                    media: product.base64Media || product.media || [],
                })
                setDescription(product.description || '')
                setSizeChart(product.sizeChart || null)
            } else {
                showToast('error', 'Product not found')
                router.push('/seller/thrift/products')
            }
        } catch (error) {
            showToast('error', 'Failed to load product')
            router.push('/seller/thrift/products')
        } finally {
            setFetchLoading(false)
        }
    }

    const onSubmit = async (data) => {
        if (!data.media || data.media.length === 0) {
            showToast('error', 'Please upload at least one image')
            return
        }

        const plainText = description.replace(/<[^>]*>/g, '').trim()
        if (plainText.length < 10) {
            showToast('error', `Description needs ${10 - plainText.length} more characters`)
            return
        }

        try {
            setLoading(true)
            setFormError(null)
            
            const formattedMedia = data.media.map(item => ({
                _id: item._id || `img_${Date.now()}`,
                secure_url: item.secure_url,
                public_id: item.public_id || `product_${Date.now()}`,
                alt: item.alt || data.name,
                isBase64: true
            }))
            
            const payload = {
                name: data.name,
                category: data.category,
                sellingPrice: Number(data.sellingPrice),
                condition: data.condition,
                description: description,
                media: formattedMedia,
                sizeChart: sizeChart,
                uniqueCode: data.uniqueCode
            }

            const response = await axios.put(`/api/seller/products/${productId}`, payload)
            
            if (response.data.success) {
                showToast('success', 'Product updated successfully')
                router.push('/seller/thrift/dashboard')
            } else {
                throw new Error(response.data.message || 'Failed to update product')
            }
        } catch (error) {
            console.error('Submit error:', error)
            const errorMsg = error.response?.data?.message || error.message || 'Failed to update product'
            setFormError(errorMsg)
            showToast('error', errorMsg)
        } finally {
            setLoading(false)
        }
    }

    if (fetchLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading product...</p>
                </div>
            </div>
        )
    }

    const mediaValue = watch('media')
    const sellingPriceValue = watch('sellingPrice')
    const nameValue = watch('name')
    const conditionValue = watch('condition')
    const uniqueCodeValue = watch('uniqueCode')
    const categoryValue = watch('category')
    const plainTextLength = description.replace(/<[^>]*>/g, '').trim().length
    const isDescriptionValid = plainTextLength >= 10

    const isFormValid = mediaValue?.length > 0 && 
                        isDescriptionValid && 
                        nameValue?.length >= 3 && 
                        conditionValue && 
                        Number(sellingPriceValue) >= 1 &&
                        uniqueCodeValue?.length >= 3 &&
                        categoryValue?.length > 0

    return (
        <div className='max-w-4xl mx-auto'>
            <Card>
                <CardHeader>
                    <h1 className='text-2xl font-bold'>Edit Thrift Item</h1>
                    <p className='text-gray-500'>Update your thrift item details</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                        {formError && (
                            <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm'>
                                {formError}
                            </div>
                        )}

                        <div>
                            <Label htmlFor="uniqueCode">SKU / Unique Code <span className='text-red-500'>*</span></Label>
                            <Input {...register('uniqueCode')} className='mt-1' />
                            {errors.uniqueCode && <p className='text-red-500 text-sm mt-1'>{errors.uniqueCode.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="name">Product Name <span className='text-red-500'>*</span></Label>
                            <Input {...register('name')} className='mt-1' />
                            {errors.name && <p className='text-red-500 text-sm mt-1'>{errors.name.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="category">Category <span className='text-red-500'>*</span></Label>
                            <Select value={categoryValue} onValueChange={(value) => setValue('category', value)}>
                                <SelectTrigger className='mt-1'>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category && <p className='text-red-500 text-sm mt-1'>{errors.category.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="condition">Condition <span className='text-red-500'>*</span></Label>
                            <Select value={conditionValue} onValueChange={(value) => setValue('condition', value)}>
                                <SelectTrigger className='mt-1'>
                                    <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent>
                                    {productCondition.map((cond) => (
                                        <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.condition && <p className='text-red-500 text-sm mt-1'>{errors.condition.message}</p>}
                        </div>

                        <div>
                            <Label htmlFor="sellingPrice">Selling Price (₹) <span className='text-red-500'>*</span></Label>
                            <Input type="number" {...register('sellingPrice')} className='mt-1' />
                            {errors.sellingPrice && <p className='text-red-500 text-sm mt-1'>{errors.sellingPrice.message}</p>}
                        </div>

                        <div>
                            <Label>
                                Description <span className='text-red-500'>*</span>
                                <span className='text-gray-400 text-xs ml-2'>({plainTextLength}/10 min)</span>
                            </Label>
                            <div className='mt-1 border rounded-md'>
                                <Editor value={description} onChange={setDescription} />
                            </div>
                        </div>

                        <div>
                            <Label>Size Chart (Optional)</Label>
                            <div className='mt-2'>
                                <SizeChartBuilder value={sizeChart} onChange={setSizeChart} />
                            </div>
                        </div>

                        <div>
                            <Label>Product Images <span className='text-red-500'>*</span></Label>
                            <div className='mt-2'>
                                <Controller
                                    name="media"
                                    control={control}
                                    render={({ field }) => (
                                        <MobileImageUploader
                                            value={field.value || []}
                                            onChange={(newMedia) => { field.onChange(newMedia); trigger('media') }}
                                            maxFiles={5}
                                        />
                                    )}
                                />
                            </div>
                            {errors.media && <p className='text-red-500 text-sm mt-1'>{errors.media.message}</p>}
                        </div>

                        <div className='flex gap-3 pt-4'>
                            <ButtonLoading
                                loading={loading}
                                type="submit"
                                text={isFormValid ? "Update Thrift Item" : "Complete Required Fields"}
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

export default EditThriftProduct