'use client'
import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import Datatable from '@/components/Application/Admin/Datatable'
import { Badge } from '@/components/ui/badge'
import { ADMIN_PRODUCT_ADD, ADMIN_PRODUCT_EDIT, ADMIN_TRASH } from '@/routes/AdminPanelRoute'
import { formatCurrency } from '@/lib/utils'
import { getImageUrl } from '@/lib/imageUtils'
import { Plus, Edit, Eye, Ban, CheckCircle, Trash2 } from 'lucide-react'
import { IconButton, Tooltip } from '@mui/material'
import axios from 'axios'
import { showToast } from '@/lib/showToast'

const AdminProductsPage = () => {
    const router = useRouter()

    const handleStatusChange = async (id, status) => {
        try { await axios.put(`/api/product/status?id=${id}`, { status }); showToast('success', `Product marked as ${status}`) }
        catch { showToast('error', 'Failed to update status') }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return
        try { await axios.delete(`/api/product?id=${id}`); showToast('success', 'Product deleted') }
        catch { showToast('error', 'Failed to delete product') }
    }

    const columnsConfig = [
        { accessorKey: '_id', header: 'ID', enableHiding: true },
        { accessorKey: 'image', header: 'Image', enableSorting: false, Cell: ({ row }) => (<Image src={getImageUrl(row.original.base64Media?.[0]?.secure_url || row.original.media?.[0]?.secure_url || row.original.media?.[0])} width={40} height={40} alt={row.original.name} className='rounded object-cover w-10 h-10' onError={(e) => { e.target.src = imgPlaceholder.src }} />) },
        { accessorKey: 'name', header: 'Product Name', enableSorting: true },
        { accessorKey: 'uniqueCode', header: 'SKU', Cell: ({ row }) => <code className='text-xs bg-gray-100 px-2 py-1 rounded'>{row.original.uniqueCode || '—'}</code> },
        { accessorKey: 'productType', header: 'Type', filterVariant: 'select', filterSelectOptions: ['thrift', 'brand_new'], Cell: ({ row }) => (<Badge variant='outline' className={row.original.productType === 'thrift' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>{row.original.productType === 'thrift' ? 'Thrift' : 'Brand New'}</Badge>) },
        { accessorKey: 'category.name', header: 'Category', Cell: ({ row }) => row.original.category?.name || '—' },
        { accessorKey: 'sellerName', header: 'Seller', Cell: ({ row }) => (<div><p className='text-sm font-medium'>{row.original.sellerId?.sellerProfile?.storeName || row.original.sellerId?.name || '—'}</p><p className='text-xs text-gray-500'>{row.original.sellerId?.sellerId || '—'}</p></div>) },
        { accessorKey: 'sellingPrice', header: 'Price', filterVariant: 'range', Cell: ({ row }) => formatCurrency(row.original.sellingPrice) },
        { accessorKey: 'mrp', header: 'MRP', Cell: ({ row }) => <span className='line-through text-gray-400'>{formatCurrency(row.original.mrp)}</span> },
        { accessorKey: 'status', header: 'Status', filterVariant: 'select', filterSelectOptions: ['active', 'sold_out', 'inactive'], Cell: ({ row }) => (<Badge className={row.original.status === 'active' ? 'bg-green-600 text-white' : row.original.status === 'sold_out' ? 'bg-gray-600 text-white' : 'bg-yellow-600 text-white'}>{row.original.status === 'active' ? 'Active' : row.original.status === 'sold_out' ? 'Sold Out' : 'Inactive'}</Badge>) },
        { accessorKey: 'views', header: 'Views', filterVariant: 'range', Cell: ({ row }) => row.original.views || 0 },
        { accessorKey: 'createdAt', header: 'Created', filterVariant: 'date', Cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
    ]

    const createAction = (row) => [
        <Tooltip key="view" title="View"><IconButton onClick={() => router.push(`/product/${row.original.slug}`)}><Eye className='h-4 w-4' /></IconButton></Tooltip>,
        <Tooltip key="edit" title="Edit"><IconButton onClick={() => router.push(ADMIN_PRODUCT_EDIT(row.original._id))}><Edit className='h-4 w-4' /></IconButton></Tooltip>,
        row.original.status === 'active' ? <Tooltip key="sold" title="Mark Sold"><IconButton onClick={() => handleStatusChange(row.original._id, 'sold_out')} className="text-orange-600"><Ban className='h-4 w-4' /></IconButton></Tooltip> : <Tooltip key="active" title="Mark Active"><IconButton onClick={() => handleStatusChange(row.original._id, 'active')} className="text-green-600"><CheckCircle className='h-4 w-4' /></IconButton></Tooltip>,
        row.original.status !== 'inactive' && <Tooltip key="delete" title="Delete"><IconButton onClick={() => handleDelete(row.original._id)} className="text-red-600"><Trash2 className='h-4 w-4' /></IconButton></Tooltip>
    ].filter(Boolean)

    return (
        <div className='w-full'>
            <div className='flex justify-between items-center mb-5'><div><h1 className='text-2xl font-bold'>All Products</h1><p className='text-gray-500'>Manage all products</p></div><Link href={ADMIN_PRODUCT_ADD}><Button><Plus className="h-4 w-4 mr-2" /> Add Product</Button></Link></div>
            <Card><CardHeader><h2 className='text-lg font-semibold'>Products List</h2></CardHeader><CardContent className='p-0'>
                <Datatable queryKey={['admin-products']} fetchUrl="/api/product" columnsConfig={columnsConfig} initialPageSize={10} exportEndpoint="/api/product/export" deleteEndpoint="/api/product/delete" deleteType="SD" trashView={ADMIN_TRASH} createAction={createAction} />
            </CardContent></Card>
        </div>
    )
}

export default AdminProductsPage