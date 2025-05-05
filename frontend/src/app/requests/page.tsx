'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import rescueRequestService, { RescueRequest } from '@/utils/rescueRequestService';
import volunteerService, { Volunteer } from '@/utils/volunteerService';
import { FiAlertCircle, FiChevronRight, FiClock, FiMapPin } from 'react-icons/fi';

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
    const [activeTab, setActiveTab] = useState('details');

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
            alert('Rescue request accepted successfully');
            fetchRequests(); // Refresh requests
            setDetailsOpen(false);
        } catch (err) {
            alert('Failed to accept rescue request');
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
            alert('Volunteer assigned successfully');
            fetchRequests(); // Refresh requests
            setAssignModalOpen(false);
            setDetailsOpen(false);
        } catch (err) {
            alert('Failed to assign volunteer');
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

    // Get status badge color and text
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-full">Pending</span>;
            case 'accepted':
                return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Accepted</span>;
            case 'in_progress':
                return <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">In Progress</span>;
            case 'completed':
                return <span className="px-2 py-1 text-xs bg-green-500 text-white rounded-full">Completed</span>;
            case 'cancelled':
                return <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">Cancelled</span>;
            default:
                return <span className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-full">{status}</span>;
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.toLocaleDateString()} • ${getTimeAgo(date)}`;
    };

    // Simple time ago function to replace date-fns
    const getTimeAgo = (date: Date) => {
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) {
            return interval === 1 ? '1 year ago' : `${interval} years ago`;
        }
        
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) {
            return interval === 1 ? '1 month ago' : `${interval} months ago`;
        }
        
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) {
            return interval === 1 ? '1 day ago' : `${interval} days ago`;
        }
        
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
            return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
        }
        
        interval = Math.floor(seconds / 60);
        if (interval >= 1) {
            return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
        }
        
        return 'just now';
    };

    return (
        <ProtectedRoute type="ngo">
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 via-blue-600 to-purple-500 bg-clip-text text-transparent">
                        Rescue Requests
                    </h1>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <select
                                value={emergencyFilter}
                                onChange={(e) => setEmergencyFilter(e.target.value)}
                                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Requests</option>
                                <option value="true">Emergency Only</option>
                                <option value="false">Non-Emergency Only</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10">Loading rescue requests...</div>
                ) : error ? (
                    <div className="text-center py-10 text-red-500">{error}</div>
                ) : requests.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
                        <div className="flex flex-col items-center justify-center py-10">
                            <p className="text-lg font-medium">
                                No rescue requests found
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
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
                                    className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-all dark:bg-gray-800"
                                    onClick={() => openRequestDetails(request)}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2 flex-wrap">
                                                {getStatusBadge(request.status)}
                                                {request.emergency && (
                                                    <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full flex items-center">
                                                        <FiAlertCircle className="w-3 h-3 mr-1" />
                                                        Emergency
                                                    </span>
                                                )}
                                                <span className="text-sm font-medium text-gray-500">
                                                    {request.animalType}
                                                </span>
                                            </div>
                                            <div className="flex items-start space-x-4 flex-wrap">
                                                <div className="text-sm text-gray-500 flex items-center">
                                                    <FiMapPin className="mr-1 h-4 w-4" />
                                                    {request.location.city}, {request.location.state}
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center">
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
                                            <button className="text-blue-500 flex items-center text-sm">
                                                View Details <FiChevronRight className="ml-1" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center mt-6">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded border ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                                >
                                    Previous
                                </button>
                                
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'border hover:bg-gray-100'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                
                                <button
                                    onClick={() => setCurrentPage((prev) => prev < totalPages ? prev + 1 : prev)}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Request Details Modal */}
                {detailsOpen && selectedRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-gray-800">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <h2 className="text-xl font-bold">Rescue Request</h2>
                                        {getStatusBadge(selectedRequest.status)}
                                    </div>
                                    <div>
                                        {selectedRequest.emergency && (
                                            <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full flex items-center">
                                                <FiAlertCircle className="w-3 h-3 mr-1" />
                                                Emergency
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mb-6">
                                    Submitted {formatDate(selectedRequest.createdAt)}
                                </p>

                                <div className="mb-4">
                                    <div className="flex border-b">
                                        <button
                                            className={`px-4 py-2 ${activeTab === 'details' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                                            onClick={() => setActiveTab('details')}
                                        >
                                            Details
                                        </button>
                                        <button
                                            className={`px-4 py-2 ${activeTab === 'timeline' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                                            onClick={() => setActiveTab('timeline')}
                                        >
                                            Timeline
                                        </button>
                                    </div>
                                </div>

                                {activeTab === 'details' ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500 mb-2">Animal Information</h3>
                                                <div className="space-y-2">
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
                                                <h3 className="text-sm font-medium text-gray-500 mb-2">Location Information</h3>
                                                <div className="space-y-2">
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
                                            <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
                                            <div className="space-y-2">
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
                                                <h3 className="text-sm font-medium text-gray-500 mb-2">Special Needs</h3>
                                                <p className="text-sm">{selectedRequest.animalDetails.specialNeeds}</p>
                                            </div>
                                        )}

                                        {/* Image gallery if any */}
                                        {selectedRequest.images && selectedRequest.images.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500 mb-2">Images</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {selectedRequest.images.map((image, index) => (
                                                        <div key={index} className="h-24 overflow-hidden rounded-md">
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
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {selectedRequest.rescueTimeline && selectedRequest.rescueTimeline.length > 0 ? (
                                            <div className="space-y-4">
                                                {selectedRequest.rescueTimeline.map((item, index) => (
                                                    <div key={index} className="relative pl-6 pb-4 border-l-2 border-gray-200">
                                                        <div className="absolute left-[-7px] top-0 bg-blue-500 rounded-full w-3 h-3"></div>
                                                        <div>
                                                            <span className="text-sm font-medium capitalize">
                                                                {item.status.replace(/_/g, ' ')}
                                                            </span>
                                                            <span className="text-xs text-gray-500 block">
                                                                {formatDate(item.timestamp)}
                                                            </span>
                                                            {item.notes && (
                                                                <p className="text-sm mt-1 text-gray-600">
                                                                    {item.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-gray-500">
                                                No timeline events available
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="mt-8 flex justify-end space-x-4">
                                    {selectedRequest.status === 'pending' && (
                                        <button
                                            onClick={() => handleAcceptRequest(selectedRequest._id)}
                                            disabled={processingAction}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                        >
                                            Accept Request
                                        </button>
                                    )}
                                    {selectedRequest.status === 'accepted' && (
                                        <button
                                            onClick={openAssignModal}
                                            disabled={processingAction}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                        >
                                            Assign Volunteer
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setDetailsOpen(false)}
                                        className="px-4 py-2 border rounded hover:bg-gray-100"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Assign Volunteer Modal */}
                {assignModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-md dark:bg-gray-800">
                            <div className="p-6">
                                <h2 className="text-xl font-bold mb-4">Assign Volunteer</h2>
                                <p className="text-gray-500 mb-4">
                                    Select a volunteer to assign to this rescue request.
                                </p>

                                <div className="mb-6">
                                    <select
                                        value={selectedVolunteer}
                                        onChange={(e) => setSelectedVolunteer(e.target.value)}
                                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select a volunteer</option>
                                        {volunteers.length > 0 ? (
                                            volunteers.map((volunteer) => (
                                                <option key={volunteer._id} value={volunteer._id}>
                                                    {volunteer.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>
                                                No active volunteers available
                                            </option>
                                        )}
                                    </select>
                                </div>

                                <div className="flex justify-end space-x-4">
                                    <button
                                        onClick={handleAssignVolunteer}
                                        disabled={!selectedVolunteer || processingAction}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                    >
                                        Assign
                                    </button>
                                    <button
                                        onClick={() => setAssignModalOpen(false)}
                                        className="px-4 py-2 border rounded hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
