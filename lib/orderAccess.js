const normalize = (value) => String(value || '').replace(/\D/g, '');

export const canAccessOrder = (order, auth, phone = '') => {
    if (!order) return false;
    if (auth?.role === 'admin') return true;

    const userId = auth?.userId || auth?._id;
    if (userId && order.userId?.toString() === userId.toString()) return true;
    if (auth?.email && order.email && auth.email.toLowerCase() === String(order.email).toLowerCase()) return true;
    if (auth?.phone && normalize(auth.phone) && normalize(auth.phone) === normalize(order.phone)) return true;
    if (phone && normalize(phone) && normalize(phone) === normalize(order.phone)) return true;

    return false;
};
