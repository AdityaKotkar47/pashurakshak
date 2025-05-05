'use client';

import { useEffect, useState, useCallback } from 'react';
import { FiActivity, FiHeart, FiUsers, FiRefreshCw } from 'react-icons/fi';
import { PiPawPrintFill } from 'react-icons/pi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import volunteerService from '@/utils/volunteerService';
import rescueRequestService from '@/utils/rescueRequestService';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { getFromCache, saveToCache, clearCacheByPrefix, CACHE_DURATIONS } from '@/utils/cacheUtils';
import { Button } from '@/components/ui/button';

// Define all NGO routes for prefetching
const NGO_ROUTES = ['/', '/dashboard', '/requests', '/volunteers'];

// Dashboard skeleton component
const DashboardSkeleton = () => (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-theme-nature via-theme-paw to-theme-heart bg-clip-text text-transparent">
                Rescue Center
            </h1>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 min-w-0">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="card relative bg-white dark:bg-card-dark">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-primary-50 text-primary-600 dark:bg-theme-heart/10 dark:text-theme-heart">
                            {i === 0 ? <PiPawPrintFill className="w-6 h-6" /> :
                             i === 1 ? <FiUsers className="w-6 h-6" /> :
                             <FiHeart className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-muted-foreground dark:text-foreground-dark/60">
                                {i === 0 ? 'Total Requests' :
                                 i === 1 ? 'Active Volunteers' :
                                 'Completed Rescues'}
                            </h2>
                            <Skeleton className="mt-1 h-8 w-16" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="card relative bg-white dark:bg-card-dark">
            <div className="flex items-center gap-3 mb-6">
                <FiActivity className="w-5 h-5 text-primary-600 dark:text-theme-heart" />
                <h2 className="text-lg font-medium text-foreground dark:text-foreground-dark">
                    Recent Activity
                </h2>
            </div>
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// In future, this will be replaced with real-time data
interface DashboardStats {
    requests: number;
    volunteers: number;
    completed: number;
}

interface RecentActivity {
    id: string;
    type: 'rescue_request' | 'volunteer_action';
    action: string;
    timestamp: string;
    details?: {
    animalType?: string;
    location?: {
        city: string;
        state: string;
    };
    volunteerName?: string;
        notes?: string;
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        requests: 0,
        volunteers: 0,
        completed: 0,
    });
    const [loading, setLoading] = useState({
        requests: true,
        volunteers: true,
        completed: true,
        activity: true
    });
    const [refreshing, setRefreshing] = useState(false);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

    // Optimized prefetching strategy with Next.js features
    useEffect(() => {
        // Clear any pending redirects since we successfully reached the dashboard
        if (typeof window !== 'undefined') {
            localStorage.removeItem('pendingRedirect');
        }

        // Prefetch routes using Next.js priority-based approach
        const prefetchAllRoutes = async () => {
            // First prefetch critical routes
            const criticalRoutes = ['/dashboard', '/requests'];
            for (const route of criticalRoutes) {
                await router.prefetch(route);
            }

            // Then prefetch remaining routes with lower priority
            const remainingRoutes = NGO_ROUTES.filter(route => !criticalRoutes.includes(route));
            remainingRoutes.forEach(route => {
                router.prefetch(route);
            });
        };

        prefetchAllRoutes();
        fetchDashboardStats();
        fetchRecentActivity();
    }, [router]);

    // Fetch recent activity with caching
    const fetchRecentActivity = async () => {
        try {
            // Check cache first
            const cachedActivities = getFromCache<RecentActivity[]>('dashboard_activity', CACHE_DURATIONS.SHORT);
            if (cachedActivities) {
                setRecentActivity(cachedActivities);
                setLoading(prev => ({ ...prev, activity: false }));
                return; // Use cached data and exit early
            }

            // Fetch both rescue requests and volunteers
            const [rescueResponse, volunteersResponse] = await Promise.all([
                rescueRequestService.getRescueRequests(1, 5),
                volunteerService.getVolunteers()
            ]);

            // Process rescue request activities
            const rescueActivities = rescueResponse.requests.map(request => ({
                id: request._id,
                type: 'rescue_request' as const,
                action: request.status,
                timestamp: request.updatedAt,
                details: {
                animalType: request.animalType,
                    location: request.location,
                    notes: request.rescueTimeline[request.rescueTimeline.length - 1]?.notes
                }
            }));

            // Process only recent volunteer actions (last 5 active volunteers)
            const volunteerActivities = volunteersResponse
                .filter(volunteer => volunteer.status === 'active')
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map(volunteer => ({
                    id: volunteer._id,
                    type: 'volunteer_action' as const,
                    action: 'joined',
                    timestamp: volunteer.createdAt,
                    details: {
                    volunteerName: volunteer.name
                    }
                }));

            // Combine and sort all activities by timestamp
            const allActivities = [...rescueActivities, ...volunteerActivities]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 5);

            setRecentActivity(allActivities);

            // Cache the result
            saveToCache('dashboard_activity', allActivities);
        } catch (error) {
            console.error('Error fetching recent activity:', error);
        } finally {
            setLoading(prev => ({ ...prev, activity: false }));
        }
    };

    // Fetch dashboard statistics independently with improved caching
    const fetchDashboardStats = async () => {
        // Use separate functions to fetch each stat independently and in parallel
        const fetchVolunteers = async () => {
            try {
                // Check cache first
                const cachedCount = getFromCache<number>('dashboard_volunteers', CACHE_DURATIONS.MEDIUM);
                if (cachedCount !== null) {
                    setStats(prev => ({ ...prev, volunteers: cachedCount }));
                    setLoading(prev => ({ ...prev, volunteers: false }));
                    return; // Use cached data and exit early
                }

                // Fetch fresh data if no cache or cache is stale
                const volunteers = await volunteerService.getVolunteers();
                const count = volunteers.length;

                // Update state
                setStats(prev => ({ ...prev, volunteers: count }));

                // Cache the result
                saveToCache('dashboard_volunteers', count);
            } catch (error) {
                console.error('Error fetching volunteers:', error);
            } finally {
                setLoading(prev => ({ ...prev, volunteers: false }));
            }
        };

        const fetchTotalRequests = async () => {
            try {
                // Check cache first
                const cachedCount = getFromCache<number>('dashboard_requests', CACHE_DURATIONS.MEDIUM);
                if (cachedCount !== null) {
                    setStats(prev => ({ ...prev, requests: cachedCount }));
                    setLoading(prev => ({ ...prev, requests: false }));
                    return; // Use cached data and exit early
                }

                // Fetch fresh data if no cache or cache is stale
                const allRequests = await rescueRequestService.getRescueRequests(1, 1);
                const count = allRequests.totalRequests;

                // Update state
                setStats(prev => ({ ...prev, requests: count }));

                // Cache the result
                saveToCache('dashboard_requests', count);
            } catch (error) {
                console.error('Error fetching total requests:', error);
            } finally {
                setLoading(prev => ({ ...prev, requests: false }));
            }
        };

        const fetchCompletedRequests = async () => {
            try {
                // Check cache first
                const cachedCount = getFromCache<number>('dashboard_completed', CACHE_DURATIONS.MEDIUM);
                if (cachedCount !== null) {
                    setStats(prev => ({ ...prev, completed: cachedCount }));
                    setLoading(prev => ({ ...prev, completed: false }));
                    return; // Use cached data and exit early
                }

                // Fetch fresh data if no cache or cache is stale
                const completedRequests = await rescueRequestService.getRescueRequests(1, 1, 'completed');
                const count = completedRequests.totalRequests;

                // Update state
                setStats(prev => ({ ...prev, completed: count }));

                // Cache the result
                saveToCache('dashboard_completed', count);
            } catch (error) {
                console.error('Error fetching completed requests:', error);
            } finally {
                setLoading(prev => ({ ...prev, completed: false }));
            }
        };

        // Start all fetches in parallel
        fetchVolunteers();
        fetchTotalRequests();
        fetchCompletedRequests();
    };

    // Handle manual refresh
    const handleRefresh = () => {
        setRefreshing(true);

        // Clear all dashboard caches
        clearCacheByPrefix('dashboard_');

        // Reset loading states
        setLoading({
            requests: true,
            volunteers: true,
            completed: true,
            activity: true
        });

        // Fetch fresh data
        fetchDashboardStats();
        fetchRecentActivity();

        // Reset refreshing state after a short delay to show the animation
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    };

    // Handle hover-based prefetching
    const handleHover = useCallback(
        (href: string) => {
            router.prefetch(href);
        },
        [router]
    );

    // We no longer need this since we'll show each section independently
    // as its data becomes available

    return (
        <ProtectedRoute type="ngo">
            <div className="space-y-8">
                {/* Header Section */}
                <div className="relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-theme-nature via-theme-paw to-theme-heart bg-clip-text text-transparent">
                                Rescue Center
                            </h1>
                        </div>
                        <Button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </Button>
                        <div className="hidden sm:block absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-theme-nature/20 to-transparent rounded-full blur-3xl dark:from-theme-heart/10" />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 min-w-0">
                    <Link
                        href="/requests"
                        prefetch={true}
                        onMouseEnter={() => handleHover('/requests')}
                        className="group relative transform transition-transform duration-150 hover:-translate-y-1 hover:cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-theme-nature to-primary-300 rounded-2xl blur opacity-20 group-hover:opacity-100 transition-opacity duration-150 dark:from-theme-heart dark:to-theme-heart/50" />
                        <div className="card relative bg-white dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-primary-50 text-primary-600 dark:bg-theme-heart/10 dark:text-theme-heart">
                                    <PiPawPrintFill className="w-6 h-6 transform transition-transform duration-150 group-hover:scale-110" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-medium text-muted-foreground dark:text-foreground-dark/60">
                                        Total Requests
                                    </h2>
                                    {loading.requests ? (
                                        <Skeleton className="mt-1 h-8 w-16" />
                                    ) : (
                                    <p className="mt-1 text-3xl font-bold text-primary-600 dark:text-theme-heart">
                                        {stats.requests}
                                    </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/volunteers"
                        prefetch={true}
                        onMouseEnter={() => handleHover('/volunteers')}
                        className="group relative transform transition-transform duration-150 hover:-translate-y-1 hover:cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-theme-paw to-theme-nature rounded-2xl blur opacity-20 group-hover:opacity-100 transition-opacity duration-150 dark:from-theme-paw dark:to-theme-heart/50" />
                        <div className="card relative bg-white dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-secondary-50 text-secondary-600 dark:bg-theme-paw/10 dark:text-theme-paw">
                                    <FiUsers className="w-6 h-6 transform transition-transform duration-150 group-hover:scale-110" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-medium text-muted-foreground dark:text-foreground-dark/60">
                                        Active Volunteers
                                    </h2>
                                    {loading.volunteers ? (
                                        <Skeleton className="mt-1 h-8 w-16" />
                                    ) : (
                                    <p className="mt-1 text-3xl font-bold text-secondary-600 dark:text-theme-paw">
                                        {stats.volunteers}
                                    </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/requests"
                        prefetch={true}
                        onMouseEnter={() => handleHover('/requests')}
                        className="group relative transform transition-transform duration-150 hover:-translate-y-1 hover:cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-theme-heart to-theme-nature rounded-2xl blur opacity-20 group-hover:opacity-100 transition-opacity duration-150 dark:from-theme-heart dark:to-theme-paw/50" />
                        <div className="card relative bg-white dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-red-50 text-theme-heart dark:bg-theme-heart/10 dark:text-theme-heart">
                                    <FiHeart className="w-6 h-6 transform transition-transform duration-150 group-hover:scale-110" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-medium text-muted-foreground dark:text-foreground-dark/60">
                                        Completed Rescues
                                    </h2>
                                    {loading.completed ? (
                                        <Skeleton className="mt-1 h-8 w-16" />
                                    ) : (
                                    <p className="mt-1 text-3xl font-bold text-theme-heart dark:text-theme-heart">
                                        {stats.completed}
                                    </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Recent Activity Section */}
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
                            {loading.activity ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                ))
                            ) : recentActivity.length === 0 ? (
                                <p className="text-sm text-muted-foreground dark:text-foreground-dark/60">
                                    No recent activity
                                </p>
                            ) : (
                                recentActivity.map((activity) => {
                                    // Determine the target URL based on activity type
                                    const targetUrl = activity.type === 'rescue_request'
                                        ? `/requests?id=${activity.id}`
                                        : `/volunteers`;

                                    return (
                                        <div
                                            key={activity.id}
                                            className="flex items-start gap-3 p-3 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors"
                                            onClick={() => router.push(targetUrl)}
                                        >
                                            <div className="p-2 rounded-full bg-primary-50 text-primary-600 dark:bg-theme-heart/10 dark:text-theme-heart">
                                                {activity.type === 'rescue_request' ? (
                                                    <PiPawPrintFill className="w-4 h-4" />
                                                ) : (
                                                    <FiUsers className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground dark:text-foreground-dark">
                                                    {activity.type === 'rescue_request' ? (
                                                        `${activity.details?.animalType} rescue ${activity.action.replace(/_/g, ' ')}`
                                                    ) : (
                                                        `New volunteer ${activity.details?.volunteerName} joined`
                                                    )}
                                                </p>
                                                {activity.type === 'rescue_request' && activity.details?.location && (
                                                    <p className="text-sm text-muted-foreground dark:text-foreground-dark/60">
                                                        {activity.details.location.city}, {activity.details.location.state}
                                                    </p>
                                                )}
                                                {activity.details?.notes && (
                                                    <p className="text-sm text-muted-foreground dark:text-foreground-dark/60 mt-1">
                                                        {activity.details.notes}
                                                    </p>
                                                )}
                                                <p className="text-xs text-muted-foreground dark:text-foreground-dark/40 mt-1">
                                                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
