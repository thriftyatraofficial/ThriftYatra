'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { formatCurrency } from '@/lib/utils'
import { Percent, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import ButtonLoading from '@/components/Application/ButtonLoading'

const CommissionSettingsPage = () => {
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        rate: 10,
        applicableTo: 'all',
        isActive: true
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/admin/commission')
            if (data.success) setSettings(data.data)
        } catch (error) {
            showToast('error', 'Failed to load commission settings')
        } finally {
            setLoading(false)
        }
    }

    const openAddDialog = () => {
        setEditingId(null)
        setFormData({ name: '', rate: 10, applicableTo: 'all', isActive: true })
        setDialogOpen(true)
    }

    const openEditDialog = (setting) => {
        setEditingId(setting._id)
        setFormData({
            name: setting.name,
            rate: setting.rate,
            applicableTo: setting.applicableTo,
            isActive: setting.isActive
        })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name || formData.rate < 0 || formData.rate > 100) {
            showToast('error', 'Please enter a valid name and rate (0-100)')
            return
        }

        try {
            setSaving(true)
            let response
            if (editingId) {
                response = await axios.put(`/api/admin/commission/${editingId}`, formData)
            } else {
                response = await axios.post('/api/admin/commission', formData)
            }
            if (response.data.success) {
                showToast('success', editingId ? 'Commission updated' : 'Commission created')
                setDialogOpen(false)
                fetchSettings()
            }
        } catch (error) {
            showToast('error', 'Failed to save commission')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this commission setting?')) return
        try {
            await axios.delete(`/api/admin/commission/${id}`)
            showToast('success', 'Commission deleted')
            fetchSettings()
        } catch (error) {
            showToast('error', 'Failed to delete commission')
        }
    }

    const handleToggleActive = async (id, currentStatus) => {
        try {
            await axios.put(`/api/admin/commission/${id}/toggle`, { isActive: !currentStatus })
            showToast('success', 'Status updated')
            fetchSettings()
        } catch (error) {
            showToast('error', 'Failed to update status')
        }
    }

    return (
        <div className='w-full max-w-5xl mx-auto'>
            <div className='flex justify-between items-center mb-6'>
                <div>
                    <h1 className='text-2xl font-bold'>Commission Settings</h1>
                    <p className='text-gray-500'>Manage platform commission rates for sellers</p>
                </div>
                <Button onClick={openAddDialog}>
                    <Plus className="h-4 w-4 mr-2" /> Add Commission
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <h2 className='text-lg font-semibold'>Commission Rates</h2>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className='text-center py-10'>Loading...</div>
                    ) : settings.length === 0 ? (
                        <div className='text-center py-10 text-gray-500'>
                            <Percent className='h-12 w-12 mx-auto text-gray-300 mb-3' />
                            <p>No commission settings</p>
                            <Button onClick={openAddDialog} className='mt-3'>Add First Commission</Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Applies To</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className='text-right'>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {settings.map((setting) => (
                                    <TableRow key={setting._id}>
                                        <TableCell className='font-medium'>{setting.name}</TableCell>
                                        <TableCell>
                                            <Badge className='bg-blue-100 text-blue-800 text-lg'>{setting.rate}%</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant='outline'>
                                                {setting.applicableTo === 'all' ? 'All Products' : 
                                                 setting.applicableTo === 'thrift' ? 'Thrift Only' : 'Brand New Only'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Switch 
                                                checked={setting.isActive} 
                                                onCheckedChange={() => handleToggleActive(setting._id, setting.isActive)}
                                            />
                                        </TableCell>
                                        <TableCell className='text-right'>
                                            <div className='flex justify-end gap-1'>
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(setting)}>
                                                    <Edit className='h-4 w-4' />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(setting._id)} className='text-red-600'>
                                                    <Trash2 className='h-4 w-4' />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit' : 'Add'} Commission Setting</DialogTitle>
                        <DialogDescription>Set platform commission rate for sellers</DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4 py-4'>
                        <div>
                            <Label>Name *</Label>
                            <Input 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                placeholder="e.g., Default Commission" 
                            />
                        </div>
                        <div>
                            <Label>Rate (%) *</Label>
                            <Input 
                                type="number" 
                                value={formData.rate} 
                                onChange={(e) => setFormData({...formData, rate: Number(e.target.value)})} 
                                min={0} 
                                max={100}
                                step={0.5}
                            />
                        </div>
                        <div>
                            <Label>Applies To</Label>
                            <Select value={formData.applicableTo} onValueChange={(v) => setFormData({...formData, applicableTo: v})}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Products</SelectItem>
                                    <SelectItem value="thrift">Thrift Items Only</SelectItem>
                                    <SelectItem value="brand_new">Brand New Items Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <ButtonLoading loading={saving} onClick={handleSave} text={editingId ? 'Update' : 'Create'} />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default CommissionSettingsPage