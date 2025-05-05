'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { RiSunLine, RiMoonClearLine } from 'react-icons/ri';
import { FiLogOut } from 'react-icons/fi';
import { usePathname, useRouter } from 'next/navigation';
import { smartLogoutWithRouter, getNgoAuthToken, getAuthToken } from '@/utils/auth';
import { useEffect, useState } from 'react';

export function Navbar() {
    const { theme, setTheme } = useTheme();
    const pathname = usePathname();
    const router = useRouter();
    const [userType, setUserType] = useState<'admin' | 'ngo' | null>(null);
    const [mounted, setMounted] = useState(false);

    // This useEffect will only run on the client side
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Determine user type based on path and available tokens
        const determineUserType = () => {
            if (typeof window === 'undefined') return;

            const hasAdminToken = !!getAuthToken();
            const hasNgoToken = !!getNgoAuthToken();

            // If on admin routes, prioritize admin user type
            if (pathname?.startsWith('/admin')) {
                setUserType('admin');
            }
            // Otherwise prioritize NGO user type if token exists
            else if (hasNgoToken) {
                setUserType('ngo');
            }
            // Fallback to admin if only admin token exists
            else if (hasAdminToken) {
                setUserType('admin');
            }
            // No tokens, no user type
            else {
                setUserType(null);
            }
        };

        determineUserType();
    }, [pathname]);

    const handleLogout = () => {
        smartLogoutWithRouter(router);
    };

    // Conditionally render content based on mounted state
    // This ensures the icons don't cause hydration mismatches
    const renderThemeToggle = () => {
        if (!mounted) return null;

        return (
            <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="relative w-8 h-8 rounded-full flex items-center justify-center group"
                aria-label="Toggle theme"
            >
                <div className="absolute inset-0 rounded-full bg-primary-50/80 dark:bg-theme-heart/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                <div className="relative">
                    {theme === 'dark' ? (
                        <RiSunLine className="w-5 h-5 text-theme-heart transform transition-transform duration-150 ease-out group-hover:scale-110" />
                    ) : (
                        <RiMoonClearLine className="w-5 h-5 text-primary-600 transform transition-transform duration-150 ease-out group-hover:scale-110" />
                    )}
                </div>
            </button>
        );
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-lg dark:border-border-dark/50 dark:bg-[#1a2030]">
            <div className="w-full">
                <div className="flex h-16 items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <Link href="/" prefetch={true} className="brand-link group">
                            <div className="flex flex-col leading-none font-montserrat">
                                <div className="flex flex-col bg-gradient-to-br from-theme-nature via-primary-500 to-theme-heart bg-clip-text text-transparent dark:from-theme-paw dark:via-theme-sky dark:to-theme-heart">
                                    <span className="text-3xl font-black tracking-wide">PASHU</span>
                                    <span className="text-2xl font-extrabold tracking-tight -mt-1">
                                        RAKSHAK
                                    </span>
                                </div>
                            </div>
                        </Link>
                        {userType && (
                            <>
                                <div className="h-8 w-[1px] bg-border/50 dark:bg-border-dark/50 mx-2" />
                                <span className="text-sm font-medium text-muted-foreground dark:text-foreground-dark/60">
                                    {userType === 'admin' ? 'Admin' : 'NGO'}
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {renderThemeToggle()}

                        {userType && (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors duration-200 dark:bg-theme-heart/10 dark:text-theme-heart dark:hover:bg-theme-heart/20"
                            >
                                <FiLogOut className="w-5 h-5" />
                                <span>Logout</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
