'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { showToast } from '@/lib/showToast'
import { IoMdClose } from 'react-icons/io'

const MediaModal = ({ open, setOpen, selectedMedia, setSelectedMedia, isMultiple = false }) => {
    const [media, setMedia] = useState([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        if (open) fetchMedia()
    }, [open, search])

    const fetchMedia = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get(`/api/media?search=${search}&limit=50`)
            if (data.success) setMedia(data.data)
        } catch (error) {
            showToast('error', 'Failed to fetch media')
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (item) => {
        if (isMultiple) {
            const isSelected = selectedMedia.some(m => m._id === item._id)
            if (isSelected) {
                setSelectedMedia(selectedMedia.filter(m => m._id !== item._id))
            } else {
                setSelectedMedia([...selectedMedia, item])
            }
        } else {
            setSelectedMedia([item])
            setOpen(false)
        }
    }

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        setUploading(true)
        try {
            const formData = new FormData()
            files.forEach(file => formData.append('files', file))

            const { data } = await axios.post('/api/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            if (data.success) {
                showToast('success', `${data.data.length} media uploaded successfully`)
                fetchMedia() // Refresh the media list
            }
        } catch (error) {
            showToast('error', 'Failed to upload media')
        } finally {
            setUploading(false)
        }
    }

    const isSelected = (item) => selectedMedia.some(m => m._id === item._id)

    // Get the display URL for the media item
    const getMediaUrl = (item) => {
        if (item.url) return item.url
        if (item.secure_url) return item.secure_url
        if (item.base64Data) return item.base64Data
        return '/placeholder-image.jpg' // Fallback
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Select Media</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search and Upload */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search media..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1"
                        />
                        <div>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="media-upload"
                            />
                            <label htmlFor="media-upload">
                                <Button asChild disabled={uploading}>
                                    <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                                </Button>
                            </label>
                        </div>
                    </div>

                    {/* Media Grid */}
                    <div className="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="col-span-4 text-center py-8">Loading...</div>
                        ) : media.length === 0 ? (
                            <div className="col-span-4 text-center py-8">No media found</div>
                        ) : (
                            media.map((item) => (
                                <div
                                    key={item._id}
                                    className={`relative cursor-pointer border-2 rounded-lg overflow-hidden ${
                                        isSelected(item) ? 'border-blue-500' : 'border-gray-200'
                                    }`}
                                    onClick={() => handleSelect(item)}
                                >
                                    <Image
                                        src={getMediaUrl(item)}
                                        alt={item.alt || item.filename || 'Media'}
                                        width={150}
                                        height={150}
                                        className="w-full h-32 object-cover"
                                        unoptimized={item.base64Data ? true : false}
                                    />
                                    {isSelected(item) && (
                                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                                            <IoMdClose size={12} />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Selected Count */}
                    {isMultiple && selectedMedia.length > 0 && (
                        <div className="text-sm text-gray-600">
                            {selectedMedia.length} media selected
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        {isMultiple && (
                            <Button onClick={() => setOpen(false)}>
                                Done ({selectedMedia.length})
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default MediaModal