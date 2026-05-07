'use client'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { renderSafeMarkdown } from '@/lib/safeMarkdown'

const breadcrumb = { title: 'Terms & Conditions', links: [{ label: 'Terms & Conditions' }] }

const TermsAndConditions = () => {
    const [content, setContent] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchContent() }, [])

    const fetchContent = async () => {
        try {
            const { data } = await axios.get('/api/content/terms-and-conditions')
            if (data.success && data.data) {
                const htmlContent = renderSafeMarkdown(data.data.content)
                setContent({ ...data.data, content: htmlContent })
            }
        } catch (error) { console.error('Failed to fetch content:', error) }
        finally { setLoading(false) }
    }

    return (
        <div>
            <WebsiteBreadcrumb props={breadcrumb} />
            <div className='lg:px-40 px-5 py-20'>
                {loading ? <div className="text-center py-10">Loading...</div> : content ? (
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content.content }} />
                ) : (
                    <div>
                        <h1 className='text-xl font-semibold mb-3'>Terms & Conditions</h1>
                        <p>By using ThriftYatra, you agree to our terms and conditions.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TermsAndConditions
