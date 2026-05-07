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
import { ADMIN_PRODUCT_VARIANT_ADD, ADMIN_PRODUCT_VARIANT_EDIT, ADMIN_TRASH } from '@/routes/AdminPanelRoute'
import { formatCurrency } from '@/lib/utils'
import { getImageUrl } from '@/lib/imageUtils'
import { Plus, Edit, Ban, CheckCircle, Trash2 } from 'lucide-react'
import { IconButton, Tooltip } from '@mui/material'
import axios from 'axios'
import { showToast } from '@/lib/showToast'

const AdminProductVariantsPage = () => {
    const router = useRouter()

    const handleStatusChange = async (id, currentStatus, currentQuantity) => {
        const newStatus = currentStatus === 'active' ? 'out_of_stock' : 'active'
        const quantity = newStatus === 'out_of_stock' ? 0 : (currentQuantity > 0 ? currentQuantity : 10)
        try {
            await axios.put(`/api/product-variant/status?id=${id}`, { status: newStatus, quantity })
            showToast('success', `Variant marked as ${newStatus}`)
        } catch (error) { showToast('error', 'Failed to update status') }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this variant?')) return
        try { await axios.delete(`/api/product-variant?id=${id}`); showToast('success', 'Variant deleted') }
        catch { showToast('error', 'Failed to delete variant') }
    }

    const columnsConfig = [
        { accessorKey: '_id', header: 'ID', enableHiding: true },
        {
            accessorKey: 'image', header: 'Image', enableSorting: false,
            Cell: ({ row }) => (
                <Image src={getImageUrl(row.original.media?.[0]?.secure_url || row.original.media?.[0])} width={40} height={40} alt={row.original.sku} className='rounded object-cover w-10 h-10' onError={(e) => { e.target.src = imgPlaceholder.src }} />
            )
        },
        {
            accessorKey: 'productName', header: 'Product',
            Cell: ({ row }) => (<div><p className='font-medium'>{row.original.productName}</p><p className='text-xs text-gray-500'>{row.original.productCode}</p></div>)
        },
        { accessorKey: 'sku', header: 'SKU', Cell: ({ row }) => <code className='text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded'>{row.original.sku}</code> },
        { accessorKey: 'size', header: 'Size', Cell: ({ row }) => <Badge variant="outline">{row.original.size}</Badge> },
        { accessorKey: 'color', header: 'Color', Cell: ({ row }) => <div className='flex items-center gap-2'><div className='w-4 h-4 rounded-full border' style={{backgroundColor: row.original.color?.toLowerCase()}} />{row.original.color}</div> },
        { accessorKey: 'sellingPrice', header: 'Price', Cell: ({ row }) => formatCurrency(row.original.sellingPrice) },
        { accessorKey: 'quantity', header: 'Stock', Cell: ({ row }) => <Badge className={row.original.quantity === 0 ? 'bg-red-600 text-white' : row.original.quantity <= 5 ? 'bg-orange-600 text-white' : 'bg-green-600 text-white'}>{row.original.quantity}</Badge> },
        { accessorKey: 'status', header: 'Status', Cell: ({ row }) => <Badge className={row.original.status === 'active' ? 'bg-green-600 text-white' : row.original.status === 'out_of_stock' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'}>{row.original.status === 'active' ? 'Active' : row.original.status === 'out_of_stock' ? 'Out of Stock' : 'Inactive'}</Badge> },
        { accessorKey: 'createdAt', header: 'Created', Cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('en-IN') }
    ]

    const createAction = (row) => [
        <Tooltip key="edit" title="Edit Variant"><IconButton onClick={() => router.push(ADMIN_PRODUCT_VARIANT_EDIT(row.original._id))}><Edit className='h-4 w-4' /></IconButton></Tooltip>,
        row.original.status === 'active' ? <Tooltip key="outofstock" title="Mark as Out of Stock"><IconButton onClick={() => handleStatusChange(row.original._id, row.original.status, row.original.quantity)} className="text-orange-600"><Ban className='h-4 w-4' /></IconButton></Tooltip> : <Tooltip key="active" title="Mark as Active"><IconButton onClick={() => handleStatusChange(row.original._id, row.original.status, row.original.quantity)} className="text-green-600"><CheckCircle className='h-4 w-4' /></IconButton></Tooltip>,
        <Tooltip key="delete" title="Delete Variant"><IconButton onClick={() => handleDelete(row.original._id)} className="text-red-600"><Trash2 className='h-4 w-4' /></IconButton></Tooltip>
    ]

    return (
        <div className='w-full'>
            <div className='flex justify-between items-center mb-5'><div><h1 className='text-2xl font-bold'>Product Variants</h1><p className='text-gray-500'>Manage all product variants</p></div><Link href={ADMIN_PRODUCT_VARIANT_ADD}><Button><Plus className="h-4 w-4 mr-2" /> Add Variant</Button></Link></div>
            <Card><CardHeader><h2 className='text-lg font-semibold'>Variants List</h2></CardHeader><CardContent className='p-0'><Datatable queryKey={['admin-variants']} fetchUrl={`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-variant`} columnsConfig={columnsConfig} initialPageSize={10} exportEndpoint={`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-variant/export`} deleteEndpoint={`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-variant`} deleteType="SD" trashView={ADMIN_TRASH} createAction={createAction} /></CardContent></Card>
        </div>
    )
}

export default AdminProductVariantsPage