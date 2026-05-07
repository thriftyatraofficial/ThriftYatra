const ADMIN_PHONE = process.env.ADMIN_WHATSAPP_NUMBER || '918499980521';

export function getWhatsAppLink(phone, message) {
    const formattedPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/91${formattedPhone}?text=${encodeURIComponent(message)}`;
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