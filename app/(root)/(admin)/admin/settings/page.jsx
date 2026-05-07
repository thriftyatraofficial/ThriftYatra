'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import ButtonLoading from '@/components/Application/ButtonLoading'

const AdminSettingsPage = () => {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    
    // COD Settings
    const [codEnabled, setCodEnabled] = useState(true)
    const [codFee, setCodFee] = useState(49)
    const [codFreeAbove, setCodFreeAbove] = useState(999)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/admin/settings?type=cod')
            if (data.success && data.data) {
                setCodEnabled(data.data.data?.enabled ?? true)
                setCodFee(data.data.data?.fee ?? 49)
                setCodFreeAbove(data.data.data?.freeAbove ?? 999)
            }
        } catch (error) {
            console.error('Failed to load settings:', error)
        } finally { setLoading(false) }
    }

    const handleSaveCOD = async () => {
        try {
            setSaving(true)
            const { data } = await axios.post('/api/admin/settings', {
                type: 'cod',
                data: { enabled: codEnabled, fee: codFee, freeAbove: codFreeAbove }
            })
            if (data.success) showToast('success', 'COD settings saved!')
        } catch (error) {
            showToast('error', 'Failed to save settings')
        } finally { setSaving(false) }
    }

    if (loading) return <div className="text-center py-10">Loading...</div>

    return (
        <div className='w-full max-w-4xl mx-auto'>
            <h1 className='text-2xl font-bold mb-6'>Settings</h1>
            
            <Tabs defaultValue="cod">
                <TabsList className="mb-4">
                    <TabsTrigger value="cod">Cash on Delivery</TabsTrigger>
                    <TabsTrigger value="general">General</TabsTrigger>
                </TabsList>
                
                <TabsContent value="cod">
                    <Card>
                        <CardHeader><h2 className="text-lg font-semibold">Cash on Delivery Settings</h2></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Enable Cash on Delivery</Label>
                                <Switch checked={codEnabled} onCheckedChange={setCodEnabled} />
                            </div>
                            <div>
                                <Label>COD Extra Fee (₹)</Label>
                                <Input type="number" value={codFee} onChange={(e) => setCodFee(Number(e.target.value))} className="mt-1 max-w-[200px]" />
                                <p className="text-xs text-gray-500 mt-1">Extra charge for COD orders</p>
                            </div>
                            <div>
                                <Label>Free COD Above (₹)</Label>
                                <Input type="number" value={codFreeAbove} onChange={(e) => setCodFreeAbove(Number(e.target.value))} className="mt-1 max-w-[200px]" />
                                <p className="text-xs text-gray-500 mt-1">No COD fee for orders above this amount</p>
                            </div>
                            <ButtonLoading loading={saving} onClick={handleSaveCOD} text="Save COD Settings" />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default AdminSettingsPage