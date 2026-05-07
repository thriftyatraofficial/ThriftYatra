import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

export const getImageUrl = (image) => {
    if (!image) return imgPlaceholder.src;
    
    if (typeof image === 'string') {
        if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) {
            return image;
        }
        if (image.startsWith('/')) return image;
        if (image.includes('.')) return `/uploads/${image}`;
        return imgPlaceholder.src;
    }
    
    if (image?.secure_url) return getImageUrl(image.secure_url);
    if (image?.public_id) return getImageUrl(image.public_id);
    
    return imgPlaceholder.src;
};

export const getImageArray = (product, variant = null) => {
    const images = [];
    
    const addImage = (img) => {
        if (!img) return;
        let imageUrl = null;
        if (typeof img === 'string') imageUrl = img;
        else if (img?.secure_url) imageUrl = img.secure_url;
        else if (img?.public_id) imageUrl = img.public_id;
        if (imageUrl) images.push({ secure_url: imageUrl });
    };
    
    if (variant?.media) variant.media.forEach(addImage);
    if (variant?.base64Media) variant.base64Media.forEach(addImage);
    if (product?.media) product.media.forEach(addImage);
    if (product?.base64Media) product.base64Media.forEach(addImage);
    if (product?.displayMedia) product.displayMedia.forEach(addImage);
    
    return images;
};