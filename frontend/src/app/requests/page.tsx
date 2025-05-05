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
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { FiAlertCircle, FiCalendar, FiChevronRight, FiClock, FiMapPin, FiUser } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

export default function RequestsPage() {
    const [requests, setRequests] = useState<RescueRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedRequest, setSelectedRequest] = useState<RescueRequest | null>(null);
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [selectedVolunteer, setSelectedVolunteer] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [emergencyFilter, setEmergencyFilter] = useState('');
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [processingAction, setProcessingAction] = useState(false);

    // Fetch rescue requests
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const emergency = emergencyFilter ? emergencyFilter === 'true' : undefined;
            const response = await rescueRequestService.getRescueRequests(
                currentPage,
                10,
                statusFilter || undefined,
                emergency
            );
            setRequests(response.requests);
            setTotalPages(response.totalPages);
            setLoading(false);
        } catch (err) {
            setError('Failed to load rescue requests');
            setLoading(false);
            console.error(err);
        }
    };

    // Fetch volunteers for dropdown
    const fetchVolunteers = async () => {
        try {
            const volunteers = await volunteerService.getVolunteers();
            setVolunteers(volunteers.filter(v => v.status === 'active'));
        } catch (err) {
            console.error('Failed to load volunteers:', err);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [currentPage, statusFilter, emergencyFilter]);

    // Handle accept request
    const handleAcceptRequest = async (id: string) => {
        setProcessingAction(true);
        try {
            await rescueRequestService.acceptRescueRequest(id);
            toast({
                title: 'Success',
                description: 'Rescue request accepted successfully',
            });
            fetchRequests(); // Refresh requests
            setDetailsOpen(false);
        } catch (err) {
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
            await rescueRequestService.assignVolunteerToRequest(selectedRequest._id, selectedVolunteer);
            toast({
                title: 'Success',
                description: 'Volunteer assigned successfully',
            });
            fetchRequests(); // Refresh requests
            setAssignModalOpen(false);
            setDetailsOpen(false);
        } catch (err) {
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

    // Get status badge color
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary">Pending</Badge>;
            case 'accepted':
                return <Badge variant="outline">Accepted</Badge>;
            case 'in_progress':
                return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
            case 'completed':
                return <Badge variant="default" className="bg-green-500">Completed</Badge>;
            case 'cancelled':
                return <Badge variant="destructive">Cancelled</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.toLocaleDateString()} • ${formatDistanceToNow(date, { addSuffix: true })}`;
    };

    return (
        <ProtectedRoute type="ngo">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-theme-nature via-primary-dark to-theme-heart bg-clip-text text-transparent">
                        Rescue Requests
                    </h1>
                    <div className="flex items-center gap-4">
                        <div>
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="">All Statuses</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="accepted">Accepted</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Select
                                value={emergencyFilter}
                                onValueChange={setEmergencyFilter}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Emergency filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="">All Requests</SelectItem>
                                        <SelectItem value="true">Emergency Only</SelectItem>
                                        <SelectItem value="false">Non-Emergency Only</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10">Loading rescue requests...</div>
                ) : error ? (
                    <div className="text-center py-10 text-red-500">{error}</div>
                ) : requests.length === 0 ? (
                    <div className="card dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90 hover-lift">
                        <div className="flex flex-col items-center justify-center py-10">
                            <p className="text-lg font-medium text-foreground dark:text-foreground-dark">
                                No rescue requests found
                            </p>
                            <p className="text-sm text-muted-foreground dark:text-foreground-dark/60 mt-2">
                                {statusFilter || emergencyFilter
                                    ? 'Try changing your filters'
                                    : 'New requests will appear here'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4">
                            {requests.map((request) => (
                                <div
                                    key={request._id}
                                    className="card dark:bg-gradient-to-br dark:from-card-dark dark:to-card-dark/90 hover-lift cursor-pointer transition-all hover:shadow-lg"
                                    onClick={() => openRequestDetails(request)}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                {getStatusBadge(request.status)}
                                                {request.emergency && (
                                                    <Badge variant="destructive" className="ml-2">
                                                        <FiAlertCircle className="w-3 h-3 mr-1" />
                                                        Emergency
                                                    </Badge>
                                                )}
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    {request.animalType}
                                                </span>
                                            </div>
                                            <div className="flex items-start space-x-4">
                                                <div className="text-sm text-muted-foreground flex items-center">
                                                    <FiMapPin className="mr-1 h-4 w-4" />
                                                    {request.location.city}, {request.location.state}
                                                </div>
                                                <div className="text-sm text-muted-foreground flex items-center">
                                                    <FiClock className="mr-1 h-4 w-4" />
                                                    {formatDate(request.createdAt)}
                                                </div>
                                            </div>
                                            {request.animalDetails && request.animalDetails.condition && (
                                                <div className="mt-2 text-sm">
                                                    <span className="font-semibold">Condition:</span> {request.animalDetails.condition}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 sm:mt-0">
                                            <Button variant="ghost" size="sm" className="text-primary">
                                                View Details <FiChevronRight className="ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious 
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                    />
                                </PaginationItem>
                                {[...Array(totalPages)].map((_, i) => (
                                    <PaginationItem key={i}>
                                        <PaginationLink 
                                            isActive={currentPage === i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                        >
                                            {i + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext 
                                        onClick={() => setCurrentPage((prev) => prev < totalPages ? prev + 1 : prev)}
                                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </>
                )}

                {/* Request Details Dialog */}
                <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                    <DialogContent className="max-w-3xl">
                        {selectedRequest && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span>Rescue Request</span>
                                            {getStatusBadge(selectedRequest.status)}
                                        </div>
                                        <div>
                                            {selectedRequest.emergency && (
                                                <Badge variant="destructive">
                                                    <FiAlertCircle className="w-3 h-3 mr-1" />
                                                    Emergency
                                                </Badge>
                                            )}
                                        </div>
                                    </DialogTitle>
                                    <DialogDescription>
                                        Submitted {formatDate(selectedRequest.createdAt)}
                                    </DialogDescription>
                                </DialogHeader>

                                <Tabs defaultValue="details">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="details">Details</TabsTrigger>
                                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="details" className="space-y-4 mt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h3 className="text-sm font-medium text-muted-foreground">Animal Information</h3>
                                                <div className="mt-2 space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium">Type</span>
                                                        <span>{selectedRequest.animalType}</span>
                                                    </div>
                                                    {selectedRequest.animalDetails && (
                                                        <>
                                                            {selectedRequest.animalDetails.breed && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm font-medium">Breed</span>
                                                                    <span>{selectedRequest.animalDetails.breed}</span>
                                                                </div>
                                                            )}
                                                            {selectedRequest.animalDetails.color && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm font-medium">Color</span>
                                                                    <span>{selectedRequest.animalDetails.color}</span>
                                                                </div>
                                                            )}
                                                            {selectedRequest.animalDetails.condition && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm font-medium">Condition</span>
                                                                    <span>{selectedRequest.animalDetails.condition}</span>
                                                                </div>
                                                            )}
                                                            {selectedRequest.animalDetails.approximateAge && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm font-medium">Age (Approx.)</span>
                                                                    <span>{selectedRequest.animalDetails.approximateAge}</span>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-medium text-muted-foreground">Location Information</h3>
                                                <div className="mt-2 space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium">City</span>
                                                        <span>{selectedRequest.location.city}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium">State</span>
                                                        <span>{selectedRequest.location.state}</span>
                                                    </div>
                                                    {selectedRequest.location.address && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium">Address</span>
                                                            <span>{selectedRequest.location.address}</span>
                                                        </div>
                                                    )}
                                                    {selectedRequest.location.landmark && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium">Landmark</span>
                                                            <span>{selectedRequest.location.landmark}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
                                            <div className="mt-2 space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium">Phone</span>
                                                    <span>{selectedRequest.contactInfo.phone}</span>
                                                </div>
                                                {selectedRequest.contactInfo.name && (
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium">Name</span>
                                                        <span>{selectedRequest.contactInfo.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Special needs if any */}
                                        {selectedRequest.animalDetails && selectedRequest.animalDetails.specialNeeds && (
                                            <div>
                                                <h3 className="text-sm font-medium text-muted-foreground">Special Needs</h3>
                                                <p className="mt-2 text-sm">{selectedRequest.animalDetails.specialNeeds}</p>
                                            </div>
                                        )}

                                        {/* Image gallery if any */}
                                        {selectedRequest.images && selectedRequest.images.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-medium text-muted-foreground">Images</h3>
                                                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {selectedRequest.images.map((image, index) => (
                                                        <div key={index} className="relative h-24 overflow-hidden rounded-md">
                                                            <img
                                                                src={image.url}
                                                                alt={image.caption || `Image ${index + 1}`}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="timeline" className="space-y-4 mt-4">
                                        {selectedRequest.rescueTimeline && selectedRequest.rescueTimeline.length > 0 ? (
                                            <div className="space-y-4">
                                                {selectedRequest.rescueTimeline.map((item, index) => (
                                                    <div key={index} className="relative pl-6 pb-4 border-l-2 border-gray-200 dark:border-gray-700">
                                                        <div className="absolute left-[-7px] top-0 bg-primary rounded-full w-3 h-3"></div>
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
                                            <div className="text-center py-4 text-muted-foreground">
                                                No timeline events available
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>

                                <DialogFooter className="flex-col sm:flex-row gap-2">
                                    {selectedRequest.status === 'pending' && (
                                        <Button
                                            onClick={() => handleAcceptRequest(selectedRequest._id)}
                                            disabled={processingAction}
                                        >
                                            Accept Request
                                        </Button>
                                    )}
                                    {selectedRequest.status === 'accepted' && (
                                        <Button
                                            onClick={openAssignModal}
                                            disabled={processingAction}
                                        >
                                            Assign Volunteer
                                        </Button>
                                    )}
                                    <DialogClose asChild>
                                        <Button variant="outline">Close</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Assign Volunteer Dialog */}
                <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Assign Volunteer</DialogTitle>
                            <DialogDescription>
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
                                            <SelectItem value="" disabled>
                                                No active volunteers available
                                            </SelectItem>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button
                                onClick={handleAssignVolunteer}
                                disabled={!selectedVolunteer || processingAction}
                            >
                                Assign
                            </Button>
                            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
                                Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    );
}
