'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { useRouter } from 'next/navigation'
import ButtonLoading from '@/components/Application/ButtonLoading'
import Editor from '@/components/Application/Admin/Editor'
import slugify from 'slugify'

// ✅ REMOVED media and sizeChart - Images come from variants only
const productSchema = z.object({
    name: z.string().min(3, 'Product name is required'),
    category: z.string().min(1, 'Category is required'),
    mrp: z.number().min(1, 'MRP is required').or(z.string().transform(val => Number(val))),
    sellingPrice: z.number().min(1, 'Selling price is required').or(z.string().transform(val => Number(val))),
    uniqueCode: z.string().optional(),
})

const AddBrandProduct = () => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formError, setFormError] = useState(null)
    const [categories, setCategories] = useState([])
    const [description, setDescription] = useState('')

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: { name: '', category: '', mrp: '', sellingPrice: '', uniqueCode: '' },
        mode: 'onChange'
    })

    const mrpValue = watch('mrp')
    const sellingPriceValue = watch('sellingPrice')
    const nameValue = watch('name')
    const categoryValue = watch('category')
    const uniqueCodeValue = watch('uniqueCode')

    useEffect(() => { fetchCategories() }, [])

    const fetchCategories = async () => {
        try {
            const { data } = await axios.get('/api/category/get-category')
            if (data.success) setCategories(data.data)
        } catch (error) { showToast('error', 'Failed to load categories') }
    }

    const onSubmit = async (data) => {
        const plainText = description.replace(/<[^>]*>/g, '').trim()
        if (plainText.length < 10) { showToast('error', `Description needs ${10 - plainText.length} more characters`); return }
        if (Number(data.sellingPrice) > Number(data.mrp)) { showToast('error', 'Selling price cannot be greater than MRP'); return }

        try {
            setLoading(true)
            const slug = slugify(data.name, { lower: true, strict: true })
            const discountPercentage = Math.round(((Number(data.mrp) - Number(data.sellingPrice)) / Number(data.mrp)) * 100)
            const sku = data.uniqueCode || `BN${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
            
            const payload = {
                name: data.name,
                slug: slug,
                category: data.category,
                mrp: Number(data.mrp),
                sellingPrice: Number(data.sellingPrice),
                discountPercentage: discountPercentage > 0 ? discountPercentage : 0,
                description: description,
                media: [],  // ✅ Empty - images come from variants
                productType: 'brand_new',
                hasVariants: true,
                isUnique: false,
                uniqueCode: sku
            }

            const response = await axios.post('/api/product/create', payload)
            if (response.data.success) {
                showToast('success', `Product added! Now add variants with images.`)
                router.push(`/seller/brand/products/${response.data.data.productId}/variants`)
            } else {
                throw new Error(response.data.message || 'Failed to add product')
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to add product'
            setFormError(errorMsg)
            showToast('error', errorMsg)
        } finally { setLoading(false) }
    }

    const plainTextLength = description.replace(/<[^>]*>/g, '').trim().length
    const isDescriptionValid = plainTextLength >= 10
    const discountPrice = Number(mrpValue) - Number(sellingPriceValue)
    const isFormValid = nameValue?.length >= 3 && categoryValue?.length > 0 && Number(mrpValue) >= 1 && Number(sellingPriceValue) >= 1 && Number(sellingPriceValue) <= Number(mrpValue) && isDescriptionValid

    return (
        <div className='max-w-2xl mx-auto'>
            <Card>
                <CardHeader>
                    <h1 className='text-2xl font-bold'>Add Brand New Product</h1>
                    <p className='text-gray-500'>Add basic info. Images, sizes & colors are added with variants in the next step.</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                        {formError && <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm'>{formError}</div>}

                        <div>
                            <Label>SKU / Product Code</Label>
                            <Input {...register('uniqueCode')} placeholder="e.g., BN-JEANS-001 (auto-generated if empty)" />
                            <p className='text-xs text-gray-500 mt-1'>Leave empty to auto-generate</p>
                        </div>

                        <div>
                            <Label>Product Name <span className='text-red-500'>*</span></Label>
                            <Input {...register('name')} placeholder="e.g., Slim Fit Jeans" />
                            {errors.name && <p className='text-red-500 text-sm mt-1'>{errors.name.message}</p>}
                        </div>

                        <div>
                            <Label>Category <span className='text-red-500'>*</span></Label>
                            <Select onValueChange={(value) => setValue('category', value, { shouldValidate: true })}>
                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (<SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                            {errors.category && <p className='text-red-500 text-sm mt-1'>{errors.category.message}</p>}
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <Label>MRP (₹) <span className='text-red-500'>*</span></Label>
                                <Input type="number" {...register('mrp')} placeholder="Max Retail Price" />
                                {errors.mrp && <p className='text-red-500 text-sm mt-1'>{errors.mrp.message}</p>}
                            </div>
                            <div>
                                <Label>Selling Price (₹) <span className='text-red-500'>*</span></Label>
                                <Input type="number" {...register('sellingPrice')} placeholder="Your selling price" />
                                {errors.sellingPrice && <p className='text-red-500 text-sm mt-1'>{errors.sellingPrice.message}</p>}
                            </div>
                        </div>

                        {discountPrice > 0 && (
                            <div className='bg-green-50 p-3 rounded-lg text-sm text-green-700'>
                                Discount: ₹{discountPrice.toLocaleString('en-IN')} ({Math.round((discountPrice / mrpValue) * 100)}% off)
                            </div>
                        )}

                        <div>
                            <Label>Description <span className='text-red-500'>*</span> <span className='text-gray-400 text-xs'>({plainTextLength}/10)</span></Label>
                            <div className='mt-1 border rounded-md'><Editor value={description} onChange={setDescription} /></div>
                        </div>

                        <div className='bg-blue-50 p-4 rounded-lg'>
                            <p className='text-sm text-blue-800'><strong>📝 Next Step:</strong> After creating, add variants with sizes, colors, stock & images.</p>
                        </div>

                        <ButtonLoading loading={loading} type="submit" text={isFormValid ? "Continue to Add Variants" : "Complete Required Fields"} className="w-full" disabled={!isFormValid || loading} />
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default AddBrandProduct