'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiHome, FiUsers } from 'react-icons/fi';
import { PiDogFill, PiPawPrintFill } from 'react-icons/pi';
import { useEffect, useCallback } from 'react';

// Define all navigation items including potential future routes
const navigation = [
    { name: 'Dashboard', href: '/dashboard', Icon: FiHome },
    { name: 'Rescue Requests', href: '/requests', Icon: PiPawPrintFill },
    { name: 'Volunteers', href: '/volunteers', Icon: FiUsers },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    // More efficient prefetching using Next.js patterns
    useEffect(() => {
        // Prefetch immediate navigation routes with higher priority
        const prefetchRoutes = async () => {
            // First prefetch current navigation items
            for (const item of navigation) {
                await router.prefetch(item.href);
            }
        };

        prefetchRoutes();
    }, [router]);

    // Handle hover-based prefetching
    const handleHover = useCallback(
        (href: string) => {
            router.prefetch(href);
        },
        [router]
    );

    return (
        <div className="h-full w-64 border-r border-border/50 bg-gradient-to-b from-background via-background to-theme-nature/5 dark:border-border-dark/50 dark:from-[#1a2030] dark:via-[#1a2030] dark:to-[#1a2030] flex flex-col">
            <nav className="flex-1 flex flex-col gap-2 p-6 overflow-y-auto">
                {navigation.map(item => {
                    const isActive = pathname === item.href;
                    const IconComponent = item.Icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            prefetch={true}
                            onMouseEnter={() => handleHover(item.href)}
                            className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                                isActive
                                    ? 'bg-gradient-to-r from-theme-nature/20 to-primary-100 text-primary-700 shadow-sm dark:from-theme-heart/20 dark:to-theme-heart/5 dark:text-theme-heart'
                                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-theme-nature/10 hover:to-transparent hover:text-primary-600 dark:text-gray-400 dark:hover:from-theme-heart/10 dark:hover:to-transparent dark:hover:text-theme-heart'
                            }`}
                        >
                            <IconComponent
                                className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${
                                    isActive
                                        ? 'text-primary-600 dark:text-theme-heart'
                                        : 'text-gray-500 group-hover:text-primary-500 dark:text-gray-400 dark:group-hover:text-theme-heart'
                                }`}
                            />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
