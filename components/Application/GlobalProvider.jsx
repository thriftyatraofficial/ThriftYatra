'use client'
import { persistor, store } from '@/store/store'
import React, { Suspense } from 'react'
import { Provider } from 'react-redux'
import Loading from './Loading'
import { PersistGate } from 'redux-persist/integration/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const GlobalProvider = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <Provider store={store}>
                <PersistGate persistor={persistor} loading={<Loading />}>
                    {children}
                </PersistGate>
            </Provider>
        </QueryClientProvider>
    )
}

export default GlobalProvider
