const ADMIN_PHONE = process.env.ADMIN_WHATSAPP_NUMBER || '918499980521';

export function getWhatsAppLink(phone, message) {
    const cleaned = String(phone || '').replace(/[^0-9]/g, '');
    
    // Remove leading 0 if present
    let formattedPhone = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
    
    // If already has 91, use as-is. Otherwise add 91 for 10-digit numbers
    if (formattedPhone.startsWith('91') && formattedPhone.length === 12) {
        // Already perfect: 91 + 10 digits
    } else if (formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone;
    } else if (formattedPhone.startsWith('91') && formattedPhone.length > 12) {
        // Has multiple 91 prefixes - keep removing until correct
        while (formattedPhone.startsWith('91') && formattedPhone.length > 12) {
            formattedPhone = formattedPhone.slice(2);
        }
    }
    
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

export function getAdminWhatsAppLink(message) {
    return getWhatsAppLink(ADMIN_PHONE, message);
}

export const WA_TEMPLATES = {
    notifySeller: (orderId, productName, size, color, amount) =>
        `📦 *New Order #${orderId}!*\n\nProduct: ${productName}${size && color ? ` (${size}/${color})` : ''}\nAmount: ₹${amount}\n\nAccept in seller panel.\n\n- ThriftYatra`,
    sellerAcceptedCustomer: (orderId) =>
        `✅ *Good News!*\n\nSeller accepted #${orderId}! Shipping soon.\n\n- ThriftYatra`,
    sellerAcceptedAdmin: (orderId) =>
        `✅ *Accepted!*\n\nOrder #${orderId} ready for pickup.\n\n- ThriftYatra`,
    trackingCustomer: (orderId, courier, tracking) =>
        `🚚 *Shipped!*\n\n#${orderId}\n${courier}: ${tracking}\n\n- ThriftYatra`,
    trackingSeller: (orderId, courier, tracking) =>
        `🚚 *#${orderId}*\n${courier}: ${tracking}\n\n- ThriftYatra`,
    shareLocation: (orderId) =>
        `📍 *Order #${orderId} - Sharing my live location.*`,
};