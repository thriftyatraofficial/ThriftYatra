import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Chip } from "@mui/material"
import dayjs from "dayjs"
import userIcon from '@/public/assets/images/user.png'

export const DT_CATEGORY_COLUMN = [
    { accessorKey: 'name', header: 'Category Name' },
    { accessorKey: 'slug', header: 'Slug' },
]

export const DT_PRODUCT_COLUMN = [
    { accessorKey: 'name', header: 'Product Name' },
    { accessorKey: 'slug', header: 'Slug' },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'mrp', header: 'MRP' },
    { accessorKey: 'sellingPrice', header: 'Selling Price' },
    { accessorKey: 'discountPercentage', header: 'Discount Percentage' },
]

export const DT_PRODUCT_VARIANT_COLUMN = [
    { accessorKey: 'product', header: 'Product Name' },
    { accessorKey: 'color', header: 'Color' },
    { accessorKey: 'size', header: 'Size' },
    { accessorKey: 'sku', header: 'SKU' },
    { accessorKey: 'mrp', header: 'MRP' },
    { accessorKey: 'sellingPrice', header: 'Selling Price' },
    { accessorKey: 'discountPercentage', header: 'Discount Percentage' },
]

export const DT_CUSTOMERS_COLUMN = [
    {
        accessorKey: 'avatar', header: 'Avatar',
        Cell: ({ renderedCellValue }) => (
            <Avatar><AvatarImage src={renderedCellValue?.url || userIcon.src} /></Avatar>
        )
    },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'address', header: 'Address' },
    {
        accessorKey: 'isEmailVerified', header: 'Is Verified',
        Cell: ({ renderedCellValue }) => (
            renderedCellValue ? <Chip color="success" label="Verified" /> : <Chip color="error" label="Not Verified" />
        )
    },
]

export const DT_ORDER_COLUMN = [
    { accessorKey: 'order_id', header: 'Order ID' },
    { accessorKey: 'payment_id', header: 'Payment ID' },
    { accessorKey: 'name', header: 'Customer' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'city', header: 'City' },
    { accessorKey: 'state', header: 'State' },
    { accessorKey: 'pincode', header: 'Pincode' },
    {
        accessorKey: 'totalItem', header: 'Items',
        Cell: ({ row }) => (<span>{row?.original?.products?.length || 0}</span>)
    },
    { accessorKey: 'totalAmount', header: 'Amount' },
    { accessorKey: 'status', header: 'Status' },
]

export const DT_COUPON_COLUMN = [
    { accessorKey: 'code', header: 'Coupon Code' },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'discountType', header: 'Discount Type' },
    { accessorKey: 'discountValue', header: 'Discount Value' },
    { accessorKey: 'minimumOrder', header: 'Minimum Order' },
    { accessorKey: 'maximumDiscount', header: 'Maximum Discount' },
    {
        accessorKey: 'isActive', header: 'Status',
        Cell: ({ renderedCellValue }) => (
            renderedCellValue ? <Chip color="success" label="Active" /> : <Chip color="error" label="Inactive" />
        )
    },
    {
        accessorKey: 'expiryDate', header: 'Expiry Date',
        Cell: ({ renderedCellValue }) => dayjs(renderedCellValue).format('DD/MM/YYYY')
    },
]

export const DT_REVIEW_COLUMN = [
    {
        accessorKey: 'user', header: 'Customer',
        Cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Avatar>
                    <AvatarImage src={row?.original?.user?.avatar || userIcon.src} />
                </Avatar>
                <span>{row?.original?.user?.name || 'Unknown'}</span>
            </div>
        )
    },
    {
        accessorKey: 'product', header: 'Product',
        Cell: ({ row }) => (<span>{row?.original?.product?.name || 'Product'}</span>)
    },
    { accessorKey: 'rating', header: 'Rating' },
    { accessorKey: 'review', header: 'Review' },
    {
        accessorKey: 'isVerified', header: 'Verified',
        Cell: ({ renderedCellValue }) => (
            renderedCellValue ? <Chip color="success" label="Verified" /> : <Chip color="warning" label="Pending" />
        )
    },
    {
        accessorKey: 'createdAt', header: 'Date',
        Cell: ({ renderedCellValue }) => dayjs(renderedCellValue).format('DD/MM/YYYY')
    },
]