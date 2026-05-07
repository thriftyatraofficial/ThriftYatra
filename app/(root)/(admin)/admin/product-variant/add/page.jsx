'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import { ADMIN_DASHBOARD, ADMIN_PRODUCT_VARIANT_SHOW } from '@/routes/AdminPanelRoute'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { showToast } from '@/lib/showToast'
import axios from 'axios'
import useFetch from '@/hooks/useFetch'
import Select from '@/components/Application/Select'
import MediaModal from '@/components/Application/Admin/MediaModal'
import Image from 'next/image'
import { sizes } from '@/lib/utils'
import { z } from 'zod'

const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: ADMIN_PRODUCT_VARIANT_SHOW, label: 'Product Variants' },
  { href: '', label: 'Add Product Variant' },
]

const AddProductVariant = () => {
  const [loading, setLoading] = useState(false)
  const [productOption, setProductOption] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState([])
  const { data: getProduct } = useFetch('/api/product?deleteType=SD&&size=10000')

  useEffect(() => {
    if (getProduct && getProduct.success) {
      const data = getProduct.data
      const options = data
        .filter(p => p.productType === 'brand_new')
        .map(p => ({ label: p.name, value: p._id }))
      setProductOption(options)
    }
  }, [getProduct])

  const formSchema = z.object({
    product: z.string().min(1, 'Product is required'),
    sku: z.string().min(3, 'SKU is required'),
    color: z.string().min(1, 'Color is required'),
    size: z.string().min(1, 'Size is required'),
    mrp: z.coerce.number().min(1, 'MRP must be at least 1'),
    sellingPrice: z.coerce.number().min(1, 'Selling price must be at least 1'),
    quantity: z.coerce.number().min(0, 'Quantity cannot be negative').default(0),
  })

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product: "", sku: "", color: "", size: "", mrp: "", sellingPrice: "", quantity: "0"
    },
  })

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      if (selectedMedia.length === 0) {
        showToast('error', 'Please select at least one media.')
        setLoading(false)
        return
      }

      // ✅ Send only valid ObjectId strings
      const mediaIds = selectedMedia
        .map(m => m._id)
        .filter(id => id && /^[0-9a-fA-F]{24}$/.test(id))

      const payload = { ...values, media: mediaIds }
      
      console.log('📤 Sending payload:', payload)

      const { data: response } = await axios.post('/api/product-variant', payload)
      if (!response.success) throw new Error(response.message)

      form.reset()
      setSelectedMedia([])
      showToast('success', 'Product variant added successfully')
    } catch (error) {
      showToast('error', error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <BreadCrumb breadcrumbData={breadcrumbData} />
      <Card className="py-0 rounded shadow-sm">
        <CardHeader className="pt-3 px-3 border-b [.border-b]:pb-2">
          <h4 className='text-xl font-semibold'>Add Product Variant</h4>
        </CardHeader>
        <CardContent className="pb-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className='grid md:grid-cols-2 grid-cols-1 gap-5'>
                <div className='md:col-span-2'>
                  <FormField control={form.control} name="product" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product <span className='text-red-500'>*</span></FormLabel>
                      <FormControl>
                        <Select options={productOption} selected={field.value} setSelected={field.onChange} isMulti={false} placeholder="Select product" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div>
                  <FormField control={form.control} name="sku" render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU<span className='text-red-500'>*</span></FormLabel>
                      <FormControl><Input placeholder="Enter SKU" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div>
                  <FormField control={form.control} name="color" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color<span className='text-red-500'>*</span></FormLabel>
                      <FormControl><Input placeholder="Enter color" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div>
                  <FormField control={form.control} name="size" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size<span className='text-red-500'>*</span></FormLabel>
                      <FormControl>
                        <Select options={sizes} selected={field.value} setSelected={field.onChange} isMulti={false} placeholder="Select size" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div>
                  <FormField control={form.control} name="mrp" render={({ field }) => (
                    <FormItem>
                      <FormLabel>MRP<span className='text-red-500'>*</span></FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div>
                  <FormField control={form.control} name="sellingPrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price<span className='text-red-500'>*</span></FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div>
                  <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl><Input type="number" min="0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className='md:col-span-2 border border-dashed rounded p-5 text-center mt-5'>
                <MediaModal
                  open={open}
                  setOpen={setOpen}
                  selectedMedia={selectedMedia}
                  setSelectedMedia={setSelectedMedia}
                  isMultiple={true}
                />
                {selectedMedia.length > 0 && (
                  <div className='flex justify-center items-center flex-wrap mb-3 gap-2'>
                    {selectedMedia.map(media => (
                      <div key={media._id} className='h-24 w-24 border'>
                        <Image src={media.url} height={100} width={100} alt='' className='size-full object-cover' />
                      </div>
                    ))}
                  </div>
                )}
                <div onClick={() => setOpen(true)} className='bg-gray-50 dark:bg-card border w-[200px] mx-auto p-5 cursor-pointer'>
                  <span className='font-semibold'>Select Media</span>
                </div>
              </div>

              <div className='mb-3 mt-5'>
                <ButtonLoading loading={loading} type="submit" text="Add Product Variant" className="cursor-pointer" />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AddProductVariant