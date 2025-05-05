import type { Config } from 'tailwindcss';
import { heroui } from '@heroui/react';

export default {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
    	extend: {
    		colors: {
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				'50': '#FFF5EB',
    				'100': '#FFE8D3',
    				'200': '#FFD4A8',
    				'300': '#FFC17D',
    				'400': '#FFAD52',
    				'500': '#FF9843',
    				'600': '#FF7B14',
    				'700': '#E66400',
    				'800': '#B84F00',
    				'900': '#8A3B00',
    				DEFAULT: 'hsl(var(--primary))',
    				dark: '#FFB067',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				'50': '#F0FBF7',
    				'100': '#E1F7EE',
    				'200': '#C3F0E0',
    				'300': '#A8E6CF',
    				'400': '#8AD5B9',
    				'500': '#6CC4A3',
    				'600': '#4EA98A',
    				'700': '#3D856B',
    				'800': '#2C614E',
    				'900': '#1B3D31',
    				DEFAULT: 'hsl(var(--secondary))',
    				dark: '#7EEDC5',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			accent: {
    				'50': '#FFF0F0',
    				'100': '#FFE1E1',
    				'200': '#FFC3C3',
    				'300': '#FFB5B5',
    				'400': '#FF8787',
    				'500': '#FF5959',
    				'600': '#FF2B2B',
    				'700': '#FC0000',
    				'800': '#C40000',
    				'900': '#920000',
    				DEFAULT: 'hsl(var(--accent))',
    				dark: '#FF9898',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				dark: '#1e2538',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))',
    				dark: '#232a40'
    			},
    			border: 'hsl(var(--border))',
    			theme: {
    				paw: '#FFD700',
    				heart: '#FF6B6B',
    				nature: '#66BB6A',
    				sky: '#4FC3F7'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		}
    	}
    },
    darkMode: ['class', 'class'],
    plugins: [heroui(), require("tailwindcss-animate")],
} satisfies Config;
