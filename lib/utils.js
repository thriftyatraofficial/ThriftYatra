import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ========== EXISTING CONSTANTS ==========

export const sizes = [
  { label: 'S', value: 'S' },
  { label: 'M', value: 'M' },
  { label: 'L', value: 'L' },
  { label: 'XL', value: 'XL' },
  { label: '2XL', value: '2XL' }
];

export const sortings = [
  { label: 'Default Sorting', value: 'default_sorting' },
  { label: 'Ascending Order', value: 'asc' },
  { label: 'Descending Order', value: 'desc' },
  { label: 'Price: Low To High', value: 'price_low_high' },
  { label: 'Price: High To Low', value: 'price_high_low' },
]

export const orderStatus = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'unverified'];

// ========== NEW CONSTANTS ==========

// Delivery status options
export const deliveryStatus = [
  'pending', 
  'processing', 
  'packed', 
  'shipped', 
  'out_for_delivery', 
  'delivered', 
  'cancelled', 
  'returned'
];

// Payment status options
export const paymentStatus = ['pending', 'paid', 'failed', 'refunded'];

// Product condition options for thrift items
export const productCondition = [
  { label: 'Like New', value: 'like_new' },
  { label: 'Excellent', value: 'excellent' },
  { label: 'Good', value: 'good' },
  { label: 'Fair', value: 'fair' }
];

// Seller approval status
export const sellerApprovalStatus = ['pending', 'approved', 'rejected'];

// User roles
export const userRoles = ['admin', 'user', 'thrift_seller', 'brand_seller'];

// Product types
export const productTypes = [
  { label: 'Thrift Item (Pre-owned)', value: 'thrift' },
  { label: 'Brand New Item', value: 'brand_new' }
];

// Seller types for registration
export const sellerTypes = [
  { label: 'Thrift Seller (Sell pre-owned items)', value: 'thrift_seller' },
  { label: 'Brand Seller (Sell new items with variants)', value: 'brand_seller' }
];

// ========== UTILITY FUNCTIONS ==========

// Format currency (INR)
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format date
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Format datetime
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get status badge color for order status
export const getOrderStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    unverified: 'bg-orange-100 text-orange-800 border-orange-200'
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// Get status badge color for delivery status
export const getDeliveryStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    packed: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    returned: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Get seller approval status color
export const getSellerApprovalColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Get product condition color
export const getConditionColor = (condition) => {
  const colors = {
    like_new: 'bg-green-100 text-green-800',
    excellent: 'bg-blue-100 text-blue-800',
    good: 'bg-yellow-100 text-yellow-800',
    fair: 'bg-orange-100 text-orange-800'
  };
  return colors[condition] || 'bg-gray-100 text-gray-800';
};

// Generate unique code for products
export const generateUniqueCode = (type) => {
  const prefix = type === 'thrift' ? 'TH' : 'BN';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}${timestamp}${random}`;
};

// Validate phone number (Indian)
export const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Calculate discount percentage
export const calculateDiscount = (mrp, sellingPrice) => {
  if (!mrp || !sellingPrice || mrp <= sellingPrice) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
};

// Truncate text
export const truncateText = (text, length = 100) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Debounce function for search
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Get role display name
export const getRoleDisplayName = (role) => {
  const names = {
    admin: 'Administrator',
    user: 'Customer',
    thrift_seller: 'Thrift Seller',
    brand_seller: 'Brand Seller'
  };
  return names[role] || role;
};

// Get product type display name
export const getProductTypeDisplay = (type) => {
  const names = {
    thrift: 'Thrift Item',
    brand_new: 'Brand New'
  };
  return names[type] || type;
};

// Get condition display name
export const getConditionDisplay = (condition) => {
  const names = {
    like_new: 'Like New',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair'
  };
  return names[condition] || condition;
};

// Format order ID for display
export const formatOrderId = (orderId) => {
  if (!orderId) return '';
  return orderId.replace('ORD', '#');
};

// Calculate estimated delivery date
export const getEstimatedDelivery = (days = 5) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

// Check if product is in stock
export const isInStock = (product) => {
  if (product.productType === 'thrift') {
    return product.quantity > 0 && product.status === 'active';
  }
  return product.quantity > 0;
};

// Get stock status
export const getStockStatus = (quantity) => {
  if (quantity === 0) return { label: 'Out of Stock', color: 'text-red-600' };
  if (quantity <= 5) return { label: `Only ${quantity} left`, color: 'text-orange-600' };
  if (quantity <= 10) return { label: 'Low Stock', color: 'text-yellow-600' };
  return { label: 'In Stock', color: 'text-green-600' };
};

// Calculate seller earnings (after commission)
export const calculateSellerEarnings = (amount, commissionRate = 10) => {
  const commission = (amount * commissionRate) / 100;
  return {
    total: amount,
    commission: commission,
    earnings: amount - commission,
    commissionRate
  };
};

// Generate breadcrumbs from path
export const generateBreadcrumbs = (pathname) => {
  const paths = pathname.split('/').filter(Boolean);
  return paths.map((path, index) => ({
    label: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
    href: '/' + paths.slice(0, index + 1).join('/'),
    isLast: index === paths.length - 1
  }));
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return { success: true, message: 'Copied to clipboard!' };
  } catch (error) {
    return { success: false, message: 'Failed to copy.' };
  }
};

// Download file
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Parse error message from API response
export const parseErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};