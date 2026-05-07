'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import { ADMIN_DASHBOARD, ADMIN_PRODUCT_SHOW } from '@/routes/AdminPanelRoute'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { useForm, Controller } from 'react-hook-form'  // ✅ ADD Controller
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import slugify from 'slugify'
import { showToast } from '@/lib/showToast'
import axios from 'axios'
import useFetch from '@/hooks/useFetch'
import Select from '@/components/Application/Select'
import Editor from '@/components/Application/Admin/Editor'
import MobileImageUploader from '@/components/Application/MobileImageUploader'  // ✅ USE THIS
import { productCondition, productTypes } from '@/lib/utils'
import SizeChartBuilder from '@/components/Application/SizeChartBuilder'
import { z } from 'zod'

const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: ADMIN_PRODUCT_SHOW, label: 'Products' },
  { href: '', label: 'Add Product' },
]

const AddProduct = () => {
  const [loading, setLoading] = useState(false)
  const [categoryOption, setCategoryOption] = useState([])
  const [productType, setProductType] = useState('brand_new')
  const [condition, setCondition] = useState('')
  const [sizeChart, setSizeChart] = useState(null)
  const [uniqueCode, setUniqueCode] = useState('')
  
  const { data: getCategory } = useFetch('/api/category?deleteType=SD&&size=10000')

  useEffect(() => {
    if (getCategory && getCategory.success) {
      const data = getCategory.data
      const options = data.map((cat) => ({ label: cat.name, value: cat._id }))
      setCategoryOption(options)
    }
  }, [getCategory])

  const formSchema = z.object({
    name: z.string().min(3, 'Product name is required'),
    slug: z.string().min(3, 'Slug is required'),
    category: z.string().min(1, 'Category is required'),
    mrp: z.coerce.number().min(1, 'MRP must be at least 1'),
    sellingPrice: z.coerce.number().min(1, 'Selling price must be at least 1'),
    discountPercentage: z.coerce.number().min(0, 'Discount cannot be negative').default(0),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    media: z.array(z.any()).min(1, 'At least one image is required'),  // ✅ ADD media to schema
  })

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      category: "",
      mrp: "",
      sellingPrice: "",
      discountPercentage: "0",
      description: "",
      media: [],  // ✅ ADD default
    },
  })

  useEffect(() => {
    const name = form.getValues('name')
    if (name) {
      form.setValue('slug', slugify(name).toLowerCase())
    }
  }, [form.watch('name')])

  useEffect(() => {
    const mrp = Number(form.getValues('mrp')) || 0
    const sellingPrice = Number(form.getValues('sellingPrice')) || 0

    if (mrp > 0 && sellingPrice > 0) {
      const discountPercentage = ((mrp - sellingPrice) / mrp) * 100
      form.setValue('discountPercentage', Math.round(discountPercentage).toString())
    }
  }, [form.watch('mrp'), form.watch('sellingPrice')])

  const editor = (event, editor) => {
    let data = ''
    if (editor && typeof editor.getData === 'function') {
      data = editor.getData()
    } else if (event && typeof event.getData === 'function') {
      data = event.getData()
    } else if (typeof event === 'string') {
      data = event
    }
    if (data) {
      form.setValue('description', data, { shouldValidate: true })
    }
  }

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      if (!values.media || values.media.length === 0) {
        showToast('error', 'Please upload at least one image.')
        setLoading(false)
        return
      }

      if (!uniqueCode || uniqueCode.length < 3) {
        showToast('error', 'SKU/Unique Code is required (min 3 characters)')
        setLoading(false)
        return
      }

      if (productType === 'thrift' && !condition) {
        showToast('error', 'Condition is required for thrift items')
        setLoading(false)
        return
      }

      if (!values.description || values.description.length < 10) {
        showToast('error', 'Description must be at least 10 characters')
        setLoading(false)
        return
      }

      // ✅ Send the full media objects with base64
      const mediaItems = values.media.map(item => ({
        secure_url: item.secure_url,
        public_id: item.public_id || `product_${Date.now()}`,
        alt: item.alt || values.name,
        isBase64: true
      }))

      const payload = {
        name: values.name,
        slug: values.slug,
        category: values.category,
        mrp: productType === 'thrift' ? Number(values.sellingPrice) : Number(values.mrp),
        sellingPrice: Number(values.sellingPrice),
        discountPercentage: Number(values.discountPercentage) || 0,
        description: values.description,
        media: mediaItems,  // ✅ Send full objects with base64
        productType: productType,
        condition: productType === 'thrift' ? condition : null,
        sizeChart: sizeChart,
        uniqueCode: uniqueCode,
      }

      console.log('📤 Sending payload:', payload)

      const { data: response } = await axios.post('/api/product', payload)
      
      if (!response.success) {
        throw new Error(response.message)
      }

      form.reset()
      setUniqueCode('')
      setCondition('')
      setSizeChart(null)
      showToast('success', 'Product added successfully')
    } catch (error) {
      console.error('Submit error:', error)
      showToast('error', error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  const conditionOptions = productCondition.map(c => ({ label: c.label, value: c.value }))
  const productTypeOptions = productTypes.map(t => ({ label: t.label, value: t.value }))

  return (
    <div>
      <BreadCrumb breadcrumbData={breadcrumbData} />

      <Card className="py-0 rounded shadow-sm">
        <CardHeader className="pt-3 px-3 border-b [.border-b]:pb-2">
          <h4 className='text-xl font-semibold'>Add Product</h4>
        </CardHeader>
        <CardContent className="pb-5">

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} >

              <div className='grid md:grid-cols-2 grid-cols-1 gap-5'>

                <div className='md:col-span-2'>
                  <FormLabel>Product Type <span className='text-red-500'>*</span></FormLabel>
                  <Select
                    options={productTypeOptions}
                    selected={productType}
                    setSelected={setProductType}
                    isMulti={false}
                    placeholder="Select product type"
                  />
                </div>

                <div className='md:col-span-2'>
                  <FormLabel>SKU / Unique Code <span className='text-red-500'>*</span></FormLabel>
                  <Input 
                    type="text" 
                    placeholder="e.g., TH-001 or BN-001" 
                    value={uniqueCode} 
                    onChange={(e) => setUniqueCode(e.target.value)} 
                    className='mt-1'
                  />
                </div>

                <div className=''>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name<span className='text-red-500'>*</span></FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="Enter product name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className=''>
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug <span className='text-red-500'>*</span></FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="Enter slug" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className=''>
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category <span className='text-red-500'>*</span></FormLabel>
                        <FormControl>
                          <Select
                            options={categoryOption}
                            selected={field.value}
                            setSelected={field.onChange}
                            isMulti={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {productType === 'thrift' && (
                  <div className=''>
                    <FormLabel>Condition <span className='text-red-500'>*</span></FormLabel>
                    <Select
                      options={conditionOptions}
                      selected={condition}
                      setSelected={setCondition}
                      isMulti={false}
                      placeholder="Select condition"
                    />
                  </div>
                )}

                <div className=''>
                  <FormField
                    control={form.control}
                    name="mrp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MRP <span className='text-red-500'>*</span></FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter MRP" 
                            {...field} 
                            readOnly={productType === 'thrift'}
                            className={productType === 'thrift' ? 'bg-gray-100' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className=''>
                  <FormField
                    control={form.control}
                    name="sellingPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price <span className='text-red-500'>*</span></FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter Selling Price" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className=''>
                  <FormField
                    control={form.control}
                    name="discountPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount %</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='md:col-span-2'>
                  <FormLabel>Size Chart (Optional)</FormLabel>
                  <div className='mt-2'>
                    <SizeChartBuilder value={sizeChart} onChange={setSizeChart} />
                  </div>
                </div>

                <div className='mb-5 md:col-span-2'>
                  <FormLabel className="mb-2">Description <span className='text-red-500'>*</span></FormLabel>
                  <Editor onChange={editor} />
                  <FormMessage>{form.formState.errors.description?.message}</FormMessage>
                </div>

                {/* ✅ USE MOBILE IMAGE UPLOADER */}
                <div className='md:col-span-2'>
                  <FormLabel>Product Images <span className='text-red-500'>*</span></FormLabel>
                  <div className='mt-2'>
                    <Controller
                      name="media"
                      control={form.control}
                      render={({ field }) => (
                        <MobileImageUploader
                          value={field.value || []}
                          onChange={(newMedia) => {
                            field.onChange(newMedia)
                          }}
                          maxFiles={5}
                        />
                      )}
                    />
                  </div>
                  {form.formState.errors.media && (
                    <p className='text-red-500 text-sm mt-1'>{form.formState.errors.media.message}</p>
                  )}
                </div>

              </div>

              <div className='mb-3 mt-5'>
                <ButtonLoading loading={loading} type="submit" text="Add Product" className="cursor-pointer" />
              </div>

            </form>
          </Form>

        </CardContent>
      </Card>

    </div>
  )
}

export default AddProduct