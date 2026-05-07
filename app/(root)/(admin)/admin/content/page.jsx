'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Editor from '@/components/Application/Admin/Editor'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import ButtonLoading from '@/components/Application/ButtonLoading'

const pageOptions = [
    { slug: 'about-us', title: 'About Us' },
    { slug: 'shipping-policy', title: 'Shipping Policy' },
    { slug: 'return-policy', title: 'Return Policy' },
    { slug: 'privacy-policy', title: 'Privacy Policy' },
    { slug: 'terms-and-conditions', title: 'Terms & Conditions' },
    { slug: 'shipping-returns', title: 'Shipping & Returns (Product Page)' },
]

const AdminContentPage = () => {
    const [selectedPage, setSelectedPage] = useState('about-us')
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchPage(selectedPage)
    }, [selectedPage])

    const fetchPage = async (slug) => {
        try {
            setLoading(true)
            const { data } = await axios.get(`/api/admin/content?slug=${slug}`)
            if (data.success && data.data) {
                setTitle(data.data.title)
                setContent(data.data.content)
            } else {
                const page = pageOptions.find(p => p.slug === slug)
                setTitle(page?.title || '')
                setContent('')
            }
        } catch (error) {
            console.error('Failed to load page:', error)
        } finally { setLoading(false) }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const { data } = await axios.post('/api/admin/content', {
                slug: selectedPage,
                title,
                content
            })
            if (data.success) showToast('success', 'Page saved! Changes are live on website.')
        } catch (error) {
            showToast('error', 'Failed to save page')
        } finally { setSaving(false) }
    }

    return (
        <div className='w-full max-w-4xl mx-auto'>
            <h1 className='text-2xl font-bold mb-6'>Content Pages</h1>
            
            <Card>
                <CardHeader><h2 className="text-lg font-semibold">Edit Page Content</h2></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Select Page</Label>
                        <Select value={selectedPage} onValueChange={setSelectedPage}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {pageOptions.map(p => <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Page Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                        <Label>Content</Label>
                        <div className="mt-1 border rounded-md min-h-[300px]">
                            {!loading && <Editor value={content} onChange={setContent} />}
                        </div>
                    </div>
                    <ButtonLoading loading={saving} onClick={handleSave} text="Save & Publish" className="w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

export default AdminContentPage