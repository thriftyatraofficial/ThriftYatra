'use client'
import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { X, Camera } from 'lucide-react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const MobileImageUploader = ({ value = [], onChange, maxFiles = 5 }) => {
    const fileInputRef = useRef(null)
    const canvasRef = useRef(null)
    const [uploading, setUploading] = useState(false)

    // Auto-crop to 3:4 ratio (1080x1440)
    const TARGET_WIDTH = 1080
    const TARGET_HEIGHT = 1440

    const autoCropImage = (base64) => {
        return new Promise((resolve) => {
            const canvas = canvasRef.current
            if (!canvas) {
                resolve(base64)
                return
            }

            const img = new window.Image()
            img.src = base64
            img.onload = () => {
                canvas.width = TARGET_WIDTH
                canvas.height = TARGET_HEIGHT
                const ctx = canvas.getContext('2d')

                // Calculate dimensions to cover the canvas
                const imgRatio = img.width / img.height
                const targetRatio = TARGET_WIDTH / TARGET_HEIGHT

                let drawWidth, drawHeight, offsetX, offsetY

                if (imgRatio > targetRatio) {
                    // Image is wider - crop sides
                    drawHeight = TARGET_HEIGHT
                    drawWidth = img.width * (TARGET_HEIGHT / img.height)
                    offsetX = (drawWidth - TARGET_WIDTH) / 2
                    offsetY = 0
                } else {
                    // Image is taller - crop top/bottom
                    drawWidth = TARGET_WIDTH
                    drawHeight = img.height * (TARGET_WIDTH / img.width)
                    offsetX = 0
                    offsetY = (drawHeight - TARGET_HEIGHT) / 2
                }

                // White background
                ctx.fillStyle = '#FFFFFF'
                ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT)

                // Draw image centered and cropped
                ctx.drawImage(
                    img,
                    -offsetX, -offsetY, drawWidth, drawHeight
                )

                resolve(canvas.toDataURL('image/jpeg', 0.85))
            }
            img.onerror = () => resolve(base64)
        })
    }

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files)
        if (!files.length) return

        if (value.length + files.length > maxFiles) {
            alert(`Maximum ${maxFiles} images allowed`)
            return
        }

        setUploading(true)

        const newImages = []

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                alert('Please select only image files')
                continue
            }

            if (file.size > 5 * 1024 * 1024) {
                alert(`${file.name} is too large. Maximum 5MB allowed.`)
                continue
            }

            // Convert to base64
            const base64 = await new Promise((resolve) => {
                const reader = new FileReader()
                reader.onload = (e) => resolve(e.target.result)
                reader.readAsDataURL(file)
            })

            // Auto-crop
            const cropped = await autoCropImage(base64)

            newImages.push({
                secure_url: cropped,
                public_id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                alt: file.name,
                isBase64: true
            })
        }

        onChange([...value, ...newImages])
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removeImage = (index) => {
        const newImages = value.filter((_, i) => i !== index)
        onChange(newImages)
    }

    return (
        <div>
            {/* Hidden canvas for auto-crop */}
            <canvas ref={canvasRef} className='hidden' />

            <div className='grid grid-cols-3 md:grid-cols-4 gap-3 mb-3'>
                {value.map((image, index) => (
                    <div key={index} className='relative aspect-[3/4] border rounded-lg overflow-hidden group'>
                        <Image
                            src={image?.secure_url || image || imgPlaceholder}
                            alt={image?.alt || `Image ${index + 1}`}
                            fill
                            className='object-cover'
                            unoptimized={typeof image?.secure_url === 'string' && image.secure_url.startsWith('data:')}
                        />
                        <button
                            type='button'
                            onClick={() => removeImage(index)}
                            className='absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10'
                        >
                            <X size={14} />
                        </button>
                        <div className='absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs text-center py-0.5'>
                            {index + 1}
                        </div>
                    </div>
                ))}

                {value.length < maxFiles && (
                    <button
                        type='button'
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className='aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[#E8B931] hover:bg-gray-50 transition-colors disabled:opacity-50'
                    >
                        {uploading ? (
                            <span className='text-sm text-gray-500'>Cropping...</span>
                        ) : (
                            <>
                                <Camera size={24} className='text-gray-400' />
                                <span className='text-xs text-gray-500'>Add Photo</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                multiple
                onChange={handleFileSelect}
                className='hidden'
                capture='environment'
            />

            <p className='text-xs text-gray-500'>
                📸 {value.length}/{maxFiles} images • Auto-crops to 3:4 (1080×1440) • Max 5MB
            </p>
        </div>
    )
}

export default MobileImageUploader