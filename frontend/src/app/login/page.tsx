'use client';

import { FiLock, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { setNgoAuthToken } from '@/utils/auth';

// Define interface for error response
interface ErrorResponse {
    message?: string;
    error?: string;
}

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Prefetch all potential NGO routes on component mount
    useEffect(() => {
        // Prefetch dashboard and other key NGO routes
        router.prefetch('/dashboard');
        router.prefetch('/requests');
        router.prefetch('/volunteers');
        router.prefetch('/animals');

        // Clear any pending redirects from previous sessions
        localStorage.removeItem('pendingRedirect');

        return () => {
            // If we're unmounting without a redirect happening, clear the flag
            // This prevents unintended redirects if user navigates away
            if (localStorage.getItem('pendingRedirect') === 'dashboard') {
                localStorage.removeItem('pendingRedirect');
            }
        };
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;

            const response = await axios.post(
                `${apiUrl}/api/ngo/login`,
                {
                    email,
                    password,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data.success) {
                // The actual response structure from the backend is:
                // { success: true, token: "...", data: { id, name, email, status, state, district } }
                const { token, data: ngoData } = response.data;

                // Check if ngo data exists
                if (!ngoData) {
                    toast.error('Invalid response from server');
                    return;
                }

                // Store token and NGO data in localStorage
                localStorage.setItem('ngoToken', token);
                localStorage.setItem('ngoUser', JSON.stringify(ngoData));

                // Set token in cookie using auth utility
                setNgoAuthToken(token);

                if (ngoData.status === 'approved') {
                    // Set a success flag in localStorage to handle redirect after page reload
                    localStorage.setItem('pendingRedirect', 'dashboard');

                    // Show success toast
                    toast.success('Login successful! Redirecting to dashboard...');

                    // First update router cache for faster navigation after redirect
                    await router.prefetch('/dashboard');

                    // Try Next.js navigation first
                    router.push('/dashboard');

                    // Fallback: Use a more forceful approach with a short delay
                    setTimeout(() => {
                        const pendingRedirect = localStorage.getItem('pendingRedirect');
                        if (pendingRedirect === 'dashboard') {
                            // Force hard navigation if Next.js navigation doesn't complete
                            window.location.href = '/dashboard';
                        }
                    }, 1000);
                } else {
                    // Display appropriate message for non-approved NGOs
                    if (ngoData.status === 'pending') {
                        toast.error(
                            'Your NGO registration is pending approval. Please wait for an email confirmation.',
                            {
                                duration: 6000,
                                icon: '⏳',
                            }
                        );
                    } else if (ngoData.status === 'rejected') {
                        toast.error(
                            'Your NGO registration has been rejected. Please contact support for more information.',
                            {
                                duration: 6000,
                                icon: '❌',
                            }
                        );
                    } else {
                        toast.error('Your NGO account is not active. Please contact support.', {
                            duration: 6000,
                        });
                    }

                    // Clear auth tokens to prevent login on non-approved accounts
                    localStorage.removeItem('ngoToken');
                    localStorage.removeItem('ngoUser');
                }
            } else {
                toast.error(response.data.message || 'Login failed');
            }
        } catch (error: unknown) {
            console.error('Login error:', error);

            // Detailed error logging
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError<ErrorResponse>;
                console.error('Response status:', axiosError.response?.status);
                console.error('Response data:', axiosError.response?.data);
            }

            // Clear any previous success messages
            toast.dismiss();

            const axiosError = error as AxiosError<ErrorResponse>;
            if (axiosError.response?.data?.message) {
                if (axiosError.response.data.message.includes('not approved')) {
                    toast.error('Your NGO registration is pending approval');
                } else if (axiosError.response.data.message.includes('rejected')) {
                    toast.error('Your NGO registration has been rejected');
                } else {
                    toast.error(axiosError.response.data.message);
                }
            } else {
                toast.error('Invalid credentials');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] -my-6 flex items-center justify-center">
            <div className="w-full max-w-md relative">
                {/* Background Effects */}
                <div className="absolute -top-12 -right-8 w-32 h-32 bg-gradient-to-br from-theme-nature/20 to-transparent rounded-full blur-3xl dark:from-theme-heart/10" />
                <div className="absolute -bottom-12 -left-8 w-32 h-32 bg-gradient-to-br from-theme-paw/20 to-transparent rounded-full blur-3xl dark:from-theme-paw/10" />

                {/* Login Card */}
                <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-theme-nature via-theme-paw to-theme-heart rounded-2xl blur opacity-20 dark:from-theme-heart dark:via-theme-paw dark:to-theme-nature" />
                    <div className="card relative bg-white/80 backdrop-blur-sm dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90 p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-theme-nature via-theme-paw to-theme-heart bg-clip-text text-transparent">
                                NGO Login
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground dark:text-foreground-dark/60">
                                Sign in to continue to Pashurakshak
                            </p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-foreground dark:text-foreground-dark"
                                >
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiMail className="h-5 w-5 text-muted-foreground dark:text-foreground-dark/60" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="block w-full pl-10 rounded-lg border-0 bg-white/50 dark:bg-card-dark/50 py-2 text-foreground dark:text-foreground-dark shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-muted-foreground/60 dark:placeholder:text-foreground-dark/40 focus:ring-2 focus:ring-inset focus:ring-theme-heart dark:focus:ring-theme-heart/70 transition-all duration-200"
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-foreground dark:text-foreground-dark"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiLock className="h-5 w-5 text-muted-foreground dark:text-foreground-dark/60" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-10 rounded-lg border-0 bg-white/50 dark:bg-card-dark/50 py-2 text-foreground dark:text-foreground-dark shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-muted-foreground/60 dark:placeholder:text-foreground-dark/40 focus:ring-2 focus:ring-inset focus:ring-theme-heart dark:focus:ring-theme-heart/70 transition-all duration-200"
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground dark:text-foreground-dark/60 hover:text-foreground dark:hover:text-foreground-dark transition-colors"
                                    >
                                        {showPassword ? (
                                            <FiEyeOff className="h-5 w-5" />
                                        ) : (
                                            <FiEye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-500 dark:bg-theme-heart dark:hover:bg-theme-heart/90 transition-all duration-200 font-medium ring-1 ring-primary-600/50 dark:ring-theme-heart/50"
                            >
                                {isLoading ? 'Signing in...' : 'Login'}
                            </button>
                        </form>

                        {/* Register Link */}
                        <p className="mt-6 text-center text-sm text-muted-foreground dark:text-foreground-dark/60">
                            First time here?&nbsp;
                            <Link
                                href="/register"
                                prefetch={true}
                                className="font-medium text-primary-600 hover:text-primary-500 dark:text-theme-heart dark:hover:text-theme-heart/80"
                            >
                                Register your NGO
                            </Link>
                        </p>

                        {/* Admin Link */}
                        <p className="mt-2 text-center text-sm text-muted-foreground dark:text-foreground-dark/60">
                            <Link
                                href="/admin/login"
                                prefetch={true}
                                className="font-medium text-primary-600 hover:text-primary-500 dark:text-theme-heart dark:hover:text-theme-heart/80"
                            >
                                Admin Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
