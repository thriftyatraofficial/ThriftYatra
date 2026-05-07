'use client'
import React, { useEffect, useState } from 'react'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import ButtonLoading from './ButtonLoading'
import axios from 'axios'
import { showToast } from '@/lib/showToast'

const OTPVerification = ({ phone, email, onSubmit, loading, isNewUser = false }) => {
    const [otp, setOtp] = useState('')
    const [resendLoading, setResendLoading] = useState(false)
    const [countdown, setCountdown] = useState(30)

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    const handleResendOTP = async () => {
        try {
            setResendLoading(true)
            const payload = phone ? { phone } : { email }
            const { data } = await axios.post('/api/auth/send-otp', payload)
            if (!data.success) throw new Error(data.message)
            showToast('success', 'OTP resent!')
            setCountdown(30)
            setOtp('')
        } catch (error) {
            showToast('error', error.response?.data?.message || error.message)
        } finally {
            setResendLoading(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (otp.length === 6) onSubmit({ otp })
    }

    return (
        <div>
            <div className='text-center mb-5'>
                <h1 className='text-2xl font-bold'>{isNewUser ? 'Verify & Create Account' : 'Verify OTP'}</h1>
                <p className='text-gray-600'>Enter the 6-digit code sent to {phone || email}</p>
            </div>
            <form onSubmit={handleSubmit}>
                <div className='flex justify-center mb-5'>
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                </div>
                <div className='mb-3'>
                    <ButtonLoading 
                        loading={loading} 
                        type="submit" 
                        text={isNewUser ? "Verify & Create Account" : "Verify & Login"} 
                        className="w-full" 
                        disabled={otp.length !== 6} 
                    />
                </div>
                <div className='text-center'>
                    <p className='text-sm text-gray-600'>
                        Didn't receive the code?{' '}
                        {countdown > 0 ? (
                            <span className='text-gray-400'>Resend in {countdown}s</span>
                        ) : (
                            <button 
                                type="button" 
                                onClick={handleResendOTP} 
                                disabled={resendLoading} 
                                className='text-primary hover:underline font-medium'
                            >
                                {resendLoading ? 'Sending...' : 'Resend OTP'}
                            </button>
                        )}
                    </p>
                </div>
            </form>
        </div>
    )
}

export default OTPVerification