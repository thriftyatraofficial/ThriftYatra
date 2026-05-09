'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { getImageUrl } from '@/lib/imageUtils'
import { Plus, Edit, Trash2, Video, ImageIcon, Upload, Filter } from 'lucide-react'
import ButtonLoading from '@/components/Application/ButtonLoading'

const locationOptions = [
    { value: 'carousel_1', label: 'Carousel Slide 1', size: '1920x800' },
    { value: 'carousel_2', label: 'Carousel Slide 2', size: '1920x800' },
    { value: 'carousel_3', label: 'Carousel Slide 3', size: '1920x800' },
    { value: 'carousel_4', label: 'Carousel Slide 4', size: '1920x800' },
    { value: 'home_banner_1', label: 'Home Banner 1', size: 'Any' },
    { value: 'home_banner_2', label: 'Home Banner 2', size: 'Any' },
    { value: 'home_banner_right', label: 'Our Promise Banner', size: 'Any' },
    { value: 'instagram_feed', label: 'Instagram Feed', size: '500x500' },
    { value: 'marquee_text', label: 'Marquee Text', size: 'Text only' },
    { value: 'hero_title', label: 'Hero Title', size: 'Text only' },
    { value: 'hero_subtitle', label: 'Hero Subtitle', size: 'Text only' },
    { value: 'logo_light', label: 'Logo (Light)', size: '150x50' },
    { value: 'logo_dark', label: 'Logo (Dark)', size: '150x50' },
    { value: 'favicon', label: 'Favicon', size: '32x32' },
]

const sizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'full', label: 'Full Width' },
    { value: 'custom', label: 'Custom' },
]

const textLocations = ['marquee_text', 'hero_title', 'hero_subtitle']

