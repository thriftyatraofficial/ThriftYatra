'use client'
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { Package, ShoppingBag, TrendingUp, Search, Eye, Edit, Trash2, Ban, CheckCircle } from 'lucide-react'
import { formatCurrency, getConditionDisplay } from '@/lib/utils'
import { getImageUrl } from '@/lib/imageUtils'
import { showToast } from '@/lib/showToast'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const ThriftSellerDashboard = () => {
    const { auth } = useSelector(state => state.authStore)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [stats, setStats] = useState({ totalProducts: 0, activeProducts: 0, soldProducts: 0, totalOrders: 0, totalSales: 0, totalEarnings: 0, deliveryFees: 0, netEarnings: 0, rating: 0 })
    const [recentOrders, setRecentOrders] = useState([])
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)

    useEffect(() => { fetchDashboardData(); fetchProducts() }, [])
    useEffect(() => { filterProducts() }, [searchTerm, products])

    const fetchDashboardData = async () => {
        try {
            const { data } = await axios.get('/api/seller/dashboard?type=thrift')
            if (data.success) { setStats(data.data.stats); setRecentOrders(data.data.recentOrders || []) }
        } catch (error) { console.error('Dashboard error:', error) }
    }

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/seller/products?type=thrift&limit=100')
            if (data.success) { setProducts(data.data.products); setFilteredProducts(data.data.products) }
        } catch (error) { showToast('error', 'Failed to load products') }
        finally { setLoading(false) }
    }

    const filterProducts = () => {
        if (!searchTerm) { setFilteredProducts(products); return }
        setFilteredProducts(products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.uniqueCode?.toLowerCase().includes(searchTerm.toLowerCase()) || p.condition?.toLowerCase().includes(searchTerm.toLowerCase())))
    }

    const handleMarkAsSold = async (productId) => {
        try { await axios.put(`/api/seller/products/${productId}/status`, { status: 'sold_out' }); showToast('success', 'Product marked as sold'); fetchProducts(); fetchDashboardData() }
        catch { showToast('error', 'Failed to update status') }
    }

    const handleMarkAsActive = async (productId) => {
        try { await axios.put(`/api/seller/products/${productId}/status`, { status: 'active' }); showToast('success', 'Product marked as active'); fetchProducts(); fetchDashboardData() }
        catch { showToast('error', 'Failed to update status') }
    }

    const handleDelete = async () => {
        if (!selectedProduct) return
        try { await axios.delete(`/api/seller/products/${selectedProduct._id}`); showToast('success', 'Product deleted'); setDeleteDialogOpen(false); fetchProducts(); fetchDashboardData() }
        catch { showToast('error', 'Failed to delete product') }
    }

    const getProductImage = (product) => {
        return product.base64Media?.[0]?.secure_url || product.media?.[0]?.secure_url || product.media?.[0]
    }

    const statCards = [
        { title: 'Active Products', value: stats.activeProducts, icon: Package, color: 'bg-blue-500', onClick: () => router.push('/seller/thrift/products') },
        { title: 'Sold Products', value: stats.soldProducts, icon: CheckCircle, color: 'bg-green-500', onClick: () => setSearchTerm('sold') },
        { title: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-purple-500', onClick: () => router.push('/seller/thrift/orders') },
        { title: 'Net Earnings', value: formatCurrency(stats.netEarnings), icon: TrendingUp, color: 'bg-emerald-500', onClick: () => router.push('/seller/thrift/earnings') }
    ]

    return (
        <div className='w-full'>
            <div className='flex justify-between items-center mb-5'>
                <div><h1 className='text-2xl font-bold'>Thrift Seller Dashboard</h1><p className='text-gray-500'>Seller ID: {auth?.sellerId} | Store: {auth?.sellerProfile?.storeName || 'My Store'}</p></div>
                <Link href="/seller/thrift/products/add"><Button>+ Add Thrift Item</Button></Link>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8'>
                {statCards.map((stat, index) => (
                    <Card key={index} className='cursor-pointer hover:shadow-lg transition-shadow' onClick={stat.onClick}>
                        <CardContent className='p-5'><div className='flex items-center justify-between'><div><p className='text-gray-500 text-sm'>{stat.title}</p><p className='text-2xl font-bold mt-1'>{stat.value}</p></div><div className={`${stat.color} p-3 rounded-full text-white`}><stat.icon size={24} /></div></div></CardContent>
                    </Card>
                ))}
            </div>

            <Card className='mb-8'>
                <CardHeader><h2 className='text-lg font-semibold'>Earnings Summary</h2></CardHeader>
                <CardContent>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
                        <div className='cursor-pointer hover:bg-gray-50 p-3 rounded-lg' onClick={() => router.push('/seller/thrift/orders')}><p className='text-gray-500 text-sm'>Total Sales</p><p className='text-xl font-bold'>{formatCurrency(stats.totalSales)}</p></div>
                        <div className='cursor-pointer hover:bg-gray-50 p-3 rounded-lg' onClick={() => router.push('/seller/thrift/earnings')}><p className='text-gray-500 text-sm'>Delivery Fees</p><p className='text-xl font-bold text-orange-600'>{formatCurrency(stats.deliveryFees)}</p></div>
                        <div className='cursor-pointer hover:bg-gray-50 p-3 rounded-lg' onClick={() => router.push('/seller/thrift/earnings')}><p className='text-gray-500 text-sm'>Gross Earnings</p><p className='text-xl font-bold text-blue-600'>{formatCurrency(stats.totalEarnings)}</p></div>
                        <div className='cursor-pointer hover:bg-gray-50 p-3 rounded-lg' onClick={() => router.push('/seller/thrift/earnings')}><p className='text-gray-500 text-sm'>Net Earnings</p><p className='text-xl font-bold text-green-600'>{formatCurrency(stats.netEarnings)}</p></div>
                    </div>
                </CardContent>
            </Card>

            <div className='mb-4 relative'><Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' /><Input placeholder="Search by name, SKU, or condition..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' /></div>

            <Card>
                <CardHeader className='flex flex-row items-center justify-between'><h2 className='text-lg font-semibold'>My Products</h2><Link href="/seller/thrift/products"><Button variant="outline" size="sm">View All</Button></Link></CardHeader>
                <CardContent>
                    {loading ? <div className='text-center py-10'><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div><p className="text-gray-500">Loading products...</p></div> :
                     filteredProducts.length === 0 ? <div className='text-center py-10 text-gray-500'>{searchTerm ? 'No products match your search' : <><Package className='h-12 w-12 mx-auto text-gray-300 mb-3' /><p>No products yet</p><Link href="/seller/thrift/products/add"><Button className='mt-3'>Add Your First Product</Button></Link></>}</div> : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Image</TableHead><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Condition</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead className='text-right'>Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {filteredProducts.slice(0, 10).map((product) => (
                                    <TableRow key={product._id}>
                                        <TableCell><Image src={getImageUrl(getProductImage(product))} width={40} height={40} alt={product.name} className='rounded object-cover w-10 h-10' onError={(e) => { e.target.src = imgPlaceholder.src }} /></TableCell>
                                        <TableCell><p className='font-medium'>{product.name}</p></TableCell>
                                        <TableCell><code className='text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded'>{product.uniqueCode || '—'}</code></TableCell>
                                        <TableCell><Badge variant="outline">{getConditionDisplay(product.condition)}</Badge></TableCell>
                                        <TableCell className='font-semibold'>{formatCurrency(product.sellingPrice)}</TableCell>
                                        <TableCell><Badge className={product.status === 'active' ? 'bg-green-100 text-green-800' : product.status === 'sold_out' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}>{product.status === 'active' ? 'Active' : product.status === 'sold_out' ? 'Sold Out' : 'Inactive'}</Badge></TableCell>
                                        <TableCell className='text-right'>
                                            <div className='flex justify-end gap-1'>
                                                <Button variant="ghost" size="icon" onClick={() => router.push(`/seller/thrift/products/edit/${product._id}`)} title="Edit"><Edit className='h-4 w-4' /></Button>
                                                {product.status === 'active' ? <Button variant="ghost" size="icon" onClick={() => handleMarkAsSold(product._id)} title="Mark as Sold" className='text-orange-600'><Ban className='h-4 w-4' /></Button> :
                                                 product.status === 'sold_out' ? <Button variant="ghost" size="icon" onClick={() => handleMarkAsActive(product._id)} title="Mark as Active" className='text-green-600'><CheckCircle className='h-4 w-4' /></Button> : null}
                                                <Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(product); setDeleteDialogOpen(true) }} title="Delete" className='text-red-600'><Trash2 className='h-4 w-4' /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Card className='mt-8'>
                <CardHeader className='flex flex-row items-center justify-between'><h2 className='text-lg font-semibold'>Recent Orders</h2><Link href="/seller/thrift/orders"><Button variant="outline" size="sm">View All</Button></Link></CardHeader>
                <CardContent>
                    {recentOrders.length === 0 ? <p className='text-center text-gray-500 py-8'>No orders yet</p> : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Product</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className='text-right'>Action</TableHead></TableRow></TableHeader>
                            <TableBody>{recentOrders.map((order) => (
                                <TableRow key={order.orderId}><TableCell className="font-mono text-xs">{order.orderId}</TableCell><TableCell>{order.productName}</TableCell><TableCell>{formatCurrency(order.amount)}</TableCell>
                                <TableCell><Badge className={order.status === 'delivered' ? 'bg-green-100 text-green-800' : order.status === 'shipped' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>{order.status}</Badge></TableCell>
                                <TableCell className='text-right'><Button variant="ghost" size="icon" onClick={() => router.push(`/seller/thrift/orders/${order.orderId}`)}><Eye className='h-4 w-4' /></Button></TableCell></TableRow>
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

export default ThriftSellerDashboard