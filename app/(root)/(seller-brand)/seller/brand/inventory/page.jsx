'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { formatCurrency, getStockStatus } from '@/lib/utils'
import { Search, RefreshCw, Save, Package, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import ButtonLoading from '@/components/Application/ButtonLoading'

const BrandSellerInventory = () => {
    const [variants, setVariants] = useState([])
    const [filteredVariants, setFilteredVariants] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editValue, setEditValue] = useState(0)
    const [saving, setSaving] = useState(false)
    const [stats, setStats] = useState({ total: 0, totalStock: 0, lowStock: 0, outOfStock: 0 })

    useEffect(() => { fetchInventory() }, [])
    useEffect(() => { setFilteredVariants(variants.filter(v => v.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || v.sku?.toLowerCase().includes(searchTerm.toLowerCase()) || v.size?.toLowerCase().includes(searchTerm.toLowerCase()))) }, [searchTerm, variants])

    const fetchInventory = async () => {
        try { setLoading(true); const { data } = await axios.get('/api/seller/inventory'); if (data.success) { setVariants(data.data); setFilteredVariants(data.data); const totalStock = data.data.reduce((s, v) => s + v.quantity, 0); setStats({ total: data.data.length, totalStock, lowStock: data.data.filter(v => v.quantity > 0 && v.quantity <= 5).length, outOfStock: data.data.filter(v => v.quantity === 0).length }) } } catch { showToast('error', 'Failed to load inventory') } finally { setLoading(false) }
    }

    const handleUpdateStock = async (variantId) => {
        try { setSaving(true); await axios.put(`/api/seller/inventory/${variantId}`, { quantity: editValue }); showToast('success', 'Stock updated'); setEditingId(null); fetchInventory() } catch { showToast('error', 'Failed to update stock') } finally { setSaving(false) }
    }

    return (
        <div className='w-full'>
            <div className='flex justify-between items-center mb-5'><div><h1 className='text-2xl font-bold'>Inventory Management</h1><p className='text-gray-500'>Manage stock levels for all variants</p></div><Button variant="outline" onClick={fetchInventory}><RefreshCw className='h-4 w-4 mr-2' />Refresh</Button></div>
            <div className='grid grid-cols-4 gap-4 mb-6'><Card><CardContent className='p-4'><p className='text-gray-500 text-sm'>Total Variants</p><p className='text-2xl font-bold'>{stats.total}</p></CardContent></Card><Card><CardContent className='p-4'><p className='text-gray-500 text-sm'>Total Stock</p><p className='text-2xl font-bold'>{stats.totalStock}</p></CardContent></Card><Card className='border-orange-200'><CardContent className='p-4'><p className='text-orange-600 text-sm'>Low Stock</p><p className='text-2xl font-bold text-orange-600'>{stats.lowStock}</p></CardContent></Card><Card className='border-red-200'><CardContent className='p-4'><p className='text-red-600 text-sm'>Out of Stock</p><p className='text-2xl font-bold text-red-600'>{stats.outOfStock}</p></CardContent></Card></div>
            <div className='mb-4 relative'><Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' /><Input placeholder="Search by product, SKU, size..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' /></div>
            <Card><CardHeader><h2 className='text-lg font-semibold'>All Variants</h2></CardHeader><CardContent>
                {loading ? <div className='text-center py-10'>Loading...</div> : filteredVariants.length === 0 ? <div className='text-center py-10 text-gray-500'><Package className='h-12 w-12 mx-auto text-gray-300 mb-3' /><p>No variants found</p></div> : (
                    <Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Size</TableHead><TableHead>Color</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead><TableHead className='text-right'>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>{filteredVariants.map((v) => { const stockStatus = getStockStatus(v.quantity); return (
                        <TableRow key={v._id}><TableCell><div className='flex items-center gap-2'><Image src={v.image || imgPlaceholder.src} width={40} height={40} alt={v.productName} className='rounded' /><span className='text-sm'>{v.productName}</span></div></TableCell><TableCell><code className='text-xs bg-gray-100 px-2 py-1 rounded'>{v.sku}</code></TableCell><TableCell>{v.size}</TableCell><TableCell><div className='flex items-center gap-1'><div className='w-3 h-3 rounded-full border' style={{backgroundColor: v.color?.toLowerCase()}} />{v.color}</div></TableCell><TableCell>{formatCurrency(v.sellingPrice)}</TableCell><TableCell>{editingId === v._id ? <Input type="number" value={editValue} onChange={(e) => setEditValue(parseInt(e.target.value) || 0)} className='w-20 h-8' autoFocus /> : <span className='font-medium'>{v.quantity}</span>}</TableCell><TableCell><Badge className={stockStatus.color?.replace('text-', 'bg-') + ' ' + stockStatus.color}>{stockStatus.label}</Badge></TableCell><TableCell className='text-right'>{editingId === v._id ? <div className='flex justify-end gap-2'><Button size="sm" onClick={() => handleUpdateStock(v._id)} disabled={saving}><Save className='h-4 w-4' /></Button><Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button></div> : <Button size="sm" variant="outline" onClick={() => { setEditingId(v._id); setEditValue(v.quantity) }}>Update Stock</Button>}</TableCell></TableRow>
                    )})}</TableBody></Table>
                )}
            </CardContent></Card>
        </div>
    )
}

export default BrandSellerInventory