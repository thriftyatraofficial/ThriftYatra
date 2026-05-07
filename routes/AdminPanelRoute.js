export const ADMIN_DASHBOARD = '/admin/dashboard'



// Category routes 
export const ADMIN_CATEGORY_ADD = '/admin/category/add'
export const ADMIN_CATEGORY_SHOW = '/admin/category'
export const ADMIN_CATEGORY_EDIT = (id) => id ? `/admin/category/edit/${id}` : ''

// Commission routes
export const ADMIN_COMMISSION = '/admin/commission'

// Payout routes
export const ADMIN_PAYOUTS = '/admin/payouts'

// Banner routes
export const ADMIN_BANNERS = '/admin/banners'

// Product routes 
export const ADMIN_PRODUCT_ADD = '/admin/product/add'
export const ADMIN_PRODUCT_SHOW = '/admin/product'
export const ADMIN_PRODUCT_EDIT = (id) => id ? `/admin/product/edit/${id}` : ''

// Product Variant routes 
export const ADMIN_PRODUCT_VARIANT_ADD = '/admin/product-variant/add'
export const ADMIN_PRODUCT_VARIANT_SHOW = '/admin/product-variant'
export const ADMIN_PRODUCT_VARIANT_EDIT = (id) => id ? `/admin/product-variant/edit/${id}` : ''



// Customer route 
export const ADMIN_CUSTOMERS_SHOW = '/admin/customers'
export const ADMIN_CUSTOMER_DETAILS = (userId) => userId ? `/admin/customers/${userId}` : ''



// Orders routes  
export const ADMIN_ORDER_SHOW = '/admin/orders'
export const ADMIN_ORDER_DETAILS = (order_id) => order_id ? `/admin/orders/details/${order_id}` : ''

// Trash route 
export const ADMIN_TRASH = '/admin/trash'

// ========== SELLER MANAGEMENT ROUTES ==========
export const ADMIN_SELLERS_SHOW = '/admin/sellers'
export const ADMIN_SELLERS_PENDING = '/admin/sellers?status=pending'
export const ADMIN_THRIFT_SELLERS = '/admin/sellers?type=thrift_seller'
export const ADMIN_BRAND_SELLERS = '/admin/sellers?type=brand_seller'
export const ADMIN_SELLER_DETAILS = (sellerId) => sellerId ? `/admin/sellers/${sellerId}` : ''
export const ADMIN_PROMOTE_TO_SELLER = '/admin/users/promote'

// ========== DELIVERY MANAGEMENT ROUTES ==========
export const ADMIN_DELIVERY_SHOW = '/admin/delivery'
export const ADMIN_DELIVERY_UPDATE = (orderId) => orderId ? `/admin/delivery/${orderId}` : ''