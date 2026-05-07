'use client'
import { Card, CardContent } from '@/components/ui/card'
import React, { useState } from 'react'
import Logo from '@/public/assets/images/logo-black.png'
import Image from 'next/image'
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import ButtonLoading from '@/components/Application/ButtonLoading'
import Link from 'next/link'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { useDispatch } from 'react-redux'
import { login } from '@/store/reducer/authReducer'
import { useRouter, useSearchParams } from 'next/navigation'

const LoginPage = () => {
    const dispatch = useDispatch()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const formSchema = z.object({
        email: z.string().email('Invalid email'),
        password: z.string().min(6, 'Password must be 6+ characters'),
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", password: "" },
    })

    const handleLogin = async (values) => {
        try {
            setLoading(true)
            const { data } = await axios.post('/api/auth/login', values)
            if (!data.success) throw new Error(data.message)
            
            dispatch(login(data.data))
            showToast('success', 'Login successful!')
            
            const redirectUrl = data.data.redirectUrl
            const callbackUrl = searchParams.get('callback')
            window.location.href = redirectUrl || callbackUrl || '/'
        } catch (error) {
            showToast('error', error.response?.data?.message || error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-[400px]">
            <CardContent>
                <div className='flex justify-center'>
                    <Image src={Logo.src} width={Logo.width} height={Logo.height} alt='logo' className='max-w-[150px]' />
                </div>
                <div className='text-center'>
                    <h1 className='text-3xl font-bold'>Welcome Back</h1>
                    <p>Login with your email and password</p>
                </div>
                <div className='mt-5'>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleLogin)}>
                            <div className='mb-4'>
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl><Input type="email" placeholder="Enter email" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <div className='mb-4'>
                                <FormField control={form.control} name="password" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl><Input type="password" placeholder="Enter password" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <div className='mb-3'>
                                <ButtonLoading loading={loading} type="submit" text="Login" className="w-full cursor-pointer" />
                            </div>
                            <div className='text-center space-y-2'>
                                <Link href="/auth/forgot-password" className='text-primary text-sm hover:underline'>Forgot Password?</Link>
                                <div className='flex justify-center items-center gap-1'>
                                    <p>Don't have an account?</p>
                                    <Link href="/auth/register" className='text-primary underline'>Sign Up</Link>
                                </div>
                                <div>
                                    <Link href="/auth/register-seller" className='text-primary underline text-sm'>Want to sell? Register as Seller</Link>
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>
            </CardContent>
        </Card>
    )
}

export default LoginPage
