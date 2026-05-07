'use client'
import { Card, CardContent } from '@/components/ui/card'
import React, { useState } from 'react'
import Logo from '@/public/assets/images/logo-black.png'
import Image from 'next/image'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from 'zod'
import ButtonLoading from '@/components/Application/ButtonLoading'
import Link from 'next/link'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { useRouter, useSearchParams } from 'next/navigation'
import OTPVerification from '@/components/Application/OTPVerification'
import { useDispatch } from 'react-redux'
import { login } from '@/store/reducer/authReducer'

const RegisterPage = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1) // 1=form, 2=OTP
    const [userEmail, setUserEmail] = useState('')
    const [userName, setUserName] = useState('')
    const [userPassword, setUserPassword] = useState('')

    const formSchema = z.object({
        name: z.string().min(2, 'Name required'),
        email: z.string().email('Invalid email'),
        password: z.string().min(6, 'Password must be 6+ characters'),
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", email: "", password: "" },
    })

    const handleRegister = async (values) => {
        try {
            setLoading(true)
            const { data } = await axios.post('/api/auth/send-otp', { email: values.email })
            if (data.success) {
                setUserEmail(values.email)
                setUserName(values.name)
                setUserPassword(values.password)
                setStep(2)
                showToast('success', 'OTP sent to your email!')
            } else {
                showToast('error', data.message || 'Failed to send OTP')
            }
        } catch (error) {
            showToast('error', error.response?.data?.message || error.message)
        } finally { setLoading(false) }
    }

    const handleOTPVerify = async (values) => {
        try {
            setLoading(true)
            const { data } = await axios.post('/api/auth/register', {
                name: userName,
                email: userEmail,
                password: userPassword,
                otp: values.otp
            })
            if (data.success) {
                // ✅ Auto-login after signup
                dispatch(login(data.data))
                showToast('success', 'Account created successfully!')
                
                // ✅ Redirect to callback URL (checkout) or home
                const callbackUrl = searchParams.get('callback')
                window.location.href = callbackUrl || '/'
            } else {
                showToast('error', data.message || 'Registration failed')
            }
        } catch (error) {
            showToast('error', error.response?.data?.message || error.message)
        } finally { setLoading(false) }
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
                            <h1 className='text-3xl font-bold'>Create Account</h1>
                            <p>Sign up with email to start shopping</p>
                        </div>
                        <div className='mt-5'>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleRegister)}>
                                    <div className='mb-4'>
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Enter name" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <div className='mb-4'>
                                        <FormField control={form.control} name="email" render={({ field }) => (
                                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="Enter email" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <div className='mb-4'>
                                        <FormField control={form.control} name="password" render={({ field }) => (
                                            <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Min 6 characters" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <div className='mb-3'>
                                        <ButtonLoading loading={loading} type="submit" text="Send OTP to Email" className="w-full" />
                                    </div>
                                    <div className='text-center'>
                                        <p>Already have an account? <Link href="/auth/login" className='text-primary underline'>Login</Link></p>
                                    </div>
                                </form>
                            </Form>
                        </div>
                    </>
                ) : (
                    <OTPVerification email={userEmail} onSubmit={handleOTPVerify} loading={loading} isNewUser={true} />
                )}
            </CardContent>
        </Card>
    )
}

export default RegisterPage
