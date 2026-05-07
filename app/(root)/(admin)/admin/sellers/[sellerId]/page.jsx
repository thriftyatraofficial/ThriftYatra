'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getImageUrl } from '@/lib/imageUtils'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Store, Package, ShoppingBag, Wallet, Building2, Phone, Mail, MapPin, Instagram, Globe, MessageCircle, User, Star, CheckCircle, XCircle, AlertCircle, CreditCard, Truck, RotateCcw, Clock, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const getSellerApprovalColor = (status) => {
    const colors = { pending: 'bg-yellow-600 text-white', approved: 'bg-green-600 text-white', rejected: 'bg-red-600 text-white', suspended: 'bg-gray-600 text-white' }
    return colors[status] || 'bg-gray-600 text-white'
}

const SellerDetailsPage = () => {
    const params = useParams()
    const router = useRouter()
    const sellerId = params.sellerId
    const [loading, setLoading] = useState(true)
    const [seller, setSeller] = useState(null)
    const [products, setProducts] = useState([])
    const [orders, setOrders] = useState([])
    const [wallet, setWallet] = useState(null)
    const [transactions, setTransactions] = useState([])
    const [bankDetails, setBankDetails] = useState(null)
    const [payouts, setPayouts] = useState([])
    const [stats, setStats] = useState({ totalProducts: 0, activeProducts: 0, soldOut: 0, totalOrders: 0, totalSales: 0, totalEarnings: 0, pendingEarnings: 0, withdrawnAmount: 0 })

    useEffect(() => { if (sellerId) fetchSellerData() }, [sellerId])

    const fetchSellerData = async () => {
        try {
            setLoading(true)
            const sellerRes = await axios.get(`/api/admin/sellers/${sellerId}`)
            if (sellerRes.data.success) setSeller(sellerRes.data.data)
            else { showToast('error', 'Seller not found'); return }

            const [productsRes, ordersRes, walletRes, transactionsRes, bankRes, payoutsRes] = await Promise.all([
                axios.get(`/api/admin/sellers/${sellerId}/products`).catch(() => ({ data: { success: false, data: { products: [], stats: {} } } })),
                axios.get(`/api/admin/sellers/${sellerId}/orders`).catch(() => ({ data: { success: false, data: { orders: [], totalSales: 0 } } })),
                axios.get(`/api/admin/sellers/${sellerId}/wallet`).catch(() => ({ data: { success: false, data: {} } })),
                axios.get(`/api/admin/sellers/${sellerId}/transactions`).catch(() => ({ data: { success: false, data: [] } })),
                axios.get(`/api/admin/sellers/${sellerId}/bank`).catch(() => ({ data: { success: false, data: null } })),
                axios.get(`/api/admin/sellers/${sellerId}/payouts`).catch(() => ({ data: { success: false, data: [] } }))
            ])

            if (productsRes.data.success) { setProducts(productsRes.data.data.products || []); setStats(prev => ({ ...prev, totalProducts: productsRes.data.data.stats?.totalProducts || 0, activeProducts: productsRes.data.data.stats?.activeProducts || 0, soldOut: productsRes.data.data.stats?.soldOut || 0 })) }
            if (ordersRes.data.success) { setOrders(ordersRes.data.data.orders || []); setStats(prev => ({ ...prev, totalOrders: ordersRes.data.data.orders?.length || 0, totalSales: ordersRes.data.data.totalSales || 0 })) }
            if (walletRes.data.success) { setWallet(walletRes.data.data); setStats(prev => ({ ...prev, totalEarnings: walletRes.data.data?.totalEarned || 0, pendingEarnings: walletRes.data.data?.pendingAmount || 0, withdrawnAmount: walletRes.data.data?.withdrawnAmount || 0 })) }
            if (transactionsRes.data.success) setTransactions(transactionsRes.data.data || [])
            if (bankRes.data.success) setBankDetails(bankRes.data.data)
            if (payoutsRes.data.success) setPayouts(payoutsRes.data.data || [])
        } catch (error) { console.error('Failed to load seller data:', error); showToast('error', 'Failed to load seller data') }
        finally { setLoading(false) }
    }

    const handleApprove = async () => { try { await axios.put('/api/admin/sellers', { sellerId, action: 'approve' }); showToast('success', 'Seller approved'); fetchSellerData() } catch { showToast('error', 'Failed to approve seller') } }
    const handleReject = async () => { try { await axios.put('/api/admin/sellers', { sellerId, action: 'reject' }); showToast('success', 'Seller rejected'); fetchSellerData() } catch { showToast('error', 'Failed to reject seller') } }
    const handleSuspend = async () => { try { await axios.put('/api/admin/sellers', { sellerId, action: 'suspend' }); showToast('success', 'Seller suspended'); fetchSellerData() } catch { showToast('error', 'Failed to suspend seller') } }
    const handleActivate = async () => { try { await axios.put('/api/admin/sellers', { sellerId, action: 'activate' }); showToast('success', 'Seller activated'); fetchSellerData() } catch { showToast('error', 'Failed to activate seller') } }

    if (loading) return <div className="flex justify-center items-center h-96"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div><p className="text-gray-500">Loading seller details...</p></div></div>
    if (!seller) return <div className="p-5 text-center"><Store className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">Seller not found</p><Button onClick={() => router.back()} className="mt-3">Go Back</Button></div>

    const isThriftSeller = seller.role === 'thrift_seller'
    const getProductImage = (p) => p.base64Media?.[0]?.secure_url || p.media?.[0]?.secure_url || p.media?.[0]

    return (
        <div className='w-full'>
            {/* Header - KEPT ORIGINAL */}
            <div className='mb-6'>
                <Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Sellers</Button>
                <div className='flex flex-wrap justify-between items-start gap-4'>
                    <div className='flex gap-4'>
                        <Image src={getImageUrl(seller.sellerProfile?.storeLogo)} width={80} height={80} alt="Store" className='rounded-full object-cover border' onError={(e) => { e.target.src = imgPlaceholder.src }} />
                        <div>
                            <h1 className='text-2xl font-bold'>{seller.sellerProfile?.storeName || seller.name}</h1>
                            <p className='text-gray-500'>Seller ID: {seller.sellerId}</p>
                            <div className='flex flex-wrap gap-2 mt-2'>
                                <Badge className={getSellerApprovalColor(seller.sellerProfile?.approvalStatus)}>{seller.sellerProfile?.approvalStatus === 'approved' ? '✓ Approved' : seller.sellerProfile?.approvalStatus === 'pending' ? '⏳ Pending' : '✗ Rejected'}</Badge>
                                <Badge variant="outline" className={isThriftSeller ? 'bg-purple-100' : 'bg-blue-100'}>{isThriftSeller ? 'Thrift Seller' : 'Brand Seller'}</Badge>
                                <Badge variant="outline" className={seller.sellerProfile?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{seller.sellerProfile?.isActive ? '🟢 Active' : '🔴 Suspended'}</Badge>
                            </div>
                        </div>
                    </div>
                    <div className='flex gap-2'>
                        {seller.sellerProfile?.approvalStatus === 'pending' && <><Button onClick={handleApprove} className='bg-green-600 hover:bg-green-700'><CheckCircle className="h-4 w-4 mr-1" /> Approve</Button><Button variant="destructive" onClick={handleReject}><XCircle className="h-4 w-4 mr-1" /> Reject</Button></>}
                        {seller.sellerProfile?.approvalStatus === 'approved' && (seller.sellerProfile?.isActive ? <Button variant="destructive" onClick={handleSuspend}><AlertCircle className="h-4 w-4 mr-1" /> Suspend</Button> : <Button onClick={handleActivate} className='bg-green-600 hover:bg-green-700'><CheckCircle className="h-4 w-4 mr-1" /> Activate</Button>)}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6'>
                <Card><CardContent className='p-3 text-center'><Package className='h-5 w-5 mx-auto mb-1 text-blue-500'/><p className='text-xl font-bold'>{stats.totalProducts}</p><p className='text-xs text-gray-500'>Products</p></CardContent></Card>
                <Card><CardContent className='p-3 text-center'><CheckCircle className='h-5 w-5 mx-auto mb-1 text-green-500'/><p className='text-xl font-bold'>{stats.activeProducts}</p><p className='text-xs text-gray-500'>Active</p></CardContent></Card>
                <Card><CardContent className='p-3 text-center'><Package className='h-5 w-5 mx-auto mb-1 text-gray-500'/><p className='text-xl font-bold'>{stats.soldOut}</p><p className='text-xs text-gray-500'>Sold Out</p></CardContent></Card>
                <Card><CardContent className='p-3 text-center'><ShoppingBag className='h-5 w-5 mx-auto mb-1 text-purple-500'/><p className='text-xl font-bold'>{stats.totalOrders}</p><p className='text-xs text-gray-500'>Orders</p></CardContent></Card>
                <Card><CardContent className='p-3 text-center'><Wallet className='h-5 w-5 mx-auto mb-1 text-blue-500'/><p className='text-lg font-bold'>{formatCurrency(stats.totalSales)}</p><p className='text-xs text-gray-500'>Sales</p></CardContent></Card>
                <Card><CardContent className='p-3 text-center'><Wallet className='h-5 w-5 mx-auto mb-1 text-green-500'/><p className='text-lg font-bold'>{formatCurrency(stats.totalEarnings)}</p><p className='text-xs text-gray-500'>Earned</p></CardContent></Card>
                <Card><CardContent className='p-3 text-center'><Clock className='h-5 w-5 mx-auto mb-1 text-yellow-500'/><p className='text-lg font-bold'>{formatCurrency(stats.pendingEarnings)}</p><p className='text-xs text-gray-500'>Pending</p></CardContent></Card>
                <Card><CardContent className='p-3 text-center'><ArrowUpRight className='h-5 w-5 mx-auto mb-1 text-purple-500'/><p className='text-lg font-bold'>{formatCurrency(stats.withdrawnAmount)}</p><p className='text-xs text-gray-500'>Withdrawn</p></CardContent></Card>
            </div>

            {/* Seller Information Grid - KEPT ORIGINAL */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                {/* Personal Info */}
                <Card>
                    <CardHeader className='pb-2'><h2 className='text-md font-semibold flex items-center gap-2'><User className="h-4 w-4" /> Personal Information</h2></CardHeader>
                    <CardContent className='space-y-2 text-sm'>
                        <p><span className='text-gray-500'>Name:</span> <span className='font-medium'>{seller.name || '—'}</span></p>
                        <p><span className='text-gray-500'>Phone:</span> <span className='font-medium'>{seller.phone || '—'}</span></p>
                        {seller.email && <p><span className='text-gray-500'>Email:</span> <span className='font-medium'>{seller.email}</span></p>}
                        <p><span className='text-gray-500'>Joined:</span> <span className='font-medium'>{formatDate(seller.createdAt)}</span></p>
                        <p><span className='text-gray-500'>Phone Verified:</span> {seller.phoneVerified ? <Badge className='bg-green-600 text-white'>Yes</Badge> : <Badge className='bg-yellow-600 text-white'>No</Badge>}</p>
                    </CardContent>
                </Card>

                {/* Store Info */}
                <Card>
                    <CardHeader className='pb-2'><h2 className='text-md font-semibold flex items-center gap-2'><Store className="h-4 w-4" /> Store Information</h2></CardHeader>
                    <CardContent className='space-y-2 text-sm'>
                        <p><span className='text-gray-500'>Store Name:</span> <span className='font-medium'>{seller.sellerProfile?.storeName || '—'}</span></p>
                        <p><span className='text-gray-500'>Description:</span> <span className='font-medium line-clamp-2'>{seller.sellerProfile?.storeDescription || '—'}</span></p>
                        <p><span className='text-gray-500'>Rating:</span> <span className='font-medium'><Star className="h-3 w-3 inline fill-yellow-400" /> {seller.sellerProfile?.rating?.toFixed(1) || '0.0'}</span></p>
                        <p><span className='text-gray-500'>Total Products:</span> <span className='font-medium'>{seller.sellerProfile?.totalProducts || 0}</span></p>
                        <p><span className='text-gray-500'>Total Sales:</span> <span className='font-medium'>{seller.sellerProfile?.totalSales || 0}</span></p>
                    </CardContent>
                </Card>

                {/* Contact & Social - KEPT ORIGINAL */}
                <Card>
                    <CardHeader className='pb-2'><h2 className='text-md font-semibold flex items-center gap-2'><Phone className="h-4 w-4" /> Contact & Social</h2></CardHeader>
                    <CardContent className='space-y-2 text-sm'>
                        <p className='flex items-center gap-1'><Phone className="h-3 w-3 text-gray-400" /> <span className='font-medium'>{seller.phone || '—'}</span> <span className='text-xs text-gray-400'>(Login)</span></p>
                        {seller.sellerProfile?.phone && <p className='flex items-center gap-1'><Phone className="h-3 w-3 text-gray-400" /> <span className='font-medium'>{seller.sellerProfile.phone}</span> <span className='text-xs text-gray-400'>(Business)</span></p>}
                        {seller.sellerProfile?.whatsapp && <p className='flex items-center gap-1 text-green-600'><MessageCircle className="h-3 w-3" /> <span className='font-medium'>{seller.sellerProfile.whatsapp}</span></p>}
                        {seller.sellerProfile?.instagram && <p className='flex items-center gap-1 text-pink-600'><Instagram className="h-3 w-3" /> <span className='font-medium'>@{seller.sellerProfile.instagram.replace('@', '')}</span></p>}
                        {seller.sellerProfile?.website && <p className='flex items-center gap-1 text-blue-600'><Globe className="h-3 w-3" /> <span className='font-medium'>{seller.sellerProfile.website}</span></p>}
                        {seller.businessDetails?.businessEmail && <p className='flex items-center gap-1'><Mail className="h-3 w-3 text-gray-400" /> <span className='font-medium'>{seller.businessDetails.businessEmail}</span></p>}
                    </CardContent>
                </Card>
            </div>

            {/* Business & Pickup Details */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                <Card>
                    <CardHeader className='pb-2'><h2 className='text-md font-semibold flex items-center gap-2'><Building2 className="h-4 w-4" /> Business Details</h2></CardHeader>
                    <CardContent className='space-y-2 text-sm'>
                        {seller.businessDetails && (seller.businessDetails.gstNumber || seller.businessDetails.panNumber) ? (
                            <>
                                <p><span className='text-gray-500'>GST:</span> {seller.businessDetails.gstNumber || '—'}</p>
                                <p><span className='text-gray-500'>PAN:</span> {seller.businessDetails.panNumber || '—'}</p>
                                <p><span className='text-gray-500'>Business Type:</span> {seller.businessDetails.businessType || '—'}</p>
                            </>
                        ) : <p className='text-gray-400'>No business details</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-2'><h2 className='text-md font-semibold flex items-center gap-2'><MapPin className="h-4 w-4" /> Pickup Address</h2></CardHeader>
                    <CardContent className='space-y-1 text-sm'>
                        {seller.pickupAddress && (seller.pickupAddress.fullName || seller.pickupAddress.address) ? (
                            <>
                                <p className='font-medium'>{seller.pickupAddress.fullName || '—'}</p>
                                <p>{seller.pickupAddress.phone || '—'}</p>
                                <p>{seller.pickupAddress.address || '—'}</p>
                                <p>{seller.pickupAddress.city}{seller.pickupAddress.state ? `, ${seller.pickupAddress.state}` : ''} {seller.pickupAddress.pincode ? `- ${seller.pickupAddress.pincode}` : ''}</p>
                                {seller.pickupAddress.landmark && <p>Landmark: {seller.pickupAddress.landmark}</p>}
                            </>
                        ) : <p className='text-gray-400'>No pickup address</p>}
                    </CardContent>
                </Card>
            </div>

            {/* Shipping & Return Settings */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                <Card>
                    <CardHeader className='pb-2'><h2 className='text-md font-semibold flex items-center gap-2'><Truck className="h-4 w-4" /> Shipping Settings</h2></CardHeader>
                    <CardContent className='space-y-2 text-sm'>
                        {seller.shippingSettings ? (
                            <>
                                <p><span className='text-gray-500'>Handling Time:</span> {seller.shippingSettings.handlingDays || 2} days</p>
                                <p><span className='text-gray-500'>Shipping Charge:</span> {formatCurrency(seller.shippingSettings.shippingCharge || 0)}</p>
                                <p><span className='text-gray-500'>Free Shipping Above:</span> {formatCurrency(seller.shippingSettings.freeShippingAbove || 0)}</p>
                            </>
                        ) : <p className='text-gray-400'>Default settings</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-2'><h2 className='text-md font-semibold flex items-center gap-2'><RotateCcw className="h-4 w-4" /> Return Policy</h2></CardHeader>
                    <CardContent className='space-y-2 text-sm'>
                        {seller.returnPolicy ? (
                            <>
                                <p><span className='text-gray-500'>Accept Returns:</span> {seller.returnPolicy.acceptReturns ? <Badge className='bg-green-600 text-white'>Yes</Badge> : <Badge className='bg-gray-600 text-white'>No</Badge>}</p>
                                {seller.returnPolicy.acceptReturns && <><p><span className='text-gray-500'>Return Window:</span> {seller.returnPolicy.returnWindow || 7} days</p><p><span className='text-gray-500'>Conditions:</span> {seller.returnPolicy.returnConditions || '—'}</p></>}
                            </>
                        ) : <p className='text-gray-400'>Default policy</p>}
                    </CardContent>
                </Card>
            </div>

            {/* Tabs - FULLY RESTORED */}
            <Tabs defaultValue="products" className="w-full">
                <TabsList className="grid grid-cols-5 mb-4">
                    <TabsTrigger value="products"><Package className="h-4 w-4 mr-1" /> Products ({products.length})</TabsTrigger>
                    <TabsTrigger value="orders"><ShoppingBag className="h-4 w-4 mr-1" /> Orders ({orders.length})</TabsTrigger>
                    <TabsTrigger value="bank"><Building2 className="h-4 w-4 mr-1" /> Bank Details</TabsTrigger>
                    <TabsTrigger value="earnings"><Wallet className="h-4 w-4 mr-1" /> Earnings</TabsTrigger>
                    <TabsTrigger value="payouts"><CreditCard className="h-4 w-4 mr-1" /> Payouts</TabsTrigger>
                </TabsList>

                {/* Products Tab */}
                <TabsContent value="products">
                    <Card><CardHeader><h2 className='text-lg font-semibold'>Products ({products.length})</h2></CardHeader>
                        <CardContent>{products.length === 0 ? <p className='text-center text-gray-500 py-8'>No products yet</p> : (
                            <Table><TableHeader><TableRow><TableHead>Image</TableHead><TableHead>Name</TableHead><TableHead>SKU</TableHead><TableHead>Type</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                <TableBody>{products.slice(0, 20).map(p => (
                                    <TableRow key={p._id}><TableCell><Image src={getImageUrl(getProductImage(p))} width={40} height={40} alt={p.name} className='rounded object-cover' onError={(e) => { e.target.src = imgPlaceholder.src }} /></TableCell><TableCell className='font-medium'>{p.name}</TableCell><TableCell><code className='text-xs'>{p.uniqueCode}</code></TableCell><TableCell><Badge variant='outline'>{p.productType === 'thrift' ? 'Thrift' : 'Brand New'}</Badge></TableCell><TableCell>{formatCurrency(p.sellingPrice)}</TableCell><TableCell><Badge className={p.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}>{p.status}</Badge></TableCell></TableRow>
                                ))}</TableBody>
                            </Table>
                        )}</CardContent>
                    </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders">
                    <Card><CardHeader><h2 className='text-lg font-semibold'>Orders ({orders.length})</h2></CardHeader>
                        <CardContent>{orders.length === 0 ? <p className='text-center text-gray-500 py-8'>No orders yet</p> : (
                            <Table><TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Product</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                                <TableBody>{orders.slice(0, 20).map(o => (
                                    <TableRow key={o._id}><TableCell className='font-mono text-xs'>{o.orderId}</TableCell><TableCell>{o.productName}</TableCell><TableCell>{formatCurrency(o.amount)}</TableCell><TableCell><Badge className={o.status === 'delivered' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}>{o.status}</Badge></TableCell><TableCell>{formatDate(o.createdAt)}</TableCell></TableRow>
                                ))}</TableBody>
                            </Table>
                        )}</CardContent>
                    </Card>
                </TabsContent>

                {/* Bank Details Tab */}
                <TabsContent value="bank">
                    <Card><CardHeader><h2 className='text-lg font-semibold'>Bank Account Details</h2></CardHeader>
                        <CardContent>{bankDetails ? (
                            <div className='bg-gray-50 p-6 rounded-lg max-w-2xl'>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div><p className='text-sm text-gray-500'>Account Holder</p><p className='font-medium text-lg'>{bankDetails.accountHolderName}</p></div>
                                    <div><p className='text-sm text-gray-500'>Bank Name</p><p className='font-medium text-lg'>{bankDetails.bankName}</p></div>
                                    <div><p className='text-sm text-gray-500'>Account Number</p><p className='font-mono text-lg'>{bankDetails.accountNumber}</p></div>
                                    <div><p className='text-sm text-gray-500'>IFSC Code</p><p className='font-mono text-lg'>{bankDetails.ifscCode}</p></div>
                                    {bankDetails.upiId && <div className='col-span-2'><p className='text-sm text-gray-500'>UPI ID</p><p className='font-mono text-lg'>{bankDetails.upiId}</p></div>}
                                </div>
                            </div>
                        ) : <p className='text-center text-gray-500 py-8'>No bank details added</p>}</CardContent>
                    </Card>
                </TabsContent>

                {/* Earnings Tab */}
                <TabsContent value="earnings">
                    <Card><CardHeader><h2 className='text-lg font-semibold'>Earnings & Transactions</h2></CardHeader>
                        <CardContent>
                            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                                <div className='bg-blue-50 p-4 rounded'><p className='text-sm text-blue-600'>Total Earned</p><p className='text-2xl font-bold text-blue-700'>{formatCurrency(wallet?.totalEarned || 0)}</p></div>
                                <div className='bg-yellow-50 p-4 rounded'><p className='text-sm text-yellow-600'>Pending</p><p className='text-2xl font-bold text-yellow-700'>{formatCurrency(wallet?.pendingAmount || 0)}</p></div>
                                <div className='bg-green-50 p-4 rounded'><p className='text-sm text-green-600'>Available</p><p className='text-2xl font-bold text-green-700'>{formatCurrency(wallet?.availableBalance || 0)}</p></div>
                                <div className='bg-purple-50 p-4 rounded'><p className='text-sm text-purple-600'>Withdrawn</p><p className='text-2xl font-bold text-purple-700'>{formatCurrency(wallet?.withdrawnAmount || 0)}</p></div>
                            </div>
                            <h3 className='font-medium mb-3'>Recent Transactions</h3>
                            {transactions.length === 0 ? <p className='text-gray-500'>No transactions yet</p> : (
                                <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>{transactions.slice(0, 10).map(tx => (
                                        <TableRow key={tx._id}><TableCell>{formatDate(tx.createdAt)}</TableCell><TableCell>{tx.description}</TableCell><TableCell><Badge className={tx.type === 'credit' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>{tx.type}</Badge></TableCell><TableCell className={tx.type === 'credit' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}</TableCell></TableRow>
                                    ))}</TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Payouts Tab */}
                <TabsContent value="payouts">
                    <Card><CardHeader><h2 className='text-lg font-semibold'>Payout History</h2></CardHeader>
                        <CardContent>{payouts.length === 0 ? <p className='text-center text-gray-500 py-8'>No payout requests yet</p> : (
                            <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Reference</TableHead></TableRow></TableHeader>
                                <TableBody>{payouts.map(p => (
                                    <TableRow key={p._id}><TableCell>{formatDate(p.createdAt)}</TableCell><TableCell className='font-semibold'>{formatCurrency(p.amount)}</TableCell><TableCell><Badge className={p.status === 'completed' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}>{p.status}</Badge></TableCell><TableCell className='font-mono text-xs'>{p.transactionId || '—'}</TableCell></TableRow>
                                ))}</TableBody>
                            </Table>
                        )}</CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default SellerDetailsPage