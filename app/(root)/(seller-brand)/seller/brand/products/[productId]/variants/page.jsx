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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { formatCurrency } from '@/lib/utils'
import { getImageUrl } from '@/lib/imageUtils'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit, Trash2, Package, Layers, Ban, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import ButtonLoading from '@/components/Application/ButtonLoading'
import MobileImageUploader from '@/components/Application/MobileImageUploader'

const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '28', '30', '32', '34', '36', '38', '40', '42', '44']
const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Grey', 'Brown', 'Navy', 'Beige']

const ProductVariantsPage = () => {
    const params = useParams()
    const router = useRouter()
    const productId = params.productId
    const [loading, setLoading] = useState(true)
    const [product, setProduct] = useState(null)
    const [variants, setVariants] = useState([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingVariant, setEditingVariant] = useState(null)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        size: '',
        color: '',
        mrp: '',
        sellingPrice: '',
        quantity: '',
        sku: '',
        media: []
    })

    useEffect(() => {
        fetchProductAndVariants()
    }, [productId])

    const fetchProductAndVariants = async () => {
        try {
            setLoading(true)
            const [productRes, variantsRes] = await Promise.all([
                axios.get(`/api/seller/products/${productId}`),
                axios.get(`/api/seller/variants?productId=${productId}`)
            ])
            if (productRes.data.success) setProduct(productRes.data.data.product)
            if (variantsRes.data.success) setVariants(variantsRes.data.data)
        } catch (error) {
            showToast('error', 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const openAddDialog = () => {
        setEditingVariant(null)
        setFormData({
            size: '',
            color: '',
            mrp: product?.mrp || '',
            sellingPrice: product?.sellingPrice || '',
            quantity: '',
            sku: `${product?.uniqueCode || 'BN'}-`,
            media: []
        })
        setDialogOpen(true)
    }

    const openEditDialog = (variant) => {
        setEditingVariant(variant)
        setFormData({
            size: variant.size,
            color: variant.color,
            mrp: variant.mrp,
            sellingPrice: variant.sellingPrice,
            quantity: variant.quantity,
            sku: variant.sku,
            media: variant.media || []
        })
        setDialogOpen(true)
    }

    const handleSaveVariant = async () => {
        if (!formData.size || !formData.color || !formData.sellingPrice || !formData.sku) {
            showToast('error', 'Please fill all required fields')
            return
        }

        try {
            setSaving(true)
            const payload = {
                ...formData,
                product: productId,
                mrp: Number(formData.mrp),
                sellingPrice: Number(formData.sellingPrice),
                quantity: Number(formData.quantity) || 0,
                discountPercentage: Math.round(((formData.mrp - formData.sellingPrice) / formData.mrp) * 100)
            }

            let response
            if (editingVariant) {
                response = await axios.put(`/api/seller/variants/${editingVariant._id}`, payload)
            } else {
                response = await axios.post('/api/seller/variants', payload)
            }

            if (response.data.success) {
                showToast('success', editingVariant ? 'Variant updated' : 'Variant added successfully')
                setDialogOpen(false)
                fetchProductAndVariants()
            }
        } catch (error) {
            console.error('Save error:', error)
            showToast('error', error.response?.data?.message || 'Failed to save variant')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteVariant = async (variantId) => {
        if (!confirm('Delete this variant? This action cannot be undone.')) return
        try {
            await axios.delete(`/api/seller/variants/${variantId}`)
            showToast('success', 'Variant deleted')
            fetchProductAndVariants()
        } catch (error) {
            showToast('error', 'Failed to delete variant')
        }
    }

    const handleMarkAsOutOfStock = async (variantId) => {
        try {
            await axios.put(`/api/seller/variants/${variantId}`, { quantity: 0, status: 'out_of_stock' })
            showToast('success', 'Marked as out of stock')
            fetchProductAndVariants()
        } catch (error) {
            showToast('error', 'Failed to update')
        }
    }

    const handleMarkAsActive = async (variantId, currentQuantity) => {
        try {
            await axios.put(`/api/seller/variants/${variantId}`, { 
                quantity: currentQuantity > 0 ? currentQuantity : 10, 
                status: 'active' 
            })
            showToast('success', 'Marked as active')
            fetchProductAndVariants()
        } catch (error) {
            showToast('error', 'Failed to update')
        }
    }

    const generateSKU = () => {
        const sizeCode = formData.size || 'XX'
        const colorCode = (formData.color || 'XXX').substring(0, 3).toUpperCase()
        setFormData({...formData, sku: `${product?.uniqueCode || 'BN'}-${sizeCode}-${colorCode}`})
    }

    // ✅ Get product summary image - check product first, then first variant
    const getProductSummaryImage = () => {
        // Check product images first
        const productImg = product?.base64Media?.[0]?.secure_url || product?.media?.[0]?.secure_url || product?.media?.[0]
        if (productImg) return productImg
        
        // Fallback to first variant's first image
        if (variants.length > 0) {
            const firstVariant = variants[0]
            const variantImg = firstVariant?.media?.[0]?.secure_url || firstVariant?.media?.[0]
            if (variantImg) return variantImg
        }
        
        return null
    }

    // ✅ Get variant image
    const getVariantImage = (variant) => {
        return variant?.media?.[0]?.secure_url || variant?.media?.[0] || getProductSummaryImage()
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading variants...</p>
                </div>
            </div>
        )
    }

    return (
        <div className='w-full max-w-7xl mx-auto'>
            {/* Header */}
            <div className='mb-6'>
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
                </Button>
                <div className='flex justify-between items-center'>
                    <div>
                        <h1 className='text-2xl font-bold flex items-center gap-2'>
                            <Layers className="h-6 w-6" />
                            Manage Variants
                        </h1>
                        <p className='text-gray-500'>{product?.name} | Base SKU: {product?.uniqueCode}</p>
                    </div>
                    <Button onClick={openAddDialog} size="lg" className="gap-2">
                        <Plus className="h-5 w-5" />
                        Add New Variant
                    </Button>
                </div>
            </div>

            {/* Product Summary - ✅ FIXED IMAGE */}
            <Card className='mb-6'>
                <CardContent className='p-4'>
                    <div className='flex items-center gap-4'>
                        <Image 
                            src={getImageUrl(getProductSummaryImage())}
                            width={60} 
                            height={80} 
                            alt={product?.name} 
                            className='rounded border object-cover' 
                            onError={(e) => { e.target.src = imgPlaceholder.src }}
                        />
                        <div className='flex-1'>
                            <p className='font-semibold text-lg'>{product?.name}</p>
                            <p className='text-sm text-gray-500'>Category: {product?.category?.name || 'N/A'}</p>
                        </div>
                        <div className='text-right'>
                            <p className='text-sm text-gray-500'>Base Price</p>
                            <p className='font-semibold text-lg'>{formatCurrency(product?.sellingPrice)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Variants Table */}
            <Card>
                <CardHeader>
                    <div className='flex justify-between items-center'>
                        <h2 className='text-lg font-semibold'>
                            Product Variants 
                            <Badge className="ml-2" variant="outline">{variants.length} Total</Badge>
                        </h2>
                    </div>
                </CardHeader>
                <CardContent>
                    {variants.length === 0 ? (
                        <div className='text-center py-16'>
                            <Layers className='h-16 w-16 mx-auto text-gray-300 mb-4' />
                            <p className='text-gray-500 text-lg mb-2'>No variants added yet</p>
                            <p className='text-gray-400 mb-4'>Add sizes, colors, and stock for this product</p>
                            <Button onClick={openAddDialog} size="lg">
                                <Plus className="h-5 w-5 mr-2" /> Add First Variant
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Image</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Color</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className='text-center'>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {variants.map((variant) => (
                                    <TableRow key={variant._id}>
                                        <TableCell>
                                            <Image 
                                                src={getImageUrl(getVariantImage(variant))}
                                                width={50} 
                                                height={50} 
                                                alt={variant.sku} 
                                                className='rounded border object-cover' 
                                                onError={(e) => { e.target.src = imgPlaceholder.src }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-sm px-3 py-1">{variant.size}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className='flex items-center gap-2'>
                                                <div className='w-4 h-4 rounded-full border' style={{backgroundColor: variant.color?.toLowerCase()}} />
                                                {variant.color}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className='text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded'>{variant.sku}</code>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className='font-semibold'>{formatCurrency(variant.sellingPrice)}</p>
                                                <p className='text-xs text-gray-500 line-through'>{formatCurrency(variant.mrp)}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={
                                                variant.quantity === 0 ? 'bg-red-100 text-red-800' : 
                                                variant.quantity <= 5 ? 'bg-orange-100 text-orange-800' : 
                                                'bg-green-100 text-green-800'
                                            }>
                                                {variant.quantity} units
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={
                                                variant.status === 'active' ? 'bg-green-100 text-green-800' : 
                                                'bg-gray-100 text-gray-800'
                                            }>
                                                {variant.status === 'active' ? 'Active' : 'Out of Stock'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className='flex justify-center gap-1'>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => openEditDialog(variant)}
                                                    title="Edit Variant"
                                                >
                                                    <Edit className='h-4 w-4' />
                                                </Button>
                                                
                                                {variant.status === 'active' && variant.quantity > 0 ? (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleMarkAsOutOfStock(variant._id)}
                                                        title="Mark as Out of Stock"
                                                        className='text-orange-600 hover:text-orange-700'
                                                    >
                                                        <Ban className='h-4 w-4' />
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleMarkAsActive(variant._id, variant.quantity)}
                                                        title="Mark as Active"
                                                        className='text-green-600 hover:text-green-700'
                                                    >
                                                        <CheckCircle className='h-4 w-4' />
                                                    </Button>
                                                )}
                                                
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDeleteVariant(variant._id)}
                                                    title="Delete Variant"
                                                    className='text-red-600 hover:text-red-700'
                                                >
                                                    <Trash2 className='h-4 w-4' />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Variant Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {editingVariant ? 'Edit Variant' : 'Add New Variant'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingVariant 
                                ? 'Update size, color, price, and stock for this variant' 
                                : 'Add a new size/color combination for this product'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className='space-y-4 py-4'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <Label>Size <span className='text-red-500'>*</span></Label>
                                <Select value={formData.size} onValueChange={(v) => setFormData({...formData, size: v})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Color <span className='text-red-500'>*</span></Label>
                                <Select value={formData.color} onValueChange={(v) => setFormData({...formData, color: v})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {colors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>SKU <span className='text-red-500'>*</span></Label>
                            <div className='flex gap-2'>
                                <Input 
                                    value={formData.sku} 
                                    onChange={(e) => setFormData({...formData, sku: e.target.value})} 
                                    placeholder="Variant SKU" 
                                />
                                <Button type="button" variant="outline" onClick={generateSKU}>
                                    Generate
                                </Button>
                            </div>
                        </div>

                        <div className='grid grid-cols-3 gap-4'>
                            <div>
                                <Label>MRP (₹) <span className='text-red-500'>*</span></Label>
                                <Input 
                                    type="number" 
                                    value={formData.mrp} 
                                    onChange={(e) => setFormData({...formData, mrp: e.target.value})} 
                                />
                            </div>
                            <div>
                                <Label>Selling Price (₹) <span className='text-red-500'>*</span></Label>
                                <Input 
                                    type="number" 
                                    value={formData.sellingPrice} 
                                    onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})} 
                                />
                            </div>
                            <div>
                                <Label>Stock Quantity</Label>
                                <Input 
                                    type="number" 
                                    value={formData.quantity} 
                                    onChange={(e) => setFormData({...formData, quantity: e.target.value})} 
                                    min="0" 
                                />
                            </div>
                        </div>

                        {formData.mrp && formData.sellingPrice && Number(formData.mrp) > Number(formData.sellingPrice) && (
                            <div className='bg-green-50 dark:bg-green-950/30 p-3 rounded-lg'>
                                <p className='text-sm text-green-800 dark:text-green-300'>
                                    Discount: {Math.round(((formData.mrp - formData.sellingPrice) / formData.mrp) * 100)}% off
                                </p>
                            </div>
                        )}

                        <div>
                            <Label>Variant Images (Optional)</Label>
                            <MobileImageUploader 
                                value={formData.media} 
                                onChange={(media) => setFormData({...formData, media})} 
                                maxFiles={3} 
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <ButtonLoading 
                            loading={saving} 
                            onClick={handleSaveVariant} 
                            text={editingVariant ? 'Update Variant' : 'Add Variant'} 
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ProductVariantsPage