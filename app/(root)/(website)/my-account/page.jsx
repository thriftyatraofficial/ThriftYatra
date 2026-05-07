'use client'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import useFetch from '@/hooks/useFetch'
import { WEBSITE_ORDER_DETAILS, WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import Link from 'next/link'
import React, { useEffect } from 'react'
import { HiOutlineShoppingBag } from "react-icons/hi2"
import { IoCartOutline, IoPersonOutline, IoCallOutline, IoMailOutline } from "react-icons/io5"
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const breadCrumbData = {
    title: 'My Account',
    links: [{ label: 'My Account' }]
}

const STATUS_COLORS = {
    pending_verification: 'bg-yellow-600', awaiting_seller: 'bg-blue-600', ready_to_ship: 'bg-purple-600',
    in_transit: 'bg-orange-600', delivered: 'bg-green-600', settlement_pending: 'bg-teal-600',
    completed: 'bg-gray-600', cancelled: 'bg-red-600', unverified: 'bg-gray-500'
}

const STATUS_LABELS = {
    pending_verification: 'Payment Pending', awaiting_seller: 'Seller Preparing', ready_to_ship: 'Ready to Ship',
    in_transit: 'In Transit', delivered: 'Delivered', settlement_pending: 'Completed',
    completed: 'Completed', cancelled: 'Cancelled', unverified: 'Pending'
}

const MyAccount = () => {
    const { data: orderResponse, loading } = useFetch('/api/user-order')
    const cartStore = useSelector(store => store.cartStore)
    const auth = useSelector(store => store.authStore.auth)
    const router = useRouter()

    useEffect(() => {
        if (!auth) { router.push(WEBSITE_LOGIN) }
    }, [auth, router])

    if (!auth) {
        return (
            <div className="flex justify-center items-center h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Redirecting to login...</p>
                </div>
            </div>
        )
    }

    const orders = orderResponse?.data || []

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumbData} />
            <UserPanelLayout>
                <Card className='mb-6'>
                    <CardContent className='p-5'>
                        <div className='flex items-center gap-4'>
                            <div className='w-16 h-16 bg-[#E8B931] rounded-full flex items-center justify-center'>
                                <IoPersonOutline className='text-white' size={30} />
                            </div>
                            <div>
                                <h2 className='text-xl font-bold'>{auth?.name || 'User'}</h2>
                                {auth?.email && <p className='text-gray-500 flex items-center gap-1'><IoMailOutline size={14} /> {auth.email}</p>}
                                {auth?.phone && <p className='text-gray-500 flex items-center gap-1'><IoCallOutline size={14} /> {auth.phone}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className='grid lg:grid-cols-2 grid-cols-1 gap-4 mb-6'>
                    <Card>
                        <CardContent className='p-4 flex items-center justify-between'>
                            <div>
                                <h4 className='font-semibold text-lg mb-1'>Total Orders</h4>
                                <span className='font-semibold text-gray-500 text-2xl'>{orders.length}</span>
                            </div>
                            <div className='w-14 h-14 bg-[#E8B931] rounded-full flex justify-center items-center'>
                                <HiOutlineShoppingBag className='text-white' size={22} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className='p-4 flex items-center justify-between'>
                            <div>
                                <h4 className='font-semibold text-lg mb-1'>Items In Cart</h4>
                                <span className='font-semibold text-gray-500 text-2xl'>{cartStore?.count || 0}</span>
                            </div>
                            <div className='w-14 h-14 bg-[#E8B931] rounded-full flex justify-center items-center'>
                                <IoCartOutline className='text-white' size={22} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className='shadow rounded border'>
                    <div className='p-4 text-lg font-semibold border-b bg-gray-50'>Recent Orders</div>
                    <div className='p-4'>
                        {loading ? (
                            <div className='text-center py-10 text-gray-500'>Loading orders...</div>
                        ) : orders.length === 0 ? (
                            <div className='text-center py-10'>
                                <HiOutlineShoppingBag className='h-12 w-12 mx-auto text-gray-300 mb-3' />
                                <p className='text-gray-500 mb-3'>No orders yet</p>
                                <Link href="/shop"><Button variant="outline">Start Shopping</Button></Link>
                            </div>
                        ) : (
                            <div className='overflow-auto'>
                                <table className='w-full'>
                                    <thead>
                                        <tr className='bg-gray-50'>
                                            <th className='text-start p-2 text-sm border-b text-gray-500'>#</th>
                                            <th className='text-start p-2 text-sm border-b text-gray-500'>Order ID</th>
                                            <th className='text-start p-2 text-sm border-b text-gray-500'>Items</th>
                                            <th className='text-start p-2 text-sm border-b text-gray-500'>Amount</th>
                                            <th className='text-start p-2 text-sm border-b text-gray-500'>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.slice(0, 5).map((order, i) => (
                                            <tr key={order._id} className='hover:bg-gray-50 border-b'>
                                                <td className='text-sm text-gray-500 p-2 font-bold'>{i + 1}</td>
                                                <td className='text-sm text-gray-500 p-2'>
                                                    <Link className='text-blue-600 hover:underline' href={WEBSITE_ORDER_DETAILS(order.order_id)}>
                                                        {order.order_id?.slice(-8)}
                                                    </Link>
                                                </td>
                                                <td className='text-sm text-gray-500 p-2'>{order.products?.length || 0}</td>
                                                <td className='text-sm text-gray-500 p-2 font-medium'>
                                                    ₹{order.totalAmount?.toLocaleString('en-IN')}
                                                </td>
                                                <td className='text-sm p-2'>
                                                    <Badge className={`${STATUS_COLORS[order.status] || 'bg-gray-500'} text-white text-xs`}>
                                                        {STATUS_LABELS[order.status] || order.status || 'Pending'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </UserPanelLayout>
        </div>
    )
}

export default MyAccount