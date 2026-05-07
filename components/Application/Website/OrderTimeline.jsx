'use client'
import React from 'react'
import { CheckCircle, Clock, Truck, Package, XCircle } from 'lucide-react'

const OrderTimeline = ({ order }) => {
    const steps = [
        { key: 'pending', label: 'Order Placed', icon: Clock, description: 'Your order has been placed' },
        { key: 'processing', label: 'Processing', icon: Package, description: 'Seller is preparing your order' },
        { key: 'shipped', label: 'Shipped', icon: Truck, description: 'Your order is on the way' },
        { key: 'delivered', label: 'Delivered', icon: CheckCircle, description: 'Order delivered successfully' }
    ]

    if (order?.status === 'cancelled') {
        steps.push({ key: 'cancelled', label: 'Cancelled', icon: XCircle, description: order.cancellationReason || 'Order was cancelled' })
    }

    const currentStepIndex = steps.findIndex(s => s.key === order?.status)
    const isCancelled = order?.status === 'cancelled'

    return (
        <div className='py-6'>
            <div className='flex flex-col md:flex-row justify-between relative'>
                {/* Connecting line */}
                <div className='absolute top-5 left-0 right-0 h-0.5 bg-gray-200 hidden md:block' />
                
                {steps.map((step, index) => {
                    const isCompleted = !isCancelled && index <= currentStepIndex
                    const isCurrent = index === currentStepIndex
                    const isFailed = isCancelled && step.key === 'cancelled'

                    return (
                        <div key={step.key} className='flex flex-col items-center relative z-10 mb-4 md:mb-0'>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isFailed ? 'bg-red-500 text-white' :
                                isCompleted ? 'bg-green-500 text-white' :
                                isCurrent ? 'bg-[#E8B931] text-black' :
                                'bg-gray-200 text-gray-500'
                            }`}>
                                <step.icon size={20} />
                            </div>
                            <p className={`text-sm font-medium mt-2 ${isCompleted || isCurrent ? 'text-black' : 'text-gray-400'}`}>
                                {step.label}
                            </p>
                            <p className='text-xs text-gray-400 text-center max-w-[100px]'>
                                {step.description}
                            </p>
                            {isCompleted && !isFailed && (
                                <p className='text-xs text-green-500 mt-1'>
                                    {step.key === 'delivered' && order?.deliveredAt 
                                        ? new Date(order.deliveredAt).toLocaleDateString()
                                        : step.key === 'shipped' && order?.shippedAt
                                            ? new Date(order.shippedAt).toLocaleDateString()
                                            : ''}
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default OrderTimeline