const AdminBannersPage = () => {
    const [loading, setLoading] = useState(true)
    const [banners, setBanners] = useState([])
    const [filteredBanners, setFilteredBanners] = useState([])
    const [locationFilter, setLocationFilter] = useState('all')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingBanner, setEditingBanner] = useState(null)
    const [saving, setSaving] = useState(false)
    const [uploadingMedia, setUploadingMedia] = useState(false)
    const [imagePreview, setImagePreview] = useState(null)
    const [videoPreview, setVideoPreview] = useState(null)
    const [posterPreview, setPosterPreview] = useState(null)
    const [showOverlay, setShowOverlay] = useState(false)

    const [formData, setFormData] = useState({
        title: '', subtitle: '', location: 'carousel_1', mediaType: 'image',
        imageUrl: '', videoUrl: '', posterUrl: '',
        videoSettings: { autoplay: true, loop: true, muted: true, controls: false },
        textContent: '', link: '', buttonText: '', isActive: true,
        size: 'medium', customWidth: '', customHeight: '', startDate: '', endDate: '',
    })

    useEffect(() => { fetchBanners() }, [])
    useEffect(() => {
        if (locationFilter === 'all') setFilteredBanners(banners)
        else setFilteredBanners(banners.filter(b => b.location === locationFilter))
    }, [locationFilter, banners])

    const fetchBanners = async () => {
        try { setLoading(true); const { data } = await axios.get('/api/banners?limit=200'); if (data.success) { setBanners(data.data); setFilteredBanners(data.data) } }
        catch { showToast('error', 'Failed to load banners') } finally { setLoading(false) }
    }

    const openAddDialog = () => {
        setEditingBanner(null)
        setFormData({ title: '', subtitle: '', location: 'carousel_1', mediaType: 'image', imageUrl: '', videoUrl: '', posterUrl: '', videoSettings: { autoplay: true, loop: true, muted: true, controls: false }, textContent: '', link: '', buttonText: '', isActive: true, size: 'medium', customWidth: '', customHeight: '', startDate: '', endDate: '' })
        setImagePreview(null); setVideoPreview(null); setPosterPreview(null); setShowOverlay(false)
        setDialogOpen(true)
    }

    const openEditDialog = (banner) => {
        setEditingBanner(banner)
        setFormData({
            title: banner.title || '', subtitle: banner.subtitle || '', location: banner.location || 'carousel_1',
            mediaType: banner.mediaType || (textLocations.includes(banner.location) ? 'text' : 'image'),
            imageUrl: banner.imageUrl || banner.base64Image || '', videoUrl: banner.videoUrl || '', posterUrl: banner.posterUrl || banner.base64Poster || '',
            videoSettings: banner.videoSettings || { autoplay: true, loop: true, muted: true, controls: false },
            textContent: banner.textContent || '', link: banner.link || '', buttonText: banner.buttonText || '',
            isActive: banner.isActive ?? true, size: banner.size || 'medium', customWidth: banner.customWidth || '', customHeight: banner.customHeight || '',
            startDate: banner.startDate ? banner.startDate.split('T')[0] : '', endDate: banner.endDate ? banner.endDate.split('T')[0] : ''
        })
        setImagePreview(banner.imageUrl || banner.base64Image || null)
        setVideoPreview(banner.videoUrl || null)
        setPosterPreview(banner.posterUrl || banner.base64Poster || null)
        setShowOverlay(!!(banner.title || banner.buttonText))
        setDialogOpen(true)
    }

    const uploadMediaFile = async (file, type) => {
        if (!file) return null
        if (file.size > 5 * 1024 * 1024) { showToast('error', 'File must be under 5MB'); return null }
        const fd = new FormData(); fd.append('files', file)
        setUploadingMedia(true)
        try { const { data } = await axios.post('/api/media', fd); if (data.success && data.data.length > 0) { const m = data.data[0]; if (type === 'image') setFormData(prev => ({ ...prev, imageUrl: m.secure_url })); if (type === 'video') setFormData(prev => ({ ...prev, videoUrl: m.secure_url })); return m.secure_url } return null }
        catch { showToast('error', 'Upload failed'); return null } finally { setUploadingMedia(false) }
    }

    const handleImageUpload = async (e) => { const f = e.target.files?.[0]; if (!f) return; if (!f.type.startsWith('image/')) { showToast('error', 'Select image'); return }; const u = await uploadMediaFile(f, 'image'); if (u) { setImagePreview(u); setVideoPreview(null) } }
    const handleVideoUpload = async (e) => { const f = e.target.files?.[0]; if (!f) return; if (!f.type.startsWith('video/')) { showToast('error', 'Select video'); return }; const u = await uploadMediaFile(f, 'video'); if (u) { setVideoPreview(u); setImagePreview(null) } }
    const handlePosterUpload = async (e) => { const f = e.target.files?.[0]; if (!f) return; if (!f.type.startsWith('image/')) { showToast('error', 'Select poster image'); return }; const u = await uploadMediaFile(f, 'image'); if (u) setPosterPreview(u) }

    const handleSave = async () => {
        if (formData.mediaType === 'image' && !formData.imageUrl) { showToast('error', 'Upload an image first'); return }
        if (formData.mediaType === 'video' && !formData.videoUrl) { showToast('error', 'Upload a video first'); return }
        if (formData.mediaType === 'text' && !formData.textContent) { showToast('error', 'Enter text content'); return }
        try {
            setSaving(true)
            const pay = { ...formData }
            const url = editingBanner ? `/api/banners?id=${editingBanner._id}` : '/api/banners'
            const method = editingBanner ? 'put' : 'post'
            const { data } = await axios[method](url, pay)
            if (data.success) { showToast('success', editingBanner ? 'Banner updated' : 'Banner created'); setDialogOpen(false); fetchBanners() }
        } catch (e) { showToast('error', e.response?.data?.message || 'Failed') } finally { setSaving(false) }
    }

    const handleDelete = async (id) => { if (!confirm('Delete?')) return; try { await axios.delete(`/api/banners?id=${id}`); showToast('success', 'Deleted'); fetchBanners() } catch { showToast('error', 'Failed') } }

    const isTextLocation = textLocations.includes(formData.location)
    const getLocationLabel = (v) => locationOptions.find(o => o.value === v)?.label || v

    return (
        <div className='w-full'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5'>
                <div><h1 className='text-3xl font-bold'>Media Manager</h1><p className='text-gray-500 mt-1'>Manage homepage banners, videos and promotional text.</p></div>
                <Button onClick={openAddDialog} className='whitespace-nowrap'><Plus className='h-4 w-4 mr-2' /> Add Media</Button>
            </div>
            <div className='mb-4 flex items-center gap-2'><Filter className='h-4 w-4 text-gray-500' /><Select value={locationFilter} onValueChange={setLocationFilter}><SelectTrigger className='w-[260px]'><SelectValue placeholder='Filter' /></SelectTrigger><SelectContent><SelectItem value='all'>All</SelectItem>{locationOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
            <Card><CardHeader><h2 className='text-lg font-semibold'>All Media ({filteredBanners.length})</h2></CardHeader><CardContent>
                {loading ? <div className='text-center py-10'>Loading...</div> : filteredBanners.length === 0 ? <div className='text-center py-10'><p>No media yet.</p><Button onClick={openAddDialog} className='mt-3'>Add First</Button></div> : (
                    <Table><TableHeader><TableRow><TableHead>Location</TableHead><TableHead>Type</TableHead><TableHead>Preview</TableHead><TableHead>Title</TableHead><TableHead>Size</TableHead><TableHead>Status</TableHead><TableHead className='text-right'>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>{filteredBanners.map(b => (
                            <TableRow key={b._id}><TableCell><Badge variant='outline'>{getLocationLabel(b.location)}</Badge></TableCell><TableCell><Badge variant='outline' className='flex items-center gap-1'>{b.mediaType === 'video' ? <Video className='h-3 w-3' /> : <ImageIcon className='h-3 w-3' />}{b.mediaType === 'video' ? 'Video' : b.mediaType === 'text' ? 'Text' : 'Image'}</Badge></TableCell>
                            <TableCell>{b.mediaType === 'video' ? <div className='relative w-16 h-12 rounded overflow-hidden bg-slate-100'>{b.posterUrl ? <Image src={getImageUrl(b.posterUrl)} fill alt='' className='object-cover' unoptimized /> : <div className='flex items-center justify-center h-full text-xs text-gray-500'>Video</div>}</div> : b.imageUrl || b.base64Image ? <Image src={getImageUrl(b.imageUrl || b.base64Image)} width={60} height={40} alt='' className='rounded object-cover' unoptimized /> : <p className='text-xs text-gray-500'>No preview</p>}</TableCell>
                            <TableCell>{b.title || b.textContent?.slice(0, 30) || 'Untitled'}</TableCell><TableCell><Badge variant='outline'>{b.size || 'default'}</Badge></TableCell>
                            <TableCell><Badge className={b.isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}>{b.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                            <TableCell className='text-right'><div className='flex justify-end gap-1'><Button variant='ghost' size='icon' onClick={() => openEditDialog(b)}><Edit className='h-4 w-4' /></Button><Button variant='ghost' size='icon' className='text-red-600' onClick={() => handleDelete(b._id)}><Trash2 className='h-4 w-4' /></Button></div></TableCell></TableRow>
                        ))}</TableBody></Table>
                )}</CardContent></Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className='sm:max-w-3xl max-h-[90vh] overflow-y-auto'>
                    <DialogHeader><DialogTitle>{editingBanner ? 'Edit' : 'Add'} Media</DialogTitle><DialogDescription>Upload images, videos or text for the website.</DialogDescription></DialogHeader>
                    <div className='space-y-4 py-4'>
                        <div><Label>Location *</Label><Select value={formData.location} onValueChange={(v) => setFormData(prev => ({ ...prev, location: v, mediaType: textLocations.includes(v) ? 'text' : prev.mediaType }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{locationOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>

                        {!isTextLocation && <div><Label>Media Type</Label><Select value={formData.mediaType} onValueChange={(v) => setFormData(prev => ({ ...prev, mediaType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='image'>Image</SelectItem><SelectItem value='video'>Video</SelectItem></SelectContent></Select></div>}

                        {!isTextLocation && formData.mediaType !== 'video' && (
                            <div><Label>Upload Image (Max 5MB)</Label><div className='mt-2'>{imagePreview ? <div className='space-y-2'><Image src={imagePreview} width={320} height={180} alt='' className='rounded object-cover w-full' unoptimized /><Button variant='outline' onClick={() => document.getElementById('imgUp').click()}><Upload className='h-4 w-4 mr-2' /> Change</Button></div> : <Button variant='outline' onClick={() => document.getElementById('imgUp').click()}><Upload className='h-4 w-4 mr-2' /> Upload</Button>}<input id='imgUp' type='file' accept='image/*' className='hidden' onChange={handleImageUpload} /></div></div>
                        )}

                        {!isTextLocation && formData.mediaType === 'video' && (
                            <>
                                <div><Label>Upload Video (Max 5MB)</Label><div className='mt-2'>{videoPreview ? <video src={videoPreview} controls className='w-full max-h-[260px] rounded bg-black' /> : <Button variant='outline' onClick={() => document.getElementById('vidUp').click()}><Upload className='h-4 w-4 mr-2' /> Upload</Button>}<input id='vidUp' type='file' accept='video/*' className='hidden' onChange={handleVideoUpload} /></div></div>
                                <div><Label>Poster Image (Optional)</Label><div className='mt-2'>{posterPreview ? <div className='space-y-2'><Image src={posterPreview} width={320} height={180} alt='' className='rounded object-cover w-full' unoptimized /><Button variant='outline' onClick={() => document.getElementById('postUp').click()}>Change</Button></div> : <Button variant='outline' onClick={() => document.getElementById('postUp').click()}>Upload</Button>}<input id='postUp' type='file' accept='image/*' className='hidden' onChange={handlePosterUpload} /></div></div>
                                <div className='grid grid-cols-2 gap-3'>{['autoplay','loop','muted','controls'].map(k => <div key={k} className='flex items-center justify-between'><Label className='capitalize'>{k}</Label><Switch checked={formData.videoSettings[k]} onCheckedChange={(v) => setFormData(prev => ({ ...prev, videoSettings: { ...prev.videoSettings, [k]: v } }))} /></div>)}</div>
                            </>
                        )}

                        {isTextLocation && <div><Label>Text Content *</Label><Input value={formData.textContent} onChange={(e) => setFormData({ ...formData, textContent: e.target.value })} /></div>}

                        {/* Overlay Toggle */}
                        {!isTextLocation && (
                            <div className='flex items-center justify-between border-t pt-4'>
                                <Label>Show Overlay (Title + Button)</Label>
                                <Switch checked={showOverlay} onCheckedChange={(v) => { setShowOverlay(v); if (!v) setFormData(prev => ({ ...prev, title: '', subtitle: '', buttonText: '', link: '' })) }} />
                            </div>
                        )}

                        {!isTextLocation && showOverlay && (
                            <>
                                <div><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
                                <div><Label>Subtitle</Label><Input value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} /></div>
                                <div><Label>Link</Label><Input value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} placeholder='/shop' /></div>
                                <div><Label>Button Text</Label><Input value={formData.buttonText} onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })} placeholder='Shop Now' /></div>
                            </>
                        )}

                        {!isTextLocation && <><div><Label>Banner Size</Label><Select value={formData.size} onValueChange={(v) => setFormData({ ...formData, size: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sizeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>{formData.size === 'custom' && <div className='grid grid-cols-2 gap-4'><div><Label>Width</Label><Input type='number' value={formData.customWidth} onChange={(e) => setFormData({ ...formData, customWidth: e.target.value })} /></div><div><Label>Height</Label><Input type='number' value={formData.customHeight} onChange={(e) => setFormData({ ...formData, customHeight: e.target.value })} /></div></div>}</>}

                        <div className='flex items-center justify-between'><Label>Active</Label><Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} /></div>
                        <div className='grid grid-cols-2 gap-4'><div><Label>Start Date</Label><Input type='date' value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} /></div><div><Label>End Date</Label><Input type='date' value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} /></div></div>
                    </div>
                    <DialogFooter><Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button><ButtonLoading loading={saving} onClick={handleSave} text={editingBanner ? 'Update' : 'Save'} /></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AdminBannersPage