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
import { useRouter } from 'next/navigation'
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
    uniqueCode: z.string().min(3, 'SKU/Unique Code is required for tracking'),
})

const AddThriftProduct = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
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
        mode: 'onChange'
    })

    const mediaValue = watch('media')
    const sellingPriceValue = watch('sellingPrice')
    const nameValue = watch('name')
    const conditionValue = watch('condition')
    const uniqueCodeValue = watch('uniqueCode')
    const categoryValue = watch('category')

    useEffect(() => {
        fetchCategories()
    }, [])

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

    const generateSlug = (name) => {
        return slugify(name, { lower: true, strict: true })
    }

    const onSubmit = async (data) => {
        if (!data.media || data.media.length === 0) {
            showToast('error', 'Please upload at least one image')
            return
        }

        const plainText = description.replace(/<[^>]*>/g, '').trim()
        if (plainText.length < 10) {
            showToast('error', `Description needs ${10 - plainText.length} more characters (plain text only)`)
            return
        }

        if (!data.uniqueCode || data.uniqueCode.length < 3) {
            showToast('error', 'SKU/Unique Code is required for tracking')
            return
        }

        try {
            setLoading(true)
            setFormError(null)
            
            const slug = generateSlug(data.name)
            
            const formattedMedia = data.media.map(item => ({
                _id: item._id || `img_${Date.now()}`,
                secure_url: item.secure_url,
                public_id: item.public_id || `product_${Date.now()}`,
                alt: item.alt || data.name,
                isBase64: true
            }))
            
            const payload = {
                name: data.name,
                slug: slug,
                category: data.category,
                sellingPrice: Number(data.sellingPrice),
                condition: data.condition,
                description: description,
                media: formattedMedia,
                sizeChart: sizeChart,
                productType: 'thrift',
                quantity: 1,
                isUnique: true,
                hasVariants: false,
                mrp: Number(data.sellingPrice),
                discountPercentage: 0,
                uniqueCode: data.uniqueCode
            }

            const response = await axios.post('/api/product/create', payload)
            
            if (response.data.success) {
                showToast('success', `Thrift item added! SKU: ${data.uniqueCode}`)
                router.push('/seller/thrift/dashboard')
            } else {
                throw new Error(response.data.message || 'Failed to add product')
            }
        } catch (error) {
            console.error('Submit error:', error)
            const errorMsg = error.response?.data?.message || error.message || 'Failed to add product'
            setFormError(errorMsg)
            showToast('error', errorMsg)
        } finally {
            setLoading(false)
        }
    }

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
                    <h1 className='text-2xl font-bold'>Add Thrift Item</h1>
                    <p className='text-gray-500'>List a unique pre-owned item for sale</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                        {formError && (
                            <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm'>
                                {formError}
                            </div>
                        )}

                        {/* SKU Field */}
                        <div>
                            <Label htmlFor="uniqueCode">SKU / Unique Code <span className='text-red-500'>*</span></Label>
                            <Input {...register('uniqueCode')} placeholder="e.g., TH-001" className='mt-1' />
                            {errors.uniqueCode && <p className='text-red-500 text-sm mt-1'>{errors.uniqueCode.message}</p>}
                            <p className='text-xs text-gray-500 mt-1'>Required for tracking and inventory management</p>
                        </div>

                        {/* Product Name */}
                        <div>
                            <Label htmlFor="name">Product Name <span className='text-red-500'>*</span></Label>
                            <Input {...register('name')} placeholder="e.g., Vintage Denim Jacket" className='mt-1' />
                            {errors.name && <p className='text-red-500 text-sm mt-1'>{errors.name.message}</p>}
                        </div>

                        {/* Category Field */}
                        <div>
                            <Label htmlFor="category">Category <span className='text-red-500'>*</span></Label>
                            <Select onValueChange={(value) => setValue('category', value, { shouldValidate: true })}>
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

                        {/* Condition */}
                        <div>
                            <Label htmlFor="condition">Condition <span className='text-red-500'>*</span></Label>
                            <Select onValueChange={(value) => setValue('condition', value, { shouldValidate: true })}>
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

                        {/* Selling Price */}
                        <div>
                            <Label htmlFor="sellingPrice">Selling Price (₹) <span className='text-red-500'>*</span></Label>
                            <Input type="number" {...register('sellingPrice')} placeholder="Your selling price" className='mt-1' />
                            {errors.sellingPrice && <p className='text-red-500 text-sm mt-1'>{errors.sellingPrice.message}</p>}
                        </div>

                        {/* Description with CKEditor */}
                        <div>
                            <Label>
                                Description <span className='text-red-500'>*</span>
                                <span className='text-gray-400 text-xs ml-2'>({plainTextLength}/10 min plain text)</span>
                            </Label>
                            <div className='mt-1 border rounded-md'>
                                <Editor 
                                    value={description} 
                                    onChange={(newValue) => setDescription(newValue)} 
                                />
                            </div>
                            {!isDescriptionValid && description.length > 0 && (
                                <p className='text-orange-500 text-sm mt-1'>
                                    {10 - plainTextLength} more characters needed (plain text)
                                </p>
                            )}
                        </div>

                        {/* Size Chart Builder */}
                        <div>
                            <Label>Size Chart (Optional)</Label>
                            <div className='mt-2'>
                                <SizeChartBuilder 
                                    value={sizeChart} 
                                    onChange={setSizeChart} 
                                />
                            </div>
                            <p className='text-xs text-gray-500 mt-1'>
                                Add measurements to help buyers choose the right size
                            </p>
                        </div>

                        {/* Image Uploader */}
                        <div>
                            <Label>Product Images <span className='text-red-500'>*</span> (3:4 Portrait)</Label>
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

                        {/* Info Alert */}
                        <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg'>
                            <p className='text-sm text-blue-800 dark:text-blue-200'>
                                <strong>📸 Photo Guidelines:</strong> All images are automatically resized to 3:4 portrait ratio (1080x1440). 
                                Make sure the product fills 80-90% of the frame with a clean background.
                            </p>
                        </div>

                        {/* Form Status */}
                        <div className='text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'>
                            <div className='grid grid-cols-2 gap-2 text-xs'>
                                <span>📷 Images:</span>
                                <span className={mediaValue?.length > 0 ? 'text-green-600' : 'text-red-500'}>
                                    {mediaValue?.length || 0}/1 {mediaValue?.length > 0 ? '✓' : '✗'}
                                </span>
                                <span>🏷️ SKU:</span>
                                <span className={uniqueCodeValue?.length >= 3 ? 'text-green-600' : 'text-red-500'}>
                                    {uniqueCodeValue?.length || 0}/3 {uniqueCodeValue?.length >= 3 ? '✓' : '✗'}
                                </span>
                                <span>📦 Name:</span>
                                <span className={nameValue?.length >= 3 ? 'text-green-600' : 'text-red-500'}>
                                    {nameValue?.length || 0}/3 {nameValue?.length >= 3 ? '✓' : '✗'}
                                </span>
                                <span>📁 Category:</span>
                                <span className={categoryValue?.length > 0 ? 'text-green-600' : 'text-red-500'}>
                                    {categoryValue ? '✓' : '✗'}
                                </span>
                                <span>🔧 Condition:</span>
                                <span className={conditionValue ? 'text-green-600' : 'text-red-500'}>
                                    {conditionValue ? '✓' : '✗'}
                                </span>
                                <span>💰 Price:</span>
                                <span className={Number(sellingPriceValue) >= 1 ? 'text-green-600' : 'text-red-500'}>
                                    ₹{sellingPriceValue || 0} ✓
                                </span>
                                <span>📝 Description:</span>
                                <span className={isDescriptionValid ? 'text-green-600' : 'text-red-500'}>
                                    {plainTextLength}/10 {isDescriptionValid ? '✓' : '✗'}
                                </span>
                                <span>📏 Size Chart:</span>
                                <span className='text-gray-500'>
                                    {sizeChart ? '✓ Added' : 'Optional'}
                                </span>
                            </div>
                            <p className={`mt-2 font-medium ${isFormValid ? 'text-green-600' : 'text-orange-500'}`}>
                                {isFormValid ? '✅ Ready to submit!' : '⏳ Complete all required fields'}
                            </p>
                        </div>

                        {/* Submit */}
                        <div className='flex gap-3 pt-4'>
                            <ButtonLoading
                                loading={loading}
                                type="submit"
                                text={isFormValid ? "Add Thrift Item" : "Complete Required Fields"}
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

export default AddThriftProduct