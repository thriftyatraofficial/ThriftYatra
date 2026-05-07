'use client'
import { Card, CardContent } from '@/components/ui/card'
import React, { useState } from 'react'
import Logo from '@/public/assets/images/logo-black.png'
import Image from 'next/image'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import ButtonLoading from '@/components/Application/ButtonLoading'
import Link from 'next/link'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import OTPVerification from '@/components/Application/OTPVerification'
import { useDispatch } from 'react-redux'
import { login } from '@/store/reducer/authReducer'
import { useRouter } from 'next/navigation'

const ForgotPasswordPage = () => {
    const dispatch = useDispatch()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)
    const [userEmail, setUserEmail] = useState('')

    const formSchema = z.object({ email: z.string().email('Invalid email') })
    const form = useForm({ resolver: zodResolver(formSchema), defaultValues: { email: "" } })

    const handleSendOTP = async (values) => {
        try {
            setLoading(true)
            const { data } = await axios.post('/api/auth/send-otp', values)
            if (data.success) {
                setUserEmail(values.email)
                setStep(2)
                showToast('success', 'OTP sent to your email')
            } else {
                showToast('error', data.message)
            }
        } catch (e) { showToast('error', e.message) } finally { setLoading(false) }
    }

    const handleOTPLogin = async (values) => {
        try {
            setLoading(true)
            const { data } = await axios.post('/api/auth/verify-otp-login', { email: userEmail, otp: values.otp })
            if (data.success) {
                dispatch(login(data.data))
                showToast('success', 'Logged in successfully!')
                window.location.href = data.data.redirectUrl || '/'
            } else {
                showToast('error', data.message || 'Invalid OTP')
            }
        } catch (e) { showToast('error', e.message) } finally { setLoading(false) }
    }

    return (
        <Card className="w-[400px]">
            <CardContent>
                <div className='flex justify-center'>
                    <Image src={Logo.src} width={Logo.width} height={Logo.height} alt='logo' className='max-w-[150px]' />
                </div>
                {step === 1 ? (
                    <>
                        <div className='text-center'>
                            <h1 className='text-3xl font-bold'>Forgot Password</h1>
                            <p>Enter your email to receive OTP</p>
                        </div>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSendOTP)} className='mt-5'>
                                <div className='mb-4'>
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="Enter email" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <ButtonLoading loading={loading} type="submit" text="Send OTP" className="w-full" />
                                <div className='text-center mt-3'>
                                    <Link href="/auth/login" className='text-primary hover:underline text-sm'>Back to Login</Link>
                                </div>
                            </form>
                        </Form>
                    </>
                ) : (
                    <OTPVerification email={userEmail} onSubmit={handleOTPLogin} loading={loading} />
                )}
            </CardContent>
        </Card>
    )
}

export default ForgotPasswordPage
