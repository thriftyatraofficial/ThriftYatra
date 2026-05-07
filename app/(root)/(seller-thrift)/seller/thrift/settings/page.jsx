'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { useSelector } from 'react-redux'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { 
    Store, Building2, MapPin, Landmark, Truck, 
    RotateCcw, Instagram, Phone, Share2, MessageCircle, Eye, EyeOff, Upload
} from 'lucide-react'
import Image from 'next/image'

const defaultStoreProfile = {
    storeName: '',
    storeDescription: '',
    storeLogo: null,
    storeBanner: null,
    phone: '',
    whatsapp: '',
    instagram: '',
}

const defaultBusinessDetails = {
    gstNumber: '',
    panNumber: '',
    businessType: 'individual',
    businessEmail: '',
}

const defaultPickupAddress = {
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
}

const defaultShippingSettings = {
    handlingDays: 2,
    shippingCharge: 50,
    freeShippingAbove: 0,
}

const defaultReturnPolicy = {
    acceptReturns: false,
    returnWindow: 7,
    returnConditions: '',
}

const defaultStats = {
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    rating: 0,
    joinedDate: null,
    sellerId: '',
    approvalStatus: '',
    isActive: true,
}

const ThriftSettingsPage = () => {
    const { auth } = useSelector(state => state.authStore)
    const [loading, setLoading] = useState(false)
    const [fetchLoading, setFetchLoading] = useState(true)
    const [activeSection, setActiveSection] = useState('store')
    
    const [storeProfile, setStoreProfile] = useState(defaultStoreProfile)
    const [businessDetails, setBusinessDetails] = useState(defaultBusinessDetails)
    const [pickupAddress, setPickupAddress] = useState(defaultPickupAddress)
    const [bankDetails, setBankDetails] = useState(null)
    const [shippingSettings, setShippingSettings] = useState(defaultShippingSettings)
    const [returnPolicy, setReturnPolicy] = useState(defaultReturnPolicy)
    const [stats, setStats] = useState(defaultStats)

    useEffect(() => { fetchSettings() }, [])

    const fetchSettings = async () => {
        try {
            setFetchLoading(true)
            const { data } = await axios.get('/api/seller/settings')
            if (data.success) {
                const settings = data.data
                setStoreProfile({ ...defaultStoreProfile, ...settings.storeProfile })
                setBusinessDetails({ ...defaultBusinessDetails, ...settings.businessDetails })
                setPickupAddress({ ...defaultPickupAddress, ...settings.pickupAddress })
                setBankDetails(settings.bankDetails || null)
                setShippingSettings({ ...defaultShippingSettings, ...settings.shippingSettings })
                setReturnPolicy({ ...defaultReturnPolicy, ...settings.returnPolicy })
                setStats({ ...defaultStats, ...settings.stats })
            }
        } catch (error) { showToast('error', 'Failed to load settings') }
        finally { setFetchLoading(false) }
    }

    const handleImageUpload = (e, type) => {
        const file = e.target.files[0]
        if (!file) return
        if (!file.type.startsWith('image/')) { showToast('error', 'Select an image file'); return }
        const reader = new FileReader()
        reader.onload = (event) => {
            const base64 = event.target.result
            if (type === 'logo') setStoreProfile({ ...storeProfile, storeLogo: base64 })
            else setStoreProfile({ ...storeProfile, storeBanner: base64 })
        }
        reader.readAsDataURL(file)
    }

    const handleSaveStore = async () => {
        try { setLoading(true); await axios.put('/api/seller/settings/store', storeProfile); showToast('success', 'Store profile updated') }
        catch { showToast('error', 'Failed to update') } finally { setLoading(false) }
    }

    const handleSaveBusiness = async () => {
        try { setLoading(true); await axios.put('/api/seller/settings/business', businessDetails); showToast('success', 'Business details updated') }
        catch { showToast('error', 'Failed to update') } finally { setLoading(false) }
    }

    const handleSavePickup = async () => {
        try { setLoading(true); await axios.put('/api/seller/settings/pickup', pickupAddress); showToast('success', 'Pickup address updated') }
        catch { showToast('error', 'Failed to update') } finally { setLoading(false) }
    }

    const handleSaveShipping = async () => {
        try { setLoading(true); await axios.put('/api/seller/settings/shipping', shippingSettings); showToast('success', 'Shipping settings updated') }
        catch { showToast('error', 'Failed to update') } finally { setLoading(false) }
    }

    const handleSaveReturn = async () => {
        try { setLoading(true); await axios.put('/api/seller/settings/return', returnPolicy); showToast('success', 'Return policy updated') }
        catch { showToast('error', 'Failed to update') } finally { setLoading(false) }
    }

    const sections = [
        { id: 'store', label: 'Store Profile', icon: Store },
        { id: 'social', label: 'Social & Contact', icon: Share2 },
        { id: 'business', label: 'Business', icon: Building2 },
        { id: 'pickup', label: 'Pickup Address', icon: MapPin },
        { id: 'bank', label: 'Bank Account', icon: Landmark },
        { id: 'shipping', label: 'Shipping', icon: Truck },
        { id: 'returns', label: 'Returns', icon: RotateCcw },
    ]

    if (fetchLoading) return (
        <div className="flex justify-center items-center h-96">
            <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div><p className="text-gray-500">Loading settings...</p></div>
        </div>
    )

    return (
        <div className='w-full'>
            <div className='mb-6'>
                <h1 className='text-2xl font-bold mb-2'>Store Settings</h1>
                <div className='flex flex-wrap gap-3 items-center'>
                    <Badge className={stats.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {stats.approvalStatus === 'approved' ? '✓ Approved' : '⏳ Pending'}
                    </Badge>
                    <Badge variant="outline">⭐ {stats.rating?.toFixed(1) || '0.0'}</Badge>
                    <Badge variant="outline">📦 {stats.totalProducts} Products</Badge>
                </div>
            </div>

            <div className='flex flex-wrap gap-2 mb-6 border-b pb-2'>
                {sections.map((section) => (
                    <button key={section.id} type="button" onClick={() => setActiveSection(section.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeSection === section.id ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>
                        <section.icon className="h-4 w-4" /><span className="text-sm font-medium">{section.label}</span>
                    </button>
                ))}
            </div>

            {/* ✅ STORE PROFILE WITH LOGO + COVER */}
            {activeSection === 'store' && (
                <Card>
                    <CardHeader><h2 className='text-lg font-semibold'>Store Profile</h2><p className='text-sm text-gray-500'>This appears on your product pages</p></CardHeader>
                    <CardContent className='space-y-6'>
                        {/* Store Logo */}
                        <div>
                            <Label>Store Logo</Label>
                            <div className='mt-2'>
                                {storeProfile.storeLogo ? (
                                    <div>
                                        <div className='relative w-24 h-24'><Image src={storeProfile.storeLogo} fill alt="Logo" className='rounded-full object-cover border' /></div>
                                        <Button variant="outline" size="sm" className='mt-2' onClick={() => document.getElementById('thriftLogoUpload').click()}>Change Logo</Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" onClick={() => document.getElementById('thriftLogoUpload').click()}><Upload className="h-4 w-4 mr-2" /> Upload Logo</Button>
                                )}
                                <input id="thriftLogoUpload" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} />
                            </div>
                        </div>

                        {/* Store Banner */}
                        <div>
                            <Label>Store Banner</Label>
                            <div className='mt-2'>
                                {storeProfile.storeBanner ? (
                                    <div>
                                        <div className='relative w-full h-32'><Image src={storeProfile.storeBanner} fill alt="Banner" className='rounded-lg object-cover border' /></div>
                                        <Button variant="outline" size="sm" className='mt-2' onClick={() => document.getElementById('thriftBannerUpload').click()}>Change Banner</Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" onClick={() => document.getElementById('thriftBannerUpload').click()}><Upload className="h-4 w-4 mr-2" /> Upload Banner</Button>
                                )}
                                <input id="thriftBannerUpload" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'banner')} />
                            </div>
                        </div>

                        <div><Label>Store Name *</Label><Input value={storeProfile.storeName} onChange={(e) => setStoreProfile({...storeProfile, storeName: e.target.value})} placeholder="My Thrift Store" /></div>
                        <div><Label>Store Description</Label><Textarea value={storeProfile.storeDescription} onChange={(e) => setStoreProfile({...storeProfile, storeDescription: e.target.value})} placeholder="Tell customers about your store..." rows={4} /></div>
                        <ButtonLoading loading={loading} onClick={handleSaveStore} text="Save Store Profile" />
                    </CardContent>
                </Card>
            )}

            {/* SOCIAL & CONTACT */}
            {activeSection === 'social' && (
                <Card>
                    <CardHeader><h2 className='text-lg font-semibold'>Social & Contact</h2></CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='bg-green-50 p-3 rounded-lg'><p className='text-sm font-medium text-green-800'><Eye className="h-4 w-4 inline" /> Public</p></div>
                        <div><Label><Instagram className="h-4 w-4 inline mr-1" /> Instagram (Public)</Label><Input value={storeProfile.instagram} onChange={(e) => setStoreProfile({...storeProfile, instagram: e.target.value})} placeholder="@yourstore" /></div>
                        <div className='bg-yellow-50 p-3 rounded-lg mt-4'><p className='text-sm font-medium text-yellow-800'><EyeOff className="h-4 w-4 inline" /> Private (Admin Only)</p></div>
                        <div className='grid grid-cols-2 gap-4'>
                            <div><Label><Phone className="h-4 w-4 inline mr-1" /> Phone</Label><Input value={storeProfile.phone} onChange={(e) => setStoreProfile({...storeProfile, phone: e.target.value})} /></div>
                            <div><Label><MessageCircle className="h-4 w-4 inline mr-1" /> WhatsApp</Label><Input value={storeProfile.whatsapp} onChange={(e) => setStoreProfile({...storeProfile, whatsapp: e.target.value})} /></div>
                        </div>
                        <ButtonLoading loading={loading} onClick={handleSaveStore} text="Save Contact Info" />
                    </CardContent>
                </Card>
            )}

            {/* BUSINESS DETAILS */}
            {activeSection === 'business' && (
                <Card>
                    <CardHeader><h2 className='text-lg font-semibold'>Business Details</h2></CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='bg-yellow-50 p-3 rounded-lg'><p className='text-xs'><EyeOff className="h-3 w-3 inline" /> Private</p></div>
                        <div className='grid grid-cols-2 gap-4'>
                            <div><Label>GST</Label><Input value={businessDetails.gstNumber} onChange={(e) => setBusinessDetails({...businessDetails, gstNumber: e.target.value})} /></div>
                            <div><Label>PAN</Label><Input value={businessDetails.panNumber} onChange={(e) => setBusinessDetails({...businessDetails, panNumber: e.target.value})} /></div>
                        </div>
                        <div><Label>Business Type</Label><Select value={businessDetails.businessType} onValueChange={(v) => setBusinessDetails({...businessDetails, businessType: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="individual">Individual</SelectItem><SelectItem value="proprietorship">Proprietorship</SelectItem><SelectItem value="partnership">Partnership</SelectItem><SelectItem value="company">Company</SelectItem></SelectContent></Select></div>
                        <div><Label>Business Email</Label><Input type="email" value={businessDetails.businessEmail} onChange={(e) => setBusinessDetails({...businessDetails, businessEmail: e.target.value})} /></div>
                        <ButtonLoading loading={loading} onClick={handleSaveBusiness} text="Save Business Details" />
                    </CardContent>
                </Card>
            )}

            {/* Other sections remain same - pickup, bank, shipping, returns */}
            {activeSection === 'pickup' && (
                <Card><CardHeader><h2 className='text-lg font-semibold'>Pickup Address</h2></CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='grid grid-cols-2 gap-4'><div><Label>Full Name *</Label><Input value={pickupAddress.fullName} onChange={(e) => setPickupAddress({...pickupAddress, fullName: e.target.value})} /></div><div><Label>Phone *</Label><Input value={pickupAddress.phone} onChange={(e) => setPickupAddress({...pickupAddress, phone: e.target.value})} /></div></div>
                        <div><Label>Address *</Label><Textarea value={pickupAddress.address} onChange={(e) => setPickupAddress({...pickupAddress, address: e.target.value})} rows={2} /></div>
                        <div className='grid grid-cols-3 gap-4'><div><Label>City *</Label><Input value={pickupAddress.city} onChange={(e) => setPickupAddress({...pickupAddress, city: e.target.value})} /></div><div><Label>State *</Label><Input value={pickupAddress.state} onChange={(e) => setPickupAddress({...pickupAddress, state: e.target.value})} /></div><div><Label>Pincode *</Label><Input value={pickupAddress.pincode} onChange={(e) => setPickupAddress({...pickupAddress, pincode: e.target.value})} /></div></div>
                        <div><Label>Landmark</Label><Input value={pickupAddress.landmark} onChange={(e) => setPickupAddress({...pickupAddress, landmark: e.target.value})} /></div>
                        <ButtonLoading loading={loading} onClick={handleSavePickup} text="Save Pickup Address" />
                    </CardContent>
                </Card>
            )}

            {activeSection === 'bank' && (
                <Card><CardHeader><h2 className='text-lg font-semibold'>Bank Account</h2></CardHeader>
                    <CardContent>{bankDetails ? (
                        <div className='bg-gray-50 p-4 rounded-lg'><p className='font-medium'>{bankDetails.accountHolderName}</p><p className='text-sm'>{bankDetails.bankName}</p><p className='text-sm'>A/C: {bankDetails.accountNumber}</p><p className='text-sm'>IFSC: {bankDetails.ifscCode}</p></div>
                    ) : (<div className='text-center py-6'><Landmark className='h-12 w-12 mx-auto text-gray-300 mb-3' /><p className='text-gray-500'>No bank account added</p></div>)}</CardContent>
                </Card>
            )}

            {activeSection === 'shipping' && (
                <Card><CardHeader><h2 className='text-lg font-semibold'>Shipping Settings</h2></CardHeader>
                    <CardContent className='space-y-4'>
                        <div><Label>Handling Time (Days)</Label><Input type="number" value={shippingSettings.handlingDays} onChange={(e) => setShippingSettings({...shippingSettings, handlingDays: parseInt(e.target.value) || 1})} /></div>
                        <div><Label>Shipping Charge (₹)</Label><Input type="number" value={shippingSettings.shippingCharge} onChange={(e) => setShippingSettings({...shippingSettings, shippingCharge: parseInt(e.target.value) || 0})} /></div>
                        <div><Label>Free Shipping Above (₹)</Label><Input type="number" value={shippingSettings.freeShippingAbove} onChange={(e) => setShippingSettings({...shippingSettings, freeShippingAbove: parseInt(e.target.value) || 0})} /></div>
                        <ButtonLoading loading={loading} onClick={handleSaveShipping} text="Save Shipping" />
                    </CardContent>
                </Card>
            )}

            {activeSection === 'returns' && (
                <Card><CardHeader><h2 className='text-lg font-semibold'>Return Policy</h2></CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='flex items-center justify-between'><Label>Accept Returns</Label><Switch checked={returnPolicy.acceptReturns} onCheckedChange={(v) => setReturnPolicy({...returnPolicy, acceptReturns: v})} /></div>
                        {returnPolicy.acceptReturns && (
                            <><div><Label>Return Window (Days)</Label><Input type="number" value={returnPolicy.returnWindow} onChange={(e) => setReturnPolicy({...returnPolicy, returnWindow: parseInt(e.target.value) || 7})} /></div>
                            <div><Label>Return Conditions</Label><Textarea value={returnPolicy.returnConditions} onChange={(e) => setReturnPolicy({...returnPolicy, returnConditions: e.target.value})} rows={3} /></div></>
                        )}
                        <ButtonLoading loading={loading} onClick={handleSaveReturn} text="Save Return Policy" />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default ThriftSettingsPage