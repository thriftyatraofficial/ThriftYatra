'use client'
import Loading from '@/components/Application/Loading'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import useFetch from '@/hooks/useFetch'
import { WEBSITE_ORDER_DETAILS } from '@/routes/WebsiteRoute'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import React from 'react'

const STATUS_COLORS = {
    pending_verification: 'bg-yellow-600',
    awaiting_seller: 'bg-blue-600',
    ready_to_ship: 'bg-purple-600',
    in_transit: 'bg-orange-600',
    delivered: 'bg-green-600',
    settlement_pending: 'bg-teal-600',
    completed: 'bg-gray-600',
    cancelled: 'bg-red-600',
    rto_initiated: 'bg-pink-600',
    unverified: 'bg-gray-500',
    pending: 'bg-yellow-600',
    processing: 'bg-blue-600',
    shipped: 'bg-purple-600'
}

const STATUS_LABELS = {
    pending_verification: 'Payment Pending',
    awaiting_seller: 'Seller Preparing',
    ready_to_ship: 'Ready to Ship',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    settlement_pending: 'Completed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rto_initiated: 'Returning',
    unverified: 'Pending',
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped'
}

const breadCrumbData = { title: 'Orders', links: [{ label: 'Orders' }] }

const Orders = () => {
    const { data: orderData, loading } = useFetch("/api/user-order")

    const orders = orderData?.data || []

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumbData} />
            <UserPanelLayout>
                <div className='shadow rounded'>
                    <div className='p-5 text-xl font-semibold border-b'>My Orders</div>
                    <div className='p-5'>
                        {loading ? (
                            <div className='text-center py-5'>Loading orders...</div>
                        ) : orders.length === 0 ? (
                            <div className='text-center py-10 text-gray-500'>
                                <p className='text-lg'>No orders yet</p>
                                <Link href="/shop" className='text-[#E8B931] hover:underline mt-2 inline-block'>Start Shopping</Link>
                            </div>
                        ) : (
                            <div className='overflow-auto'>
                                <table className='w-full'>
                                    <thead>
                                        <tr className='bg-gray-50'>
                                            <th className='text-start p-3 text-sm text-gray-500'>#</th>
                                            <th className='text-start p-3 text-sm text-gray-500'>Order ID</th>
                                            <th className='text-start p-3 text-sm text-gray-500'>Items</th>
                                            <th className='text-start p-3 text-sm text-gray-500'>Amount</th>
                                            <th className='text-start p-3 text-sm text-gray-500'>Status</th>
                                            <th className='text-start p-3 text-sm text-gray-500'>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order, i) => {
                                            const statusLabel = STATUS_LABELS[order.status] || order.status || 'Pending'
                                            const statusColor = STATUS_COLORS[order.status] || 'bg-gray-500'
                                            
                                            return (
                                                <tr key={order._id} className='border-b hover:bg-gray-50'>
                                                    <td className='text-sm text-gray-500 p-3 font-bold'>{i + 1}</td>
                                                    <td className='text-sm p-3'>
                                                        <Link 
                                                            className='text-blue-600 hover:underline font-medium' 
                                                            href={WEBSITE_ORDER_DETAILS(order.order_id)}
                                                        >
                                                            #{order.order_id?.slice(-8)}
                                                        </Link>
                                                    </td>
                                                    <td className='text-sm text-gray-500 p-3'>{order.products?.length || 0}</td>
                                                    <td className='text-sm text-gray-500 p-3 font-medium'>
                                                        ₹{order.totalAmount?.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className='text-sm p-3'>
                                                        <Badge className={`${statusColor} text-white text-xs`}>
                                                            {statusLabel}
                                                        </Badge>
                                                    </td>
                                                    <td className='text-sm text-gray-500 p-3'>
                                                        {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                                                            day: '2-digit', month: 'short', year: 'numeric' 
                                                        })}
                                                    </td>
                                                </tr>
                                            )
                                        })}
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

export default Orders