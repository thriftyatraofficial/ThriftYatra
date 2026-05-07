'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useParams, useRouter } from 'next/navigation'
import { 
    ArrowLeft, User, Phone, Mail, MapPin, ShoppingBag, 
    Star, Heart, TrendingUp, Wallet, Package, Clock, CheckCircle
} from 'lucide-react'
import Image from 'next/image'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const UserDetailsPage = () => {
    const params = useParams()
    const router = useRouter()
    const userId = params.userId
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)
    const [orders, setOrders] = useState([])
    const [reviews, setReviews] = useState([])
    const [wishlist, setWishlist] = useState([])
    const [addresses, setAddresses] = useState([])
    const [activeTab, setActiveTab] = useState('orders')
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalSpent: 0,
        avgOrderValue: 0,
        reviewsCount: 0,
        wishlistCount: 0
    })

    useEffect(() => {
        fetchUserData()
    }, [userId])

    const fetchUserData = async () => {
        try {
            setLoading(true)
            const [userRes, ordersRes, reviewsRes, wishlistRes] = await Promise.all([
                axios.get(`/api/admin/users/${userId}`),
                axios.get(`/api/admin/users/${userId}/orders`),
                axios.get(`/api/admin/users/${userId}/reviews`),
                axios.get(`/api/admin/users/${userId}/wishlist`).catch(() => ({ data: { data: [] } }))
            ])

            if (userRes.data.success) {
                setUser(userRes.data.data)
                setAddresses(userRes.data.data.addresses || [])
            }
            if (ordersRes.data.success) {
                const orderData = ordersRes.data.data.orders || []
                setOrders(orderData)
                const totalSpent = orderData.reduce((s, o) => s + (o.totalAmount || 0), 0)
                setStats(prev => ({
                    ...prev,
                    totalOrders: orderData.length,
                    totalSpent,
                    avgOrderValue: orderData.length ? totalSpent / orderData.length : 0
                }))
            }
            if (reviewsRes.data.success) {
                setReviews(reviewsRes.data.data || [])
                setStats(prev => ({ ...prev, reviewsCount: reviewsRes.data.data?.length || 0 }))
            }
            if (wishlistRes.data.success) {
                setWishlist(wishlistRes.data.data || [])
                setStats(prev => ({ ...prev, wishlistCount: wishlistRes.data.data?.length || 0 }))
            }
        } catch (error) {
            showToast('error', 'Failed to load user data')
        } finally {
            setLoading(false)
        }
    }

    const tabs = [
        { id: 'orders', label: 'Orders', icon: ShoppingBag, count: orders.length },
        { id: 'reviews', label: 'Reviews', icon: Star, count: reviews.length },
        { id: 'wishlist', label: 'Wishlist', icon: Heart, count: wishlist.length },
        { id: 'addresses', label: 'Addresses', icon: MapPin, count: addresses.length },
    ]

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading user details...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="p-5 text-center">
                <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">User not found</p>
                <Button onClick={() => router.back()} className="mt-3">Go Back</Button>
            </div>
        )
    }

    return (
        <div className='w-full'>
            {/* Header */}
            <div className='mb-6'>
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Customers
                </Button>
                
                <div className='flex justify-between items-start'>
                    <div className='flex gap-4'>
                        {user.avatar?.url ? (
                            <Image src={user.avatar.url} width={64} height={64} alt={user.name} className='rounded-full object-cover' />
                        ) : (
                            <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center'>
                                <User className="h-8 w-8 text-gray-500" />
                            </div>
                        )}
                        <div>
                            <h1 className='text-2xl font-bold'>{user.name}</h1>
                            <div className='flex flex-wrap gap-2 mt-2'>
                                <Badge variant="outline">Customer</Badge>
                                {user.phoneVerified ? (
                                    <Badge className='bg-green-100 text-green-800'><CheckCircle className="h-3 w-3 mr-1" /> Phone Verified</Badge>
                                ) : (
                                    <Badge className='bg-yellow-100 text-yellow-800'><Clock className="h-3 w-3 mr-1" /> Unverified</Badge>
                                )}
                                {user.email && (
                                    <Badge variant="outline"><Mail className="h-3 w-3 mr-1" /> {user.email}</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Info Bar */}
            <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 flex flex-wrap gap-6'>
                <div className='flex items-center gap-2'><Phone className="h-4 w-4 text-gray-500" /><span className='font-medium'>{user.phone}</span></div>
                {user.email && <div className='flex items-center gap-2'><Mail className="h-4 w-4 text-gray-500" /><span>{user.email}</span></div>}
                <div className='flex items-center gap-2'><Calendar className="h-4 w-4 text-gray-500" /><span>Joined: {formatDate(user.createdAt)}</span></div>
            </div>

            {/* Quick Stats */}
            <div className='grid grid-cols-5 gap-3 mb-6'>
                <Card><CardContent className='p-3 text-center'><ShoppingBag className='h-5 w-5 mx-auto mb-1 text-blue-500'/><p className='text-xl font-bold'>{stats.totalOrders}</p><p className='text-xs text-gray-500'>Total Orders</p></CardContent></Card>
                <Card><CardContent className='p-3 text-center'><Wallet className='h-5 w-5 mx-auto mb-1 text-green-500'/><p className='text-lg font-bold'>{formatCurrency(stats.totalSpent)}</p><p className='text-xs text-gray-500'>Total Spent</p></CardContent></Card>
                <Card><CardContent className='p-3 text-center'><TrendingUp className='h-5 w-5 mx-auto mb-1 text-purple-500'/><p className='text-lg font-bold'>{formatCurrency(stats.avgOrderValue)}</p><p className='text-xs text-gray-500'>Avg Order</p></CardContent></Card>
                <Card><CardContent className='p-3 text-center'><Star className='h-5 w-5 mx-auto mb-1 text-yellow-500'/><p className='text-xl font-bold'>{stats.reviewsCount}</p><p className='text-xs text-gray-500'>Reviews</p></CardContent></Card>
                <Card><CardContent className='p-3 text-center'><Heart className='h-5 w-5 mx-auto mb-1 text-red-500'/><p className='text-xl font-bold'>{stats.wishlistCount}</p><p className='text-xs text-gray-500'>Wishlist</p></CardContent></Card>
            </div>

            {/* Tab Navigation */}
            <div className='flex gap-2 mb-4 border-b'>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                            activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                        <Badge variant="outline" className="ml-1">{tab.count}</Badge>
                    </button>
                ))}
            </div>

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <Card>
                    <CardHeader><h2 className='text-lg font-semibold'>Order History</h2></CardHeader>
                    <CardContent>
                        {orders.length === 0 ? (
                            <div className='text-center py-8 text-gray-500'>
                                <Package className='h-12 w-12 mx-auto text-gray-300 mb-3' />
                                <p>No orders yet</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map(order => (
                                        <TableRow key={order._id} className='cursor-pointer hover:bg-gray-50' onClick={() => router.push(`/admin/orders/details/${order.orderId}`)}>
                                            <TableCell className='font-mono text-xs'>{order.orderId}</TableCell>
                                            <TableCell>{order.products?.length || order.items?.length || 1} item(s)</TableCell>
                                            <TableCell className='font-semibold'>{formatCurrency(order.totalAmount)}</TableCell>
                                            <TableCell><Badge variant='outline'>{order.paymentMethod === 'cod' ? 'COD' : 'Online'}</Badge></TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    order.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                                    order.deliveryStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                    order.deliveryStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }>
                                                    {order.deliveryStatus || order.status || 'pending'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(order.createdAt)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
                <Card>
                    <CardHeader><h2 className='text-lg font-semibold'>Product Reviews</h2></CardHeader>
                    <CardContent>
                        {reviews.length === 0 ? (
                            <div className='text-center py-8 text-gray-500'>
                                <Star className='h-12 w-12 mx-auto text-gray-300 mb-3' />
                                <p>No reviews yet</p>
                            </div>
                        ) : (
                            <div className='space-y-4'>
                                {reviews.map(review => (
                                    <div key={review._id} className='border rounded-lg p-4'>
                                        <div className='flex items-center justify-between mb-2'>
                                            <div className='flex items-center gap-3'>
                                                <Image src={review.productImage || imgPlaceholder.src} width={40} height={40} alt={review.productName} className='rounded object-cover' />
                                                <span className='font-medium'>{review.productName}</span>
                                            </div>
                                            <div className='flex items-center gap-1'>
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className='text-sm text-gray-600'>{review.review}</p>
                                        <p className='text-xs text-gray-400 mt-2'>{formatDate(review.createdAt)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
                <Card>
                    <CardHeader><h2 className='text-lg font-semibold'>Wishlist Items</h2></CardHeader>
                    <CardContent>
                        {wishlist.length === 0 ? (
                            <div className='text-center py-8 text-gray-500'>
                                <Heart className='h-12 w-12 mx-auto text-gray-300 mb-3' />
                                <p>No wishlist items</p>
                            </div>
                        ) : (
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                {wishlist.map(item => (
                                    <div key={item._id} className='flex gap-3 border rounded-lg p-3'>
                                        <Image src={item.productImage || imgPlaceholder.src} width={50} height={50} alt={item.productName} className='rounded object-cover' />
                                        <div className='flex-1'>
                                            <p className='font-medium text-sm'>{item.productName}</p>
                                            <p className='text-sm text-gray-500'>{formatCurrency(item.price)}</p>
                                            <p className='text-xs text-gray-400'>Added {formatDate(item.addedAt)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
                <Card>
                    <CardHeader><h2 className='text-lg font-semibold'>Saved Addresses</h2></CardHeader>
                    <CardContent>
                        {addresses.length === 0 ? (
                            <div className='text-center py-8 text-gray-500'>
                                <MapPin className='h-12 w-12 mx-auto text-gray-300 mb-3' />
                                <p>No saved addresses</p>
                            </div>
                        ) : (
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                {addresses.map((addr, i) => (
                                    <div key={i} className='bg-gray-50 dark:bg-gray-800 p-4 rounded-lg relative'>
                                        {addr.isDefault && <Badge className='absolute top-2 right-2 bg-green-100 text-green-800'>Default</Badge>}
                                        <p className='font-medium text-lg mb-1'>{addr.fullName}</p>
                                        <p className='text-sm flex items-center gap-1 mb-1'><Phone className="h-3 w-3" /> {addr.phone}</p>
                                        <p className='text-sm'>{addr.street}</p>
                                        <p className='text-sm'>{addr.city}, {addr.state} - {addr.pincode}</p>
                                        <p className='text-sm'>{addr.country}</p>
                                        {addr.landmark && <p className='text-sm text-gray-500 mt-1'>📍 {addr.landmark}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default UserDetailsPage