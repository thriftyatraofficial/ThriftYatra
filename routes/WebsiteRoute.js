export const WEBSITE_HOME = "/"
export const WEBSITE_LOGIN = "/auth/login"
export const WEBSITE_REGISTER = "/auth/register"
export const WEBSITE_RESETPASSWORD = "/auth/reset-password"

export const WEBSITE_SHOP = "/shop"

export const WEBSITE_PRODUCT_DETAILS = (slug) => slug ? `/product/${slug}` : '/product'

export const WEBSITE_CART = "/cart"
export const WEBSITE_CHECKOUT = "/checkout"

export const WEBSITE_ORDER_DETAILS = (order_id) => `/order-details/${order_id}`
export const WEBSITE_ORDER_CONFIRMATION = (order_id) => `/order-confirmation/${order_id}`



export const SELLER_REGISTER = '/auth/register-seller'
export const THRIFT_SELLER_DASHBOARD = '/seller/thrift/dashboard'
export const BRAND_SELLER_DASHBOARD = '/seller/brand/dashboard'

// ✅ NEW ROUTES
export const WEBSITE_BRANDS = "/brands"
export const WEBSITE_BRAND_DETAILS = (slug) => `/brands/${slug}`
export const WEBSITE_SELLER_STORE = (slug) => `/seller/${slug}`

// User routes 
export const USER_DASHBOARD = "/my-account"
export const USER_PROFILE = "/profile"
export const USER_ORDERS = "/orders"
export const WEBSITE_FORGOT_PASSWORD = "/auth/forgot-password"