'use client'
import ButtonLoading from '@/components/Application/ButtonLoading'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { showToast } from '@/lib/showToast'
import useFetch from '@/hooks/useFetch'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { WEBSITE_LOGIN, WEBSITE_ORDER_DETAILS } from '@/routes/WebsiteRoute'
import React, { useEffect, useState } from 'react'
import { IoPersonOutline, IoCallOutline, IoMailOutline } from "react-icons/io5"
import { HiOutlineShoppingBag } from "react-icons/hi2"
import axios from 'axios'
import Link from 'next/link'
import { login } from '@/store/reducer/authReducer'
import { Badge } from '@/components/ui/badge'

const breadCrumbData = { title: 'Profile', links: [{ label: 'Profile' }] }

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

const Profile = () => {
    const dispatch = useDispatch()
    const auth = useSelector(store => store.authStore.auth)
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')  // ✅ Fixed: Added phone state
    const [saving, setSaving] = useState(false)
    const { data: orderData, loading: ordersLoading } = useFetch('/api/user-order')

    useEffect(() => {
        if (!auth) { router.push(WEBSITE_LOGIN); return }
        setName(auth?.name || '')
        setEmail(auth?.email || '')
        setPhone(auth?.phone || '')  // ✅ Fixed: Set phone from auth
    }, [auth])

    const handleSave = async () => {
        if (!name.trim()) { showToast('error', 'Name cannot be empty'); return }
        try {
            setSaving(true)
            const { data } = await axios.put('/api/profile/update', { name, email, phone })
            if (data.success) {
                dispatch(login({ ...auth, name, email, phone }))
                showToast('success', 'Profile updated!')
            } else { showToast('error', data.message || 'Failed to update') }
        } catch (error) { showToast('error', 'Failed to update profile') }
        finally { setSaving(false) }
    }

    if (!auth) return (
        <div className="flex justify-center items-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    )

    const orders = orderData?.data || []

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumbData} />
            <UserPanelLayout>
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-[#E8B931] rounded-full flex items-center justify-center">
                                <IoPersonOutline className="text-white" size={30} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{auth?.name || 'User'}</h2>
                                {auth?.email && <p className="text-gray-500 flex items-center gap-1"><IoMailOutline size={14} /> {auth.email}</p>}
                                {auth?.phone && <p className="text-gray-500 flex items-center gap-1"><IoCallOutline size={14} /> {auth.phone}</p>}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
                            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="Enter email for order updates" /></div>
                            <div><Label>Phone Number</Label><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={10} className="mt-1" placeholder="Enter your 10-digit number" /></div>
                            <ButtonLoading loading={saving} onClick={handleSave} text="Update Profile" className="w-full" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><HiOutlineShoppingBag size={20} /> My Orders</h3>
                            <Link href="/orders" className="text-[#E8B931] text-sm hover:underline">View All</Link>
                        </div>
                        {ordersLoading ? (
                            <div className="text-center py-10 text-gray-500">Loading orders...</div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-10 text-gray-500"><p className="mb-3">No orders yet</p><Link href="/shop"><Button variant="outline" size="sm">Start Shopping</Button></Link></div>
                        ) : (
                            <div className="overflow-auto">
                                <table className="w-full">
                                    <thead><tr className="bg-gray-50"><th className="text-start p-2 text-sm text-gray-500">Order ID</th><th className="text-start p-2 text-sm text-gray-500">Items</th><th className="text-start p-2 text-sm text-gray-500">Amount</th><th className="text-start p-2 text-sm text-gray-500">Status</th><th className="text-start p-2 text-sm text-gray-500">Date</th></tr></thead>
                                    <tbody>
                                        {orders.slice(0, 5).map((order) => (
                                            <tr key={order._id} className="border-b hover:bg-gray-50">
                                                <td className="text-sm p-2"><Link className="text-blue-600 hover:underline" href={WEBSITE_ORDER_DETAILS(order.order_id)}>#{order.order_id?.slice(-8)}</Link></td>
                                                <td className="text-sm text-gray-500 p-2">{order.products?.length || 0}</td>
                                                <td className="text-sm text-gray-500 p-2 font-medium">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                                                <td className="text-sm p-2"><Badge className={`${STATUS_COLORS[order.status] || 'bg-gray-500'} text-white text-xs`}>{STATUS_LABELS[order.status] || order.status || 'Pending'}</Badge></td>
                                                <td className="text-sm text-gray-500 p-2">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </UserPanelLayout>
        </div>
    )
}

export default Profile