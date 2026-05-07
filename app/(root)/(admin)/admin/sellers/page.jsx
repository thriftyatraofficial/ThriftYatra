'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { formatDate } from '@/lib/utils'
import { getImageUrl } from '@/lib/imageUtils'
import { useRouter } from 'next/navigation'
import { Search, Eye, CheckCircle, XCircle, UserCheck, UserX, Store } from 'lucide-react'
import Link from 'next/link'
import { ADMIN_SELLER_DETAILS } from '@/routes/AdminPanelRoute'
import Image from 'next/image'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const getSellerApprovalColor = (status) => {
    const colors = { pending: 'bg-yellow-600 text-white', approved: 'bg-green-600 text-white', rejected: 'bg-red-600 text-white', suspended: 'bg-gray-600 text-white' }
    return colors[status] || 'bg-gray-600 text-white'
}

const getRoleDisplayName = (role) => {
    const names = { thrift_seller: 'Thrift Seller', brand_seller: 'Brand Seller', admin: 'Admin' }
    return names[role] || role
}

const AdminSellersPage = () => {
    const router = useRouter()
    const [sellers, setSellers] = useState([])
    const [filteredSellers, setFilteredSellers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, thrift: 0, brand: 0 })

    useEffect(() => { fetchSellers() }, [])
    useEffect(() => { filterSellers() }, [searchTerm, statusFilter, typeFilter, sellers])

    const fetchSellers = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/admin/sellers')
            if (data.success) {
                const sellerData = data.data.sellers || []
                setSellers(sellerData); setFilteredSellers(sellerData)
                setStats({ total: sellerData.length, pending: sellerData.filter(s => s.sellerProfile?.approvalStatus === 'pending').length, approved: sellerData.filter(s => s.sellerProfile?.approvalStatus === 'approved').length, thrift: sellerData.filter(s => s.role === 'thrift_seller').length, brand: sellerData.filter(s => s.role === 'brand_seller').length })
            }
        } catch { showToast('error', 'Failed to load sellers') }
        finally { setLoading(false) }
    }

    const filterSellers = () => {
        let filtered = sellers
        if (statusFilter !== 'all') filtered = filtered.filter(s => s.sellerProfile?.approvalStatus === statusFilter)
        if (typeFilter !== 'all') filtered = filtered.filter(s => s.role === typeFilter)
        if (searchTerm) filtered = filtered.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.sellerId?.toLowerCase().includes(searchTerm.toLowerCase()) || s.sellerProfile?.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone?.includes(searchTerm))
        setFilteredSellers(filtered)
    }

    const handleApprove = async (sellerId) => { try { await axios.put('/api/admin/sellers', { sellerId, action: 'approve' }); showToast('success', 'Seller approved'); fetchSellers() } catch { showToast('error', 'Failed to approve seller') } }
    const handleReject = async (sellerId) => { try { await axios.put('/api/admin/sellers', { sellerId, action: 'reject' }); showToast('success', 'Seller rejected'); fetchSellers() } catch { showToast('error', 'Failed to reject seller') } }
    const handleSuspend = async (sellerId) => { try { await axios.put('/api/admin/sellers', { sellerId, action: 'suspend' }); showToast('success', 'Seller suspended'); fetchSellers() } catch { showToast('error', 'Failed to suspend seller') } }
    const handleActivate = async (sellerId) => { try { await axios.put('/api/admin/sellers', { sellerId, action: 'activate' }); showToast('success', 'Seller activated'); fetchSellers() } catch { showToast('error', 'Failed to activate seller') } }

    return (
        <div className='w-full'>
            <div className='flex justify-between items-center mb-5'><div><h1 className='text-2xl font-bold'>Seller Management</h1><p className='text-gray-500'>Manage and approve sellers</p></div></div>

            <div className='grid grid-cols-5 gap-4 mb-6'>
                <Card><CardContent className='p-4'><div className='flex items-center justify-between'><div><p className='text-gray-500 text-sm'>Total Sellers</p><p className='text-2xl font-bold'>{stats.total}</p></div><Store className='h-8 w-8 text-blue-500' /></div></CardContent></Card>
                <Card><CardContent className='p-4'><div className='flex items-center justify-between'><div><p className='text-gray-500 text-sm'>Pending</p><p className='text-2xl font-bold text-yellow-600'>{stats.pending}</p></div><UserCheck className='h-8 w-8 text-yellow-500' /></div></CardContent></Card>
                <Card><CardContent className='p-4'><div className='flex items-center justify-between'><div><p className='text-gray-500 text-sm'>Approved</p><p className='text-2xl font-bold text-green-600'>{stats.approved}</p></div><CheckCircle className='h-8 w-8 text-green-500' /></div></CardContent></Card>
                <Card><CardContent className='p-4'><div className='flex items-center justify-between'><div><p className='text-gray-500 text-sm'>Thrift</p><p className='text-2xl font-bold'>{stats.thrift}</p></div><Store className='h-8 w-8 text-purple-500' /></div></CardContent></Card>
                <Card><CardContent className='p-4'><div className='flex items-center justify-between'><div><p className='text-gray-500 text-sm'>Brand</p><p className='text-2xl font-bold'>{stats.brand}</p></div><Store className='h-8 w-8 text-indigo-500' /></div></CardContent></Card>
            </div>

            <div className='flex gap-4 mb-4'>
                <div className='relative flex-1 max-w-md'><Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' /><Input placeholder="Search by name, seller ID, store or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' /></div>
                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className='w-[160px]'><SelectValue placeholder="Filter by status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className='w-[160px]'><SelectValue placeholder="Filter by type" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="thrift_seller">Thrift Sellers</SelectItem><SelectItem value="brand_seller">Brand Sellers</SelectItem></SelectContent></Select>
            </div>

            <Card>
                <CardHeader><h2 className='text-lg font-semibold'>Sellers List</h2></CardHeader>
                <CardContent>
                    {loading ? <div className='text-center py-10'>Loading...</div> : filteredSellers.length === 0 ? <div className='text-center py-10 text-gray-500'><Store className='h-12 w-12 mx-auto text-gray-300 mb-3' /><p>No sellers found</p></div> : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Seller ID</TableHead><TableHead>Store Name</TableHead><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead className='text-right'>Actions</TableHead></TableRow></TableHeader>
                            <TableBody>{filteredSellers.map((seller) => (
                                <TableRow key={seller._id}>
                                    <TableCell><code className='bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs'>{seller.sellerId}</code></TableCell>
                                    <TableCell><div className='flex items-center gap-2'><Image src={getImageUrl(seller.sellerProfile?.storeLogo)} width={30} height={30} alt="" className='rounded-full object-cover' onError={(e) => { e.target.style.display = 'none' }} /><span className='font-medium'>{seller.sellerProfile?.storeName || '—'}</span></div></TableCell>
                                    <TableCell>{seller.name}</TableCell>
                                    <TableCell>{seller.phone}</TableCell>
                                    <TableCell><Badge variant="outline">{getRoleDisplayName(seller.role)}</Badge></TableCell>
                                    <TableCell><Badge className={getSellerApprovalColor(seller.sellerProfile?.approvalStatus)}>{seller.sellerProfile?.approvalStatus || 'pending'}</Badge></TableCell>
                                    <TableCell>{formatDate(seller.createdAt)}</TableCell>
                                    <TableCell className='text-right'><div className='flex justify-end gap-2'>
                                        <Link href={ADMIN_SELLER_DETAILS(seller.sellerId)}><Button variant="ghost" size="icon"><Eye className='h-4 w-4' /></Button></Link>
                                        {seller.sellerProfile?.approvalStatus === 'pending' && <><Button variant="ghost" size="icon" className='text-green-600' onClick={() => handleApprove(seller.sellerId)}><CheckCircle className='h-4 w-4' /></Button><Button variant="ghost" size="icon" className='text-red-600' onClick={() => handleReject(seller.sellerId)}><XCircle className='h-4 w-4' /></Button></>}
                                        {seller.sellerProfile?.approvalStatus === 'approved' && (seller.sellerProfile?.isActive ? <Button variant="ghost" size="icon" className='text-orange-600' onClick={() => handleSuspend(seller.sellerId)}><UserX className='h-4 w-4' /></Button> : <Button variant="ghost" size="icon" className='text-green-600' onClick={() => handleActivate(seller.sellerId)}><UserCheck className='h-4 w-4' /></Button>)}
                                    </div></TableCell>
                                </TableRow>
                            ))}</TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default AdminSellersPage