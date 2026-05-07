import { connectDB } from '@/lib/databaseConnection'
import ProductModel from '@/models/Product.model'
import '@/models/User.model'
import Image from 'next/image'
import Link from 'next/link'
import ProductBox from '@/components/Application/Website/ProductBox'
import { Store, MapPin, Package, Star } from 'lucide-react'

async function getSellerData(sellerSlug) {
    await connectDB()
    const UserModel = (await import('@/models/User.model')).default
    const ProductVariantModel = (await import('@/models/ProductVariant.model')).default
    
    let seller = await UserModel.findOne({ 'sellerProfile.storeName': { $regex: new RegExp('^' + sellerSlug.replace(/-/g, ' ') + '$', 'i') }, role: { $in: ['thrift_seller', 'brand_seller'] } }).select('-password').lean()
    if (!seller && sellerSlug.match(/^[0-9a-fA-F]{24}$/)) seller = await UserModel.findById(sellerSlug).select('-password').lean()
    if (!seller) return { success: false, error: 'Seller not found' }
    
    const products = await ProductModel.find({ sellerId: seller._id, deletedAt: null, status: 'active' }).populate('category', 'name').populate('sellerId', 'name sellerId sellerProfile').sort({ createdAt: -1 }).lean()
    
    for (const product of products) {
        if (product.productType === 'brand_new' && (!product.media || product.media.length === 0)) {
            const fv = await ProductVariantModel.findOne({ product: product._id, deletedAt: null, status: 'active', quantity: { $gt: 0 } }).select('media').lean()
            if (fv?.media?.length > 0) product.media = fv.media
        }
    }
    return { success: true, data: { seller, products } }
}

const SellerPage = async ({ params }) => {
    const { sellerSlug } = await params
    let seller = null, products = [], error = null
    
    try {
        const data = await getSellerData(sellerSlug)
        if (data.success) { seller = data.data.seller; products = data.data.products || [] }
        else error = data.error || 'Seller not found'
    } catch (err) { error = 'Failed to load seller information' }
    
    if (error || !seller) return (<div className='flex justify-center items-center py-20 h-[400px]'><div className='text-center'><h1 className='text-4xl font-semibold mb-4'>Store Not Found</h1><p className='text-gray-500 mb-6'>The store you're looking for doesn't exist.</p><Link href="/shop" className='bg-[#E8B931] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#d4a520] transition'>Browse Shop</Link></div></div>)
    
    const storeName = seller.sellerProfile?.storeName || seller.name
    return (
        <div className='lg:px-32 px-4 py-10'>
            <div className='bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-10'>
                <div className='flex items-start gap-6'>
                    <div className='flex-shrink-0'>{seller.sellerProfile?.storeLogo ? <Image src={seller.sellerProfile.storeLogo} width={100} height={100} alt={storeName} className='rounded-full object-cover border-4 border-white shadow' /> : <div className='w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center border-4 border-white shadow'><Store className='h-10 w-10 text-gray-400' /></div>}</div>
                    <div className='flex-1'><div className='flex items-center gap-3 mb-2'><h1 className='text-3xl font-bold'>{storeName}</h1>{seller.sellerProfile?.isVerified && <span className='bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full'>✓ Verified Seller</span>}<span className={`text-xs px-3 py-1 rounded-full ${seller.sellerType === 'thrift_seller' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>{seller.sellerType === 'thrift_seller' ? 'Thrift Store' : 'Brand Store'}</span></div>{seller.sellerProfile?.storeDescription && <p className='text-gray-600 mb-3'>{seller.sellerProfile.storeDescription}</p>}<div className='flex items-center gap-6 text-sm text-gray-500'><div className='flex items-center gap-1'><Package className='h-4 w-4' /><span>{seller.sellerProfile?.totalProducts || 0} Products</span></div>{seller.sellerProfile?.rating > 0 && <div className='flex items-center gap-1'><Star className='h-4 w-4 fill-yellow-400 text-yellow-400' /><span>{seller.sellerProfile.rating.toFixed(1)}</span></div>}{seller.pickupAddress?.city && <div className='flex items-center gap-1'><MapPin className='h-4 w-4' /><span>{seller.pickupAddress.city}, {seller.pickupAddress.state}</span></div>}</div></div>
                </div>
            </div>
            <div><h2 className='text-2xl font-bold mb-6'>All Products from {storeName}</h2>{products.length === 0 ? <div className='text-center py-20 text-gray-500'><Package className='h-16 w-16 mx-auto mb-4 text-gray-300' /><p className='text-lg'>No products available yet.</p></div> : <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>{products.map(product => <ProductBox key={product._id} product={product} />)}</div>}</div>
        </div>
    )
}

export default SellerPage