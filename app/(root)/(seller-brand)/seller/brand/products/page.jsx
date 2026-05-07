'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { Package, Plus, Edit, Trash2, Layers, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getImageUrl } from '@/lib/imageUtils'
import { showToast } from '@/lib/showToast'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const BrandSellerProducts = () => {
    const { auth } = useSelector(state => state.authStore)
    const router = useRouter()
    const [products, setProducts] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [stats, setStats] = useState({ total: 0, active: 0, outOfStock: 0, lowStock: 0 })
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [variantImages, setVariantImages] = useState({})

    useEffect(() => { fetchProducts() }, [])
    useEffect(() => { filterProducts() }, [searchTerm, products])

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/seller/products?type=brand_new&limit=100')
            if (data.success) {
                const productsList = data.data.products
                setProducts(productsList)
                setFilteredProducts(productsList)
                setStats(data.data.stats)
                fetchVariantImages(productsList)
            }
        } catch { showToast('error', 'Failed to load products') }
        finally { setLoading(false) }
    }

    const fetchVariantImages = async (productsList) => {
        const images = {}
        for (const product of productsList) {
            if (!product.media || product.media.length === 0) {
                try {
                    const { data } = await axios.get(`/api/seller/variants?productId=${product._id}&limit=1`)
                    if (data.success && data.data.length > 0 && data.data[0].media?.length > 0) {
                        images[product._id] = data.data[0].media[0]
                    }
                } catch (e) {}
            }
        }
        setVariantImages(images)
    }

    const filterProducts = () => {
        if (!searchTerm) { setFilteredProducts(products); return }
        setFilteredProducts(products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.uniqueCode?.toLowerCase().includes(searchTerm.toLowerCase())))
    }

    const handleDelete = async () => {
        if (!selectedProduct) return
        try { await axios.delete(`/api/seller/products/${selectedProduct._id}`); showToast('success', 'Product deleted'); setDeleteDialogOpen(false); fetchProducts() }
        catch { showToast('error', 'Failed to delete product') }
    }

    const handleStatusToggle = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
            await axios.put(`/api/seller/products/${id}/status`, { status: newStatus })
            showToast('success', `Product ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
            fetchProducts()
        } catch { showToast('error', 'Failed to update status') }
    }

    const getProductImage = (product) => {
        let img = product.base64Media?.[0]?.secure_url || product.media?.[0]?.secure_url || product.media?.[0]
        if (!img && variantImages[product._id]) {
            const vImg = variantImages[product._id]
            img = typeof vImg === 'string' ? vImg : vImg?.secure_url
        }
        return img
    }

    return (
        <div className='w-full'>
            <div className='flex justify-between items-center mb-5'><div><h1 className='text-2xl font-bold'>My Products</h1><p className='text-gray-500'>Manage your brand new products</p></div><Link href="/seller/brand/products/add"><Button><Plus className='h-4 w-4 mr-2' />Add New Product</Button></Link></div>

            <div className='grid grid-cols-1 md:grid-cols-4 gap-5 mb-6'>
                <Card><CardContent className='p-5'><Package className='h-8 w-8 text-blue-500 mb-2' /><p className='text-gray-500 text-sm'>Total Products</p><p className='text-2xl font-bold'>{stats.total}</p></CardContent></Card>
                <Card><CardContent className='p-5'><Package className='h-8 w-8 text-green-500 mb-2' /><p className='text-gray-500 text-sm'>Active</p><p className='text-2xl font-bold text-green-600'>{stats.active}</p></CardContent></Card>
                <Card><CardContent className='p-5'><Layers className='h-8 w-8 text-orange-500 mb-2' /><p className='text-gray-500 text-sm'>Low Stock</p><p className='text-2xl font-bold text-orange-600'>{stats.lowStock}</p></CardContent></Card>
                <Card><CardContent className='p-5'><Package className='h-8 w-8 text-red-500 mb-2' /><p className='text-gray-500 text-sm'>Out of Stock</p><p className='text-2xl font-bold text-red-600'>{stats.outOfStock}</p></CardContent></Card>
            </div>

            <div className='mb-4 relative'><Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' /><Input placeholder="Search by name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' /></div>

            <Card>
                <CardHeader><h2 className='text-lg font-semibold'>All Products</h2></CardHeader>
                <CardContent>
                    {loading ? <div className='text-center py-10'>Loading...</div> : filteredProducts.length === 0 ? <div className='text-center py-10 text-gray-500'>{searchTerm ? 'No products match your search' : 'No products yet'}</div> : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Image</TableHead><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Variants</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead className='text-right'>Actions</TableHead></TableRow></TableHeader>
                            <TableBody>{filteredProducts.map((product) => (
                                <TableRow key={product._id} className={product.status === 'sold_out' ? 'opacity-50 bg-gray-50' : ''}>
                                    <TableCell><Image src={getImageUrl(getProductImage(product))} width={40} height={40} alt={product.name} className='rounded object-cover w-10 h-10' onError={(e) => { e.target.src = imgPlaceholder.src }} /></TableCell>
                                    <TableCell><p className='font-medium'>{product.name}</p></TableCell>
                                    <TableCell><code className='text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded'>{product.uniqueCode}</code></TableCell>
                                    <TableCell><Badge variant="outline">{product.variants?.length || 0} variants</Badge></TableCell>
                                    <TableCell className='font-semibold'>{formatCurrency(product.sellingPrice)}</TableCell>
                                    <TableCell>
                                        <Badge className={
                                            product.status === 'active' ? 'bg-green-100 text-green-800 font-medium' : 
                                            product.status === 'sold_out' ? 'bg-red-100 text-red-800 font-medium' : 
                                            'bg-yellow-100 text-yellow-800 font-medium'
                                        }>
                                            {product.status === 'active' ? '✅ Active' : product.status === 'sold_out' ? '🔴 Sold Out' : '⏸️ Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className='text-right'><div className='flex justify-end gap-1'><Button variant="ghost" size="icon" onClick={() => router.push(`/seller/brand/products/${product._id}/variants`)} title="Manage Variants"><Layers className='h-4 w-4' /></Button><Button variant="ghost" size="icon" onClick={() => router.push(`/seller/brand/products/edit/${product._id}`)} title="Edit"><Edit className='h-4 w-4' /></Button><Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(product); setDeleteDialogOpen(true) }} title="Delete" className='text-red-600'><Trash2 className='h-4 w-4' /></Button></div></TableCell>
                                </TableRow>
                            ))}</TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>Delete Product</DialogTitle><DialogDescription>Are you sure you want to delete "{selectedProduct?.name}"?</DialogDescription></DialogHeader>
                <DialogFooter><Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default BrandSellerProducts