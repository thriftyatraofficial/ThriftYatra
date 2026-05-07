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

    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        location: 'carousel_1',
        mediaType: 'image',
        imageUrl: '',
        videoUrl: '',
        posterUrl: '',
        videoSettings: { autoplay: true, loop: true, muted: true, controls: false },
        textContent: '',
        link: '#',
        buttonText: 'Shop Now',
        isActive: true,
        size: 'medium',
        customWidth: '',
        customHeight: '',
        startDate: '',
        endDate: '',
    })

    useEffect(() => { fetchBanners() }, [])
    useEffect(() => {
        if (locationFilter === 'all') setFilteredBanners(banners)
        else setFilteredBanners(banners.filter(b => b.location === locationFilter))
    }, [locationFilter, banners])

    const fetchBanners = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/banners?limit=200')
            if (data.success) {
                setBanners(data.data)
                setFilteredBanners(data.data)
            }
        } catch (error) {
            showToast('error', 'Failed to load banners')
        } finally {
            setLoading(false)
        }
    }

    const openAddDialog = () => {
        setEditingBanner(null)
        setFormData({
            title: '', subtitle: '', location: 'carousel_1', mediaType: 'image', imageUrl: '', videoUrl: '', posterUrl: '',
            videoSettings: { autoplay: true, loop: true, muted: true, controls: false },
            textContent: '', link: '#', buttonText: 'Shop Now', isActive: true, size: 'medium', customWidth: '', customHeight: '', startDate: '', endDate: ''
        })
        setImagePreview(null)
        setVideoPreview(null)
        setPosterPreview(null)
        setDialogOpen(true)
    }

    const openEditDialog = (banner) => {
        setEditingBanner(banner)
        setFormData({
            title: banner.title || '', subtitle: banner.subtitle || '', location: banner.location || 'carousel_1',
            mediaType: banner.mediaType || (textLocations.includes(banner.location) ? 'text' : 'image'),
            imageUrl: banner.imageUrl || banner.base64Image || '',
            videoUrl: banner.videoUrl || '',
            posterUrl: banner.posterUrl || banner.base64Poster || '',
            videoSettings: banner.videoSettings || { autoplay: true, loop: true, muted: true, controls: false },
            textContent: banner.textContent || '', link: banner.link || '#', buttonText: banner.buttonText || 'Shop Now',
            isActive: banner.isActive ?? true, size: banner.size || 'medium', customWidth: banner.customWidth || '', customHeight: banner.customHeight || '',
            startDate: banner.startDate ? banner.startDate.split('T')[0] : '', endDate: banner.endDate ? banner.endDate.split('T')[0] : ''
        })
        setImagePreview(banner.imageUrl || banner.base64Image || null)
        setVideoPreview(banner.videoUrl || null)
        setPosterPreview(banner.posterUrl || banner.base64Poster || null)
        setDialogOpen(true)
    }

    const uploadMediaFile = async (file, type) => {
        if (!file) return null
        const formData = new FormData()
        formData.append('files', file)
        setUploadingMedia(true)
        try {
            const { data } = await axios.post('/api/media', formData)
            if (data.success && data.data.length > 0) {
                const media = data.data[0]
                if (type === 'image') setFormData(prev => ({ ...prev, imageUrl: media.secure_url }))
                if (type === 'video') setFormData(prev => ({ ...prev, videoUrl: media.secure_url }))
                return media.secure_url
            }
            return null
        } catch (error) {
            showToast('error', 'Upload failed')
            return null
        } finally {
            setUploadingMedia(false)
        }
    }

    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            showToast('error', 'Please select an image file')
            return
        }
        const secureUrl = await uploadMediaFile(file, 'image')
        if (secureUrl) {
            setImagePreview(secureUrl)
            setVideoPreview(null)
        }
    }

    const handleVideoUpload = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('video/')) {
            showToast('error', 'Please select a video file')
            return
        }
        const secureUrl = await uploadMediaFile(file, 'video')
        if (secureUrl) {
            setVideoPreview(secureUrl)
            setImagePreview(null)
        }
    }

    const handlePosterUpload = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            showToast('error', 'Please select an image file for the poster')
            return
        }
        const secureUrl = await uploadMediaFile(file, 'image')
        if (secureUrl) setPosterPreview(secureUrl)
    }

    const handleSave = async () => {
        if (formData.mediaType === 'image' && !formData.imageUrl) {
            showToast('error', 'Upload an image first')
            return
        }
        if (formData.mediaType === 'video' && !formData.videoUrl) {
            showToast('error', 'Upload a video first')
            return
        }
        if (formData.mediaType === 'text' && !formData.textContent) {
            showToast('error', 'Enter text content')
            return
        }

        try {
            setSaving(true)
            const payload = { ...formData }
            const url = editingBanner ? `/api/banners?id=${editingBanner._id}` : '/api/banners'
            const method = editingBanner ? 'put' : 'post'
            const response = await axios[method](url, payload)
            if (response.data.success) {
                showToast('success', editingBanner ? 'Banner updated' : 'Banner created')
                setDialogOpen(false)
                fetchBanners()
            }
        } catch (error) {
            showToast('error', error.response?.data?.message || 'Failed to save banner')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this banner?')) return
        try {
            await axios.delete(`/api/banners?id=${id}`)
            showToast('success', 'Banner deleted')
            fetchBanners()
        } catch {
            showToast('error', 'Failed to delete banner')
        }
    }

    const isTextLocation = textLocations.includes(formData.location)
    const getLocationLabel = (value) => locationOptions.find(opt => opt.value === value)?.label || value

    return (
        <div className='w-full'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5'>
                <div>
                    <h1 className='text-3xl font-bold'>Media Manager</h1>
                    <p className='text-gray-500 mt-1'>Manage homepage banners, videos and promotional text cleanly.</p>
                </div>
                <Button onClick={openAddDialog} className='whitespace-nowrap'><Plus className='h-4 w-4 mr-2' /> Add Media</Button>
            </div>

            <div className='mb-4 flex flex-col sm:flex-row items-center gap-3'>
                <div className='flex items-center gap-2'>
                    <Filter className='h-4 w-4 text-gray-500' />
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger className='w-[260px]'><SelectValue placeholder='Filter by location' /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value='all'>All Locations</SelectItem>
                            {locationOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <h2 className='text-lg font-semibold'>All Media ({filteredBanners.length})</h2>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className='text-center py-10'>Loading...</div>
                    ) : filteredBanners.length === 0 ? (
                        <div className='text-center py-10 text-gray-500'>
                            <p>No media yet.</p>
                            <Button onClick={openAddDialog} className='mt-3'>Add First Media</Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Preview</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className='text-right'>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBanners.map((banner) => (
                                    <TableRow key={banner._id}>
                                        <TableCell><Badge variant='outline'>{getLocationLabel(banner.location)}</Badge></TableCell>
                                        <TableCell>
                                            <Badge variant='outline' className='flex items-center gap-1'>
                                                {banner.mediaType === 'video' ? <Video className='h-3 w-3' /> : <ImageIcon className='h-3 w-3' />}
                                                {banner.mediaType === 'video' ? 'Video' : banner.mediaType === 'text' ? 'Text' : 'Image'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {banner.mediaType === 'video' ? (
                                                <div className='relative w-16 h-12 rounded overflow-hidden bg-slate-100'>
                                                    {banner.posterUrl ? <Image src={getImageUrl(banner.posterUrl)} fill alt='' className='object-cover' unoptimized /> : <div className='flex items-center justify-center h-full text-xs text-gray-500'>Video</div>}
                                                </div>
                                            ) : banner.imageUrl || banner.base64Image ? (
                                                <Image src={getImageUrl(banner.imageUrl || banner.base64Image)} width={60} height={40} alt='' className='rounded object-cover' unoptimized />
                                            ) : (
                                                <p className='text-xs text-gray-500'>No preview</p>
                                            )}
                                        </TableCell>
                                        <TableCell>{banner.title || banner.textContent?.slice(0, 30) || 'Untitled'}</TableCell>
                                        <TableCell><Badge variant='outline'>{banner.size || 'default'}</Badge></TableCell>
                                        <TableCell>
                                            <Badge className={banner.isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}>
                                                {banner.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className='text-right'>
                                            <div className='flex justify-end gap-1'>
                                                <Button variant='ghost' size='icon' onClick={() => openEditDialog(banner)}><Edit className='h-4 w-4' /></Button>
                                                <Button variant='ghost' size='icon' className='text-red-600' onClick={() => handleDelete(banner._id)}><Trash2 className='h-4 w-4' /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className='sm:max-w-3xl max-h-[90vh] overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle>{editingBanner ? 'Edit' : 'Add'} Media</DialogTitle>
                        <DialogDescription>Upload images, videos or text banners for the website.</DialogDescription>
                    </DialogHeader>

                    <div className='space-y-4 py-4'>
                        <div>
                            <Label>Location *</Label>
                            <Select value={formData.location} onValueChange={(value) => setFormData((prev) => ({
                                ...prev,
                                location: value,
                                mediaType: textLocations.includes(value) ? 'text' : prev.mediaType,
                            }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {locationOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>{option.label} ({option.size})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {!isTextLocation && (
                            <div>
                                <Label>Media Type</Label>
                                <Select value={formData.mediaType} onValueChange={(value) => setFormData((prev) => ({ ...prev, mediaType: value }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='image'>Image</SelectItem>
                                        <SelectItem value='video'>Video</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {!isTextLocation && formData.mediaType !== 'video' && (
                            <div>
                                <Label>Upload Image</Label>
                                <div className='mt-2'>
                                    {imagePreview ? (
                                        <div className='space-y-2'>
                                            <Image src={imagePreview} width={320} height={180} alt='Banner preview' className='rounded object-cover w-full' unoptimized />
                                            <Button variant='outline' onClick={() => document.getElementById('imageUpload').click()}><Upload className='h-4 w-4 mr-2' /> Change Image</Button>
                                        </div>
                                    ) : (
                                        <Button variant='outline' onClick={() => document.getElementById('imageUpload').click()}><Upload className='h-4 w-4 mr-2' /> Upload Image</Button>
                                    )}
                                    <input id='imageUpload' type='file' accept='image/*' className='hidden' onChange={handleImageUpload} />
                                </div>
                            </div>
                        )}

                        {!isTextLocation && formData.mediaType === 'video' && (
                            <>
                                <div>
                                    <Label>Upload Video</Label>
                                    <div className='mt-2'>
                                        {videoPreview ? (
                                            <video src={videoPreview} controls className='w-full max-h-[260px] rounded bg-black' />
                                        ) : (
                                            <Button variant='outline' onClick={() => document.getElementById('videoUpload').click()}><Upload className='h-4 w-4 mr-2' /> Upload Video</Button>
                                        )}
                                        <input id='videoUpload' type='file' accept='video/*' className='hidden' onChange={handleVideoUpload} />
                                    </div>
                                </div>
                                <div>
                                    <Label>Upload Poster Image (Optional)</Label>
                                    <div className='mt-2'>
                                        {posterPreview ? (
                                            <div className='space-y-2'>
                                                <Image src={posterPreview} width={320} height={180} alt='Poster preview' className='rounded object-cover w-full' unoptimized />
                                                <Button variant='outline' onClick={() => document.getElementById('posterUpload').click()}><Upload className='h-4 w-4 mr-2' /> Change Poster</Button>
                                            </div>
                                        ) : (
                                            <Button variant='outline' onClick={() => document.getElementById('posterUpload').click()}><Upload className='h-4 w-4 mr-2' /> Upload Poster</Button>
                                        )}
                                        <input id='posterUpload' type='file' accept='image/*' className='hidden' onChange={handlePosterUpload} />
                                    </div>
                                </div>
                                <div className='grid grid-cols-2 gap-3'>
                                    <div className='flex items-center justify-between gap-3'>
                                        <Label>Autoplay</Label>
                                        <Switch checked={formData.videoSettings.autoplay} onCheckedChange={(value) => setFormData((prev) => ({ ...prev, videoSettings: { ...prev.videoSettings, autoplay: value } }))} />
                                    </div>
                                    <div className='flex items-center justify-between gap-3'>
                                        <Label>Loop</Label>
                                        <Switch checked={formData.videoSettings.loop} onCheckedChange={(value) => setFormData((prev) => ({ ...prev, videoSettings: { ...prev.videoSettings, loop: value } }))} />
                                    </div>
                                    <div className='flex items-center justify-between gap-3'>
                                        <Label>Muted</Label>
                                        <Switch checked={formData.videoSettings.muted} onCheckedChange={(value) => setFormData((prev) => ({ ...prev, videoSettings: { ...prev.videoSettings, muted: value } }))} />
                                    </div>
                                    <div className='flex items-center justify-between gap-3'>
                                        <Label>Controls</Label>
                                        <Switch checked={formData.videoSettings.controls} onCheckedChange={(value) => setFormData((prev) => ({ ...prev, videoSettings: { ...prev.videoSettings, controls: value } }))} />
                                    </div>
                                </div>
                            </>
                        )}

                        {isTextLocation && (
                            <div>
                                <Label>Text Content *</Label>
                                <Input value={formData.textContent} onChange={(e) => setFormData({ ...formData, textContent: e.target.value })} placeholder='Enter banner text' />
                            </div>
                        )}

                        {!isTextLocation && (
                            <>
                                <div><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
                                <div><Label>Subtitle</Label><Input value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} /></div>
                                <div><Label>Link</Label><Input value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} placeholder='/shop' /></div>
                                <div><Label>Button Text</Label><Input value={formData.buttonText} onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })} placeholder='Shop Now' /></div>
                            </>
                        )}

                        {!isTextLocation && (
                            <>
                                <div>
                                    <Label>Banner Size</Label>
                                    <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                                        <SelectTrigger><SelectValue placeholder='Select size' /></SelectTrigger>
                                        <SelectContent>
                                            {sizeOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.size === 'custom' && (
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div><Label>Width</Label><Input type='number' value={formData.customWidth} onChange={(e) => setFormData({ ...formData, customWidth: e.target.value })} placeholder='900' /></div>
                                        <div><Label>Height</Label><Input type='number' value={formData.customHeight} onChange={(e) => setFormData({ ...formData, customHeight: e.target.value })} placeholder='500' /></div>
                                    </div>
                                )}
                            </>
                        )}

                        <div className='flex items-center justify-between'>
                            <Label>Active</Label>
                            <Switch checked={formData.isActive} onCheckedChange={(value) => setFormData({ ...formData, isActive: value })} />
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <div><Label>Start Date</Label><Input type='date' value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} /></div>
                            <div><Label>End Date</Label><Input type='date' value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} /></div>
                        </div>
                    </div>
                    <DialogFooter className='flex items-center justify-end gap-3'>
                        <Button variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <ButtonLoading loading={saving} onClick={handleSave} text={editingBanner ? 'Update' : 'Save'} />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AdminBannersPage
