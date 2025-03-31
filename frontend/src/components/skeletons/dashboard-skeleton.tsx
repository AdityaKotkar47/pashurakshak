import { Skeleton } from '@/components/ui/skeleton';
import { FiActivity, FiHeart, FiUsers } from 'react-icons/fi';
import { PiDogFill, PiPawPrintFill } from 'react-icons/pi';

export function DashboardStatsSkeleton() {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
            {/* Request Stats Card */}
            <div className="group relative transform transition-transform duration-150">
                <div className="absolute inset-0 bg-gradient-to-r from-theme-nature to-primary-300 rounded-2xl blur opacity-20 dark:from-theme-heart dark:to-theme-heart/50" />
                <div className="card relative bg-white dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-primary-50 text-primary-600 dark:bg-theme-heart/10 dark:text-theme-heart">
                            <PiPawPrintFill className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-muted-foreground dark:text-foreground-dark/60">
                                Total Requests
                            </h2>
                            <Skeleton className="mt-1 h-8 w-12" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Volunteers Stats Card */}
            <div className="group relative transform transition-transform duration-150">
                <div className="absolute inset-0 bg-gradient-to-r from-theme-paw to-theme-nature rounded-2xl blur opacity-20 dark:from-theme-paw dark:to-theme-heart/50" />
                <div className="card relative bg-white dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-secondary-50 text-secondary-600 dark:bg-theme-paw/10 dark:text-theme-paw">
                            <FiUsers className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-muted-foreground dark:text-foreground-dark/60">
                                Active Volunteers
                            </h2>
                            <Skeleton className="mt-1 h-8 w-12" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Animals Stats Card */}
            <div className="group relative transform transition-transform duration-150">
                <div className="absolute inset-0 bg-gradient-to-r from-theme-heart to-theme-paw rounded-2xl blur opacity-20 dark:from-theme-nature dark:to-theme-paw/50" />
                <div className="card relative bg-white dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-accent-50 text-accent-600 dark:bg-theme-nature/10 dark:text-theme-nature">
                            <PiDogFill className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-muted-foreground dark:text-foreground-dark/60">
                                Animals Listed
                            </h2>
                            <Skeleton className="mt-1 h-8 w-12" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Completed Stats Card */}
            <div className="group relative transform transition-transform duration-150">
                <div className="absolute inset-0 bg-gradient-to-r from-theme-heart to-theme-nature rounded-2xl blur opacity-20 dark:from-theme-heart dark:to-theme-paw/50" />
                <div className="card relative bg-white dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-red-50 text-theme-heart dark:bg-theme-heart/10 dark:text-theme-heart">
                            <FiHeart className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-muted-foreground dark:text-foreground-dark/60">
                                Completed Rescues
                            </h2>
                            <Skeleton className="mt-1 h-8 w-12" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function DashboardActivitySkeleton() {
    return (
        <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-theme-nature via-theme-paw to-theme-heart rounded-2xl blur opacity-20 dark:from-theme-heart dark:via-theme-paw dark:to-theme-nature" />
            <div className="card relative bg-white/80 backdrop-blur-sm dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90">
                <div className="flex items-center gap-3 mb-6">
                    <FiActivity className="w-5 h-5 text-primary-600 dark:text-theme-heart" />
                    <h2 className="text-lg font-medium text-foreground dark:text-foreground-dark">
                        Recent Activity
                    </h2>
                </div>
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <Skeleton variant="circle" className="w-8 h-8" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            {/* Header - Fully visible */}
            <div className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-theme-nature via-theme-paw to-theme-heart bg-clip-text text-transparent">
                            Rescue Center
                        </h1>
                    </div>
                    <div className="hidden sm:block absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-theme-nature/20 to-transparent rounded-full blur-3xl dark:from-theme-heart/10" />
                </div>
            </div>

            {/* Stats Grid Skeleton */}
            <DashboardStatsSkeleton />

            {/* Activity Section Skeleton */}
            <DashboardActivitySkeleton />
        </div>
    );
}
