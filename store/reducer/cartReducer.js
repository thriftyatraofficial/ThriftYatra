import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    count: 0,
    products: [],
    subtotal: 0,
    totalDiscount: 0,
    totalMrp: 0
}

export const cartReducer = createSlice({
    name: 'cartStore',
    initialState,
    reducers: {
        addIntoCart: (state, action) => {
            const payload = action.payload;
            
            if (!payload || !payload.productId) {
                console.warn('Invalid product added to cart');
                return state;
            }
            
            const isThrift = payload.productType === 'thrift';
            
            // Thrift items are ALWAYS quantity 1
            if (isThrift) {
                payload.qty = 1;
                payload.maxQuantity = 1;
            }
            
            // Check if product already exists in cart
            const existingProductIndex = state.products.findIndex(
                (product) => {
                    if (!product) return false;
                    if (product.productType === 'thrift') {
                        return product.productId === payload.productId;
                    }
                    return product.productId === payload.productId && 
                           product.variantId === payload.variantId;
                }
            );
            
            if (existingProductIndex >= 0) {
                const existingProduct = state.products[existingProductIndex];
                // Only increase for brand new items, respect max
                if (existingProduct.productType !== 'thrift') {
                    const maxQty = existingProduct.maxQuantity || 10;
                    const newQty = existingProduct.qty + (payload.qty || 1);
                    existingProduct.qty = Math.min(newQty, maxQty);
                }
            } else {
                state.products.push({
                    ...payload,
                    maxQuantity: payload.maxQuantity || payload.qty || 1,
                    addedAt: new Date().toISOString()
                });
            }
            
            state.count = state.products.length;
            state.subtotal = state.products.reduce((sum, p) => sum + ((p?.sellingPrice || 0) * (p?.qty || 1)), 0);
            state.totalMrp = state.products.reduce((sum, p) => sum + ((p?.mrp || 0) * (p?.qty || 1)), 0);
            state.totalDiscount = state.totalMrp - state.subtotal;
        },
        
        increaseQuantity: (state, action) => {
            const { productId, variantId } = action.payload;
            
            const existingProductIndex = state.products.findIndex(
                (product) => {
                    if (!product) return false;
                    return product.productId === productId && 
                           product.variantId === variantId;
                }
            );
            
            if (existingProductIndex >= 0) {
                const product = state.products[existingProductIndex];
                
                // Only for brand new items, respect max quantity
                if (product.productType !== 'thrift') {
                    const maxQty = product.maxQuantity || 10;
                    if (product.qty < maxQty) {
                        product.qty += 1;
                    }
                }
                // Thrift items never increase
                
                state.subtotal = state.products.reduce((sum, p) => sum + ((p?.sellingPrice || 0) * (p?.qty || 1)), 0);
                state.totalMrp = state.products.reduce((sum, p) => sum + ((p?.mrp || 0) * (p?.qty || 1)), 0);
                state.totalDiscount = state.totalMrp - state.subtotal;
            }
        },
        
        decreaseQuantity: (state, action) => {
            const { productId, variantId } = action.payload;
            
            const existingProductIndex = state.products.findIndex(
                (product) => {
                    if (!product) return false;
                    return product.productId === productId && 
                           product.variantId === variantId;
                }
            );
            
            if (existingProductIndex >= 0) {
                const product = state.products[existingProductIndex];
                
                if (product.productType !== 'thrift' && product.qty > 1) {
                    product.qty -= 1;
                }
                
                state.subtotal = state.products.reduce((sum, p) => sum + ((p?.sellingPrice || 0) * (p?.qty || 1)), 0);
                state.totalMrp = state.products.reduce((sum, p) => sum + ((p?.mrp || 0) * (p?.qty || 1)), 0);
                state.totalDiscount = state.totalMrp - state.subtotal;
            }
        },
        
        removeFromCart: (state, action) => {
            const { productId, variantId } = action.payload;
            
            state.products = state.products.filter((product) => {
                if (!product) return false;
                if (product.productType === 'thrift' || !product.variantId) {
                    return product.productId !== productId;
                }
                return !(product.productId === productId && product.variantId === variantId);
            });
            
            state.count = state.products.length;
            state.subtotal = state.products.reduce((sum, p) => sum + ((p?.sellingPrice || 0) * (p?.qty || 1)), 0);
            state.totalMrp = state.products.reduce((sum, p) => sum + ((p?.mrp || 0) * (p?.qty || 1)), 0);
            state.totalDiscount = state.totalMrp - state.subtotal;
        },
        
        clearCart: (state) => {
            state.products = [];
            state.count = 0;
            state.subtotal = 0;
            state.totalMrp = 0;
            state.totalDiscount = 0;
        },
        
        updateCartTotals: (state) => {
            state.subtotal = state.products.reduce((sum, p) => sum + ((p?.sellingPrice || 0) * (p?.qty || 1)), 0);
            state.totalMrp = state.products.reduce((sum, p) => sum + ((p?.mrp || 0) * (p?.qty || 1)), 0);
            state.totalDiscount = state.totalMrp - state.subtotal;
            state.count = state.products.length;
        },
    }
});

export const {
    addIntoCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    updateCartTotals,
} = cartReducer.actions;

export default cartReducer.reducer;