import { combineReducers, configureStore } from "@reduxjs/toolkit"
import { persistReducer, persistStore } from "redux-persist"
import createWebStorage from "redux-persist/lib/storage/createWebStorage"
import authReducer from "./reducer/authReducer"
import cartReducer from "./reducer/cartReducer"

// Fix for SSR - create noop storage
const createNoopStorage = () => {
    return {
        getItem() {
            return Promise.resolve(null)
        },
        setItem(_key, value) {
            return Promise.resolve(value)
        },
        removeItem() {
            return Promise.resolve()
        },
    }
}

const storage = typeof window !== "undefined" 
    ? createWebStorage("local") 
    : createNoopStorage()

const rootReducer = combineReducers({
    authStore: authReducer,
    cartStore: cartReducer
})

const persistConfig = {
    key: 'thriftyatra',  // ✅ Changed to ThriftYatra
    storage
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false })
})

export const persistor = persistStore(store)