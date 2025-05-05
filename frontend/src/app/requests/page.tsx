'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import rescueRequestService, { RescueRequest } from '@/utils/rescueRequestService';
import volunteerService, { Volunteer } from '@/utils/volunteerService';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshButton } from '@/components/ui/refresh-button';
import { toast } from '@/hooks/use-toast';
import { FiAlertCircle, FiChevronRight, FiClock, FiMapPin } from 'react-icons/fi';
import { PiPawPrintFill } from 'react-icons/pi';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

// Helper function to get status badge
const getStatusBadge = (status: string) => {
    const statusConfig = {
        pending: { class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Pending' },
        accepted: { class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Accepted' },
        in_progress: { class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', label: 'In Progress' },
        completed: { class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Completed' },
        cancelled: { class: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
        <Badge variant="outline" className={config.class}>
            {config.label}
        </Badge>
    );
};

// Helper function to format date
const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export default function RequestsPage() {
    const [requests, setRequests] = useState<RescueRequest[]>([]);
    const [allRequests, setAllRequests] = useState<RescueRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedRequest, setSelectedRequest] = useState<RescueRequest | null>(null);
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [selectedVolunteer, setSelectedVolunteer] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [emergencyFilter, setEmergencyFilter] = useState('all');
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [processingAction, setProcessingAction] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Fetch all rescue requests
    const fetchAllRequests = async () => {
        if (!isInitialLoad) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            // Fetch all requests without filters
            const response = await rescueRequestService.getRescueRequests(
                1,
                100 // Fetch a large number to get most/all requests
            );
            setAllRequests(response.requests);
            setIsInitialLoad(false);

            // Apply current filters to the fetched data
            applyFilters(response.requests);
        } catch (err) {
            setError('Failed to load rescue requests');
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Apply filters to the already loaded data
    const applyFilters = (requestsToFilter = allRequests) => {
        let filteredRequests = [...requestsToFilter];

        // Apply status filter
        if (statusFilter !== 'all') {
            filteredRequests = filteredRequests.filter(req => req.status === statusFilter);
        }

        // Apply emergency filter
        if (emergencyFilter !== 'all') {
            const isEmergency = emergencyFilter === 'true';
            filteredRequests = filteredRequests.filter(req => req.emergency === isEmergency);
        }

        // Calculate pagination
        const itemsPerPage = 4;
        const totalFilteredItems = filteredRequests.length;
        const calculatedTotalPages = Math.max(1, Math.ceil(totalFilteredItems / itemsPerPage));

        // Adjust current page if it's now out of bounds
        const adjustedCurrentPage = Math.min(currentPage, calculatedTotalPages);
        if (adjustedCurrentPage !== currentPage) {
            setCurrentPage(adjustedCurrentPage);
        }

        // Apply pagination to filtered results
        const startIndex = (adjustedCurrentPage - 1) * itemsPerPage;
        const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

        setRequests(paginatedRequests);
        setTotalPages(calculatedTotalPages);
    };

    // Fetch volunteers for dropdown
    const fetchVolunteers = async () => {
        try {
            const volunteers = await volunteerService.getVolunteers();
            setVolunteers(volunteers.filter(v => v.status === 'active'));
        } catch (err) {
            console.error('Failed to load volunteers:', err);
            toast({
                title: 'Error',
                description: 'Failed to load volunteers',
                variant: 'destructive',
            });
        }
    };

    // Initial data load
    useEffect(() => {
        fetchAllRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Apply filters when filter values or pagination changes
    useEffect(() => {
        if (!isInitialLoad) {
            applyFilters();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, emergencyFilter, currentPage, isInitialLoad]);

    // Handle URL parameters for direct navigation to a specific request
    useEffect(() => {
        const handleUrlParams = async () => {
            // Check if we have an ID in the URL
            const urlParams = new URLSearchParams(window.location.search);
            const requestId = urlParams.get('id');

            if (requestId) {
                try {
                    // Fetch the specific request
                    const request = await rescueRequestService.getRescueRequestById(requestId);
                    if (request) {
                        // Open the details modal with this request
                        setSelectedRequest(request);
                        setDetailsOpen(true);

                        // Clean up the URL parameter after handling it
                        window.history.replaceState({}, '', '/requests');
                    }
                } catch (err) {
                    console.error('Failed to load request from URL parameter:', err);
                }
            }
        };

        handleUrlParams();
    }, []);

    // Handle accept request
    const handleAcceptRequest = async (id: string) => {
        setProcessingAction(true);
        try {
            const updatedRequest = await rescueRequestService.acceptRescueRequest(id);
            toast({
                title: 'Success',
                description: 'Rescue request accepted successfully',
            });

            // Update the request in both local states
            setAllRequests(prevRequests =>
                prevRequests.map(req =>
                    req._id === id ? updatedRequest : req
                )
            );

            // Update the filtered requests
            setRequests(prevRequests =>
                prevRequests.map(req =>
                    req._id === id ? updatedRequest : req
                )
            );

            // Update the selected request if it's open in the modal
            if (selectedRequest && selectedRequest._id === id) {
                setSelectedRequest(updatedRequest);
            }
        } catch (error) {
            console.error('Failed to accept rescue request:', error);
            toast({
                title: 'Error',
                description: 'Failed to accept rescue request',
                variant: 'destructive',
            });
        } finally {
            setProcessingAction(false);
        }
    };

    // Handle assign volunteer
    const handleAssignVolunteer = async () => {
        if (!selectedRequest || !selectedVolunteer) return;

        setProcessingAction(true);
        try {
            const updatedRequest = await rescueRequestService.assignVolunteerToRequest(selectedRequest._id, selectedVolunteer);
            toast({
                title: 'Success',
                description: 'Volunteer assigned successfully',
            });

            // Update the request in both local states
            setAllRequests(prevRequests =>
                prevRequests.map(req =>
                    req._id === selectedRequest._id ? updatedRequest : req
                )
            );

            // Update the filtered requests
            setRequests(prevRequests =>
                prevRequests.map(req =>
                    req._id === selectedRequest._id ? updatedRequest : req
                )
            );

            // Update the selected request
            setSelectedRequest(updatedRequest);

            // Close the assign modal but keep the details modal open
            setAssignModalOpen(false);
        } catch (error) {
            console.error('Failed to assign volunteer:', error);
            toast({
                title: 'Error',
                description: 'Failed to assign volunteer',
                variant: 'destructive',
            });
        } finally {
            setProcessingAction(false);
        }
    };

    // Open request details modal
    const openRequestDetails = (request: RescueRequest) => {
        setSelectedRequest(request);
        setDetailsOpen(true);
    };

    // Open assign volunteer modal
    const openAssignModal = () => {
        fetchVolunteers();
        setAssignModalOpen(true);
    };

    return (
        <ProtectedRoute type="ngo">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="relative overflow-hidden">
                    <div className="flex items-center justify-between relative z-10">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-theme-nature via-theme-paw to-theme-heart bg-clip-text text-transparent">
                                Rescue Requests
                            </h1>
                            <p className="text-sm text-muted-foreground dark:text-foreground-dark/60">
                                Manage and track rescue operations
                            </p>
                        </div>
                        <RefreshButton
                            onClick={fetchAllRequests}
                            isRefreshing={refreshing}
                            disabled={loading}
                        />
                        <div className="hidden sm:block absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-theme-nature/20 to-transparent rounded-full blur-3xl dark:from-theme-heart/10 pointer-events-none" />
                    </div>
                </div>

                {/* Filters Section */}
                <div className="card dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                Status Filter
                            </label>
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="accepted">Accepted</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                Emergency Filter
                            </label>
                            <Select
                                value={emergencyFilter}
                                onValueChange={setEmergencyFilter}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Filter by emergency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="all">All Requests</SelectItem>
                                        <SelectItem value="true">Emergency Only</SelectItem>
                                        <SelectItem value="false">Non-Emergency</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Requests List */}
                {loading || refreshing ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="card dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Skeleton className="h-6 w-20" />
                                            <Skeleton className="h-6 w-24" />
                                        </div>
                                        <div className="flex items-start space-x-4">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-9 w-28 mt-4 sm:mt-0" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="card dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90">
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <FiAlertCircle className="w-12 h-12 text-red-500 mb-4" />
                            <p className="text-lg font-medium text-foreground dark:text-foreground-dark">
                                {error}
                            </p>
                            <div className="mt-4">
                                <RefreshButton
                                    onClick={fetchAllRequests}
                                    isRefreshing={refreshing}
                                />
                            </div>
                        </div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="card dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90">
                        <div className="flex flex-col items-center justify-center py-10">
                            <PiPawPrintFill className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium text-foreground dark:text-foreground-dark">
                                No rescue requests found
                            </p>
                            <p className="text-sm text-muted-foreground dark:text-foreground-dark/60 mt-2">
                                {statusFilter !== 'all' || emergencyFilter !== 'all'
                                    ? 'Try changing your filters'
                                    : 'New requests will appear here'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                            {requests.map((request) => (
                                <div
                                    key={request._id}
                                    onClick={() => openRequestDetails(request)}
                                className="card dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group relative overflow-hidden"
                                >
                                <div className="absolute inset-0 bg-gradient-to-r from-theme-nature/5 to-primary-100/5 dark:from-theme-heart/5 dark:to-theme-paw/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                <div className="relative">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                {getStatusBadge(request.status)}
                                                {request.emergency && (
                                                    <Badge variant="destructive" className="animate-pulse">
                                                        <FiAlertCircle className="w-3 h-3 mr-1" />
                                                        Emergency
                                                    </Badge>
                                                )}
                                                <span className="text-sm font-medium text-muted-foreground dark:text-foreground-dark/70">
                                                    {request.animalType}
                                                </span>
                                            </div>
                                            <div className="flex items-start space-x-4">
                                                <div className="text-sm text-muted-foreground dark:text-foreground-dark/60 flex items-center">
                                                    <FiMapPin className="mr-1 h-4 w-4" />
                                                    {request.location.city}, {request.location.state}
                                                </div>
                                                <div className="text-sm text-muted-foreground dark:text-foreground-dark/60 flex items-center">
                                                    <FiClock className="mr-1 h-4 w-4" />
                                                    {formatDate(request.createdAt)}
                                                </div>
                                            </div>
                                            {request.animalDetails && request.animalDetails.condition && (
                                                <div className="mt-2 text-sm text-muted-foreground dark:text-foreground-dark/60">
                                                    <span className="font-medium">Condition:</span>{' '}
                                                    {request.animalDetails.condition}
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-4 sm:mt-0 text-primary dark:text-theme-heart group-hover:text-primary-600 dark:group-hover:text-theme-heart/80 transition-colors"
                                        >
                                            View Details
                                            <FiChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-6">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer active:scale-95 transform duration-150'}`}
                                    />
                                </PaginationItem>
                                {[...Array(totalPages)].map((_, i) => (
                                    <PaginationItem key={i + 1}>
                                        <PaginationLink
                                            onClick={() => setCurrentPage(i + 1)}
                                            isActive={currentPage === i + 1}
                                            className={`${currentPage === i + 1 ? '' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 active:scale-95 transform duration-150'}`}
                                        >
                                            {i + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer active:scale-95 transform duration-150'}`}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                            </div>
                        )}
                    </div>
                )}

                {/* Request Details Modal */}
                <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                    <DialogContent className="max-w-3xl dark:bg-card-dark dark:border-border-dark">
                        {selectedRequest && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-foreground dark:text-foreground-dark">Rescue Request Details</span>
                                            {getStatusBadge(selectedRequest.status)}
                                        </div>
                                            {selectedRequest.emergency && (
                                            <Badge variant="destructive" className="animate-pulse">
                                                    <FiAlertCircle className="w-3 h-3 mr-1" />
                                                    Emergency
                                                </Badge>
                                            )}
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground dark:text-foreground-dark/60">
                                        Submitted {formatDate(selectedRequest.createdAt)}
                                    </DialogDescription>
                                </DialogHeader>

                                <Tabs defaultValue="details">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="details">Details</TabsTrigger>
                                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="details" className="space-y-4">
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <h3 className="text-sm font-medium">Animal Information</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                        <label className="text-sm text-muted-foreground">Type</label>
                                                        <p className="text-sm font-medium">{selectedRequest.animalType}</p>
                                                    </div>
                                                    {selectedRequest.animalDetails && (
                                                        <>
                                                            {selectedRequest.animalDetails.condition && (
                                                                <div>
                                                                    <label className="text-sm text-muted-foreground">Condition</label>
                                                                    <p className="text-sm font-medium">
                                                                        {selectedRequest.animalDetails.condition}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {selectedRequest.animalDetails.breed && (
                                                                <div>
                                                                    <label className="text-sm text-muted-foreground">Breed</label>
                                                                    <p className="text-sm font-medium">
                                                                        {selectedRequest.animalDetails.breed}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {selectedRequest.animalDetails.specialNeeds && (
                                                                <div className="col-span-2">
                                                                    <label className="text-sm text-muted-foreground">Special Needs</label>
                                                                    <p className="text-sm font-medium">
                                                                        {selectedRequest.animalDetails.specialNeeds}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-sm font-medium">Location Details</h3>
                                                <div className="grid gap-4">
                                            <div>
                                                        <label className="text-sm text-muted-foreground">Address</label>
                                                        <p className="text-sm font-medium">
                                                            {selectedRequest.location.address || 'N/A'}
                                                            {selectedRequest.location.landmark && (
                                                                <span className="text-muted-foreground">
                                                                    {' '}
                                                                    (Near {selectedRequest.location.landmark})
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-sm text-muted-foreground">City</label>
                                                            <p className="text-sm font-medium">{selectedRequest.location.city}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-muted-foreground">State</label>
                                                            <p className="text-sm font-medium">{selectedRequest.location.state}</p>
                                                        </div>
                                                </div>
                                            </div>
                                        </div>

                                            <div className="space-y-2">
                                                <h3 className="text-sm font-medium">Contact Information</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {selectedRequest.contactInfo.name && (
                                        <div>
                                                            <label className="text-sm text-muted-foreground">Name</label>
                                                            <p className="text-sm font-medium">
                                                                {selectedRequest.contactInfo.name}
                                                            </p>
                                                </div>
                                                    )}
                                                    <div>
                                                        <label className="text-sm text-muted-foreground">Phone</label>
                                                        <p className="text-sm font-medium">
                                                            {selectedRequest.contactInfo.phone}
                                                        </p>
                                            </div>
                                        </div>
                                            </div>

                                        {selectedRequest.images && selectedRequest.images.length > 0 && (
                                                        <div className="space-y-2">
                                                            <h3 className="text-sm font-medium">Images</h3>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                    {selectedRequest.images.map((image, index) => (
                                                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                                                            <Image
                                                                src={image.url}
                                                                alt={image.caption || `Image ${index + 1}`}
                                                                fill
                                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                                className="object-cover"
                                                            />
                                                                        {image.caption && (
                                                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                                                                                <p className="text-xs text-white truncate">
                                                                                    {image.caption}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="timeline" className="space-y-4">
                                        {selectedRequest.rescueTimeline && selectedRequest.rescueTimeline.length > 0 ? (
                                            <div className="space-y-4">
                                                {selectedRequest.rescueTimeline.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative pl-6 pb-4 border-l-2 border-primary/20 dark:border-theme-heart/20"
                                                    >
                                                        <div className="absolute left-[-7px] top-0 bg-primary dark:bg-theme-heart rounded-full w-3 h-3" />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium capitalize">
                                                                {item.status.replace(/_/g, ' ')}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatDate(item.timestamp)}
                                                            </span>
                                                            {item.notes && (
                                                                <p className="text-sm mt-1 text-muted-foreground">
                                                                    {item.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-sm text-muted-foreground">
                                                No timeline events available
                                                </p>
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>

                                <DialogFooter className="flex-col sm:flex-row gap-2">
                                    {selectedRequest.status === 'pending' && (
                                        <Button
                                            onClick={() => handleAcceptRequest(selectedRequest._id)}
                                            disabled={processingAction}
                                            className="bg-gradient-to-r from-theme-nature to-primary hover:from-theme-nature/90 hover:to-primary/90 text-white dark:from-theme-heart dark:to-theme-paw dark:hover:from-theme-heart/90 dark:hover:to-theme-paw/90"
                                        >
                                            Accept Request
                                        </Button>
                                    )}
                                    {selectedRequest.status === 'accepted' && (
                                        <Button
                                            onClick={openAssignModal}
                                            disabled={processingAction}
                                            className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                                        >
                                            Assign Volunteer
                                        </Button>
                                    )}
                                    <DialogClose asChild>
                                        <Button variant="outline" className="dark:border-border-dark dark:text-foreground-dark">
                                            Close
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Assign Volunteer Modal */}
                <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
                    <DialogContent className="max-w-md dark:bg-card-dark dark:border-border-dark">
                        <DialogHeader>
                            <DialogTitle className="text-foreground dark:text-foreground-dark">Assign Volunteer</DialogTitle>
                            <DialogDescription className="text-muted-foreground dark:text-foreground-dark/60">
                                Select a volunteer to assign to this rescue request.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            <Select
                                value={selectedVolunteer}
                                onValueChange={setSelectedVolunteer}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a volunteer" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {volunteers.length > 0 ? (
                                            volunteers.map((volunteer) => (
                                                <SelectItem key={volunteer._id} value={volunteer._id}>
                                                    {volunteer.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-volunteers" disabled>
                                                No active volunteers available
                                            </SelectItem>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setAssignModalOpen(false)}
                                disabled={processingAction}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAssignVolunteer}
                                disabled={!selectedVolunteer || processingAction}
                                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                            >
                                Assign
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    );
}
