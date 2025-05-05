'use client';

import { FiRefreshCw } from 'react-icons/fi';
import { useEffect, useState } from 'react';

interface RefreshButtonProps {
    onClick: () => void;
    isRefreshing: boolean;
    disabled?: boolean;
    className?: string;
}

export function RefreshButton({ onClick, isRefreshing, disabled = false, className = '' }: RefreshButtonProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check for dark mode on component mount and when theme changes
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };

        // Initial check
        checkDarkMode();

        // Set up observer to detect theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                    mutation.type === 'attributes' &&
                    mutation.attributeName === 'class'
                ) {
                    checkDarkMode();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div
            onClick={disabled || isRefreshing ? undefined : onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md active:scale-95 ${
                disabled || isRefreshing ? 'opacity-50 cursor-default' : ''
            } ${
                isDarkMode 
                ? 'bg-[#1e2538] text-white border-gray-700 hover:bg-[#232a40]' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } ${className}`}
        >
            <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
        </div>
    );
}
