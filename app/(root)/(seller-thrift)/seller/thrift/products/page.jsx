'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { Package, Plus, Edit, Trash2, Eye } from 'lucide-react'
import Image from 'next/image'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { formatCurrency, getConditionDisplay } from '@/lib/utils'
import { getImageUrl } from '@/lib/imageUtils'
import { showToast } from '@/lib/showToast'
import DeleteAction from '@/components/Application/Admin/DeleteAction'
import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'

const ThriftSellerProducts = () => {
    const { auth } = useSelector(state => state.authStore)
    const router = useRouter()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total: 0, active: 0, soldOut: 0 })

    useEffect(() => { fetchProducts() }, [])

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/seller/products?type=thrift')
            if (data.success) { setProducts(data.data.products); setStats(data.data.stats) }
        } catch (error) { showToast('error', error.message) }
        finally { setLoading(false) }
    }

    const handleDelete = async (id) => {
        try {
            const { data } = await axios.delete(`/api/seller/products/${id}`)
            if (data.success) { showToast('success', 'Product deleted successfully'); fetchProducts() }
        } catch (error) { showToast('error', error.message) }
    }

    const handleStatusToggle = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
            const { data } = await axios.put(`/api/seller/products/${id}/status`, { status: newStatus })
            if (data.success) { showToast('success', `Product ${newStatus === 'active' ? 'activated' : 'deactivated'}`); fetchProducts() }
        } catch (error) { showToast('error', error.message) }
    }

    const handleMarkAsSold = async (id) => {
        try {
            const { data } = await axios.put(`/api/seller/products/${id}/status`, { status: 'sold_out' })
            if (data.success) { showToast('success', 'Marked as Sold Out!'); fetchProducts() }
        } catch (error) { showToast('error', error.message) }
    }

    const getProductImage = (product) => {
        return product.media?.[0]?.secure_url || product.media?.[0] || product.base64Media?.[0]?.secure_url
    }

    return (
        <div className='p-5'>
            <div className='flex justify-between items-center mb-5'>
                <div><h1 className='text-2xl font-bold'>My Thrift Products</h1><p className='text-gray-500'>Manage your unique thrift items</p></div>
                <Link href="/seller/thrift/products/add"><Button><Plus className='h-4 w-4 mr-2' />Add Thrift Item</Button></Link>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-5 mb-6'>
                <Card>
                    <CardContent className='p-5'>
                        <div className='flex items-center justify-between'><div><p className='text-gray-500 text-sm'>Total Products</p><p className='text-2xl font-bold'>{stats.total}</p></div><Package className='h-8 w-8 text-blue-500' /></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className='p-5'>
                        <div className='flex items-center justify-between'><div><p className='text-gray-500 text-sm'>Active Products</p><p className='text-2xl font-bold text-green-600'>{stats.active}</p></div><Eye className='h-8 w-8 text-green-500' /></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className='p-5'>
                        <div className='flex items-center justify-between'><div><p className='text-gray-500 text-sm'>Sold Out</p><p className='text-2xl font-bold text-red-600'>{stats.soldOut}</p></div><Package className='h-8 w-8 text-red-500' /></div>
                    </CardContent>
                </Card>
            </div>

            {/* Products Table */}
            <Card>
                <CardHeader><h2 className='text-lg font-semibold'>All Products</h2></CardHeader>
                <CardContent>
                    {loading ? <div className='text-center py-10'>Loading...</div> : products.length === 0 ? (
                        <div className='text-center py-10'><Package className='h-12 w-12 mx-auto text-gray-400 mb-3' /><p className='text-gray-500'>No products yet</p><Link href="/seller/thrift/products/add"><Button className='mt-3'>Add Your First Product</Button></Link></div>
                    ) : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Unique Code</TableHead><TableHead>Condition</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead>Views</TableHead><TableHead className='text-right'>Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product._id} className={product.status === 'sold_out' ? 'opacity-50 bg-gray-50' : ''}>
                                        <TableCell>
                                            <div className='flex items-center gap-3'>
                                                <Image src={getImageUrl(getProductImage(product))} width={50} height={50} alt={product.name} className='rounded object-cover' onError={(e) => { e.target.src = imgPlaceholder.src }} />
                                                <div><p className='font-medium'>{product.name}</p><p className='text-xs text-gray-500'>{product.slug}</p></div>
                                            </div>
                                        </TableCell>
                                        <TableCell><code className='bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs'>{product.uniqueCode}</code></TableCell>
                                        <TableCell><Badge variant="outline">{getConditionDisplay(product.condition)}</Badge></TableCell>
                                        <TableCell>
                                            <div><p className='font-semibold'>{formatCurrency(product.sellingPrice)}</p><p className='text-xs text-gray-500 line-through'>{formatCurrency(product.mrp)}</p></div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={
                                                product.status === 'active' ? 'bg-green-100 text-green-800 font-medium' : 
                                                product.status === 'sold_out' ? 'bg-red-100 text-red-800 font-medium' : 
                                                'bg-yellow-100 text-yellow-800 font-medium'
                                            }>
                                                {product.status === 'active' ? '✅ Active' : product.status === 'sold_out' ? '🔴 Sold Out' : '⏸️ Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{product.views || 0}</TableCell>
                                        <TableCell className='text-right'>
                                            <div className='flex justify-end gap-2'>
                                                <Button variant="ghost" size="icon" onClick={() => router.push(`/seller/thrift/products/edit/${product._id}`)} title="Edit"><Edit className='h-4 w-4' /></Button>
                                                {product.status !== 'sold_out' && (
                                                    <Button variant="ghost" size="icon" onClick={() => handleMarkAsSold(product._id)} title="Mark as Sold Out" className='text-red-600'><Trash2 className='h-4 w-4' /></Button>
                                                )}
                                                <DeleteAction onDelete={() => handleDelete(product._id)} title="Delete Product" description="Are you sure you want to delete this product?" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default ThriftSellerProducts