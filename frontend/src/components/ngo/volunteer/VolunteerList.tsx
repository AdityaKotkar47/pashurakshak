'use client';

import { useState, useEffect } from 'react';
import { FiUsers, FiUserPlus, FiTrash2, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import volunteerService, { Volunteer } from '@/utils/volunteerService';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';
import { AxiosError } from 'axios';

// Volunteer list component to display all volunteers
export const VolunteerList = () => {
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);

    // New volunteer form data
    const [newVolunteer, setNewVolunteer] = useState({
        name: '',
        email: '',
    });

    // Fetch volunteers on component mount
    useEffect(() => {
        fetchVolunteers();
    }, []);

    // Function to fetch volunteers
    const fetchVolunteers = async () => {
        try {
            setLoading(true);
            const data = await volunteerService.getVolunteers();
            setVolunteers(data);
            setError(null);
        } catch (err: unknown) {
            const error = err as AxiosError<{ message?: string }>;
            setError(error.response?.data?.message || 'Error fetching volunteers');
            console.error('Failed to fetch volunteers', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Handle refresh button click
    const handleRefresh = () => {
        setRefreshing(true);
        fetchVolunteers();
    };

    // Handle input change for new volunteer form
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewVolunteer({ ...newVolunteer, [name]: value });
    };

    // Handle form submission to add a new volunteer
    const handleAddVolunteer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setLoading(true);
            await volunteerService.addVolunteer(newVolunteer);

            // Reset form and close modal
            setNewVolunteer({ name: '', email: '' });
            setShowAddModal(false);

            // Refresh volunteer list
            await fetchVolunteers();
        } catch (err: unknown) {
            const error = err as AxiosError<{ message?: string }>;
            setError(error.response?.data?.message || 'Error adding volunteer');
            console.error('Failed to add volunteer', error);
        } finally {
            setLoading(false);
        }
    };

    // Confirm volunteer deletion
    const confirmDelete = (volunteer: Volunteer) => {
        setSelectedVolunteer(volunteer);
        setShowDeleteModal(true);
    };

    // Handle volunteer deletion
    const handleDeleteVolunteer = async () => {
        if (!selectedVolunteer) return;

        try {
            setLoading(true);
            await volunteerService.deleteVolunteer(selectedVolunteer._id);

            // Close modal and refresh list
            setShowDeleteModal(false);
            setSelectedVolunteer(null);

            // Refresh volunteer list
            await fetchVolunteers();
        } catch (err: unknown) {
            const error = err as AxiosError<{ message?: string }>;
            setError(error.response?.data?.message || 'Error deleting volunteer');
            console.error('Failed to delete volunteer', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FiUsers className="w-5 h-5 text-primary-600 dark:text-theme-heart" />
                    <h2 className="text-lg font-medium text-foreground dark:text-foreground-dark">
                        Volunteer Team
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={loading || refreshing}
                        className="px-3 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 rounded-md bg-theme-nature text-white hover:bg-theme-nature/90 dark:bg-theme-heart dark:hover:bg-theme-heart/90 transition-colors flex items-center gap-2"
                    >
                        <FiUserPlus className="w-4 h-4" />
                        <span>Add Volunteer</span>
                    </button>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                    <div className="flex items-center gap-2">
                        <FiAlertTriangle className="w-5 h-5" />
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* Loading state */}
            {(loading || refreshing) && <TableSkeleton rows={5} columns={5} showHeader={true} />}

            {/* Volunteers table */}
            {!loading && !refreshing && volunteers.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-300 rounded-md dark:border-border-dark">
                    <p className="text-gray-500 dark:text-gray-400">
                        No volunteers found. Add your first volunteer to get started.
                    </p>
                </div>
            ) : (
                !loading &&
                !refreshing && (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-300 dark:divide-border-dark">
                            <thead className="bg-gray-50 dark:bg-card-dark/50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300"
                                    >
                                        Name
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-300"
                                    >
                                        Email
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-300"
                                    >
                                        Status
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-300"
                                    >
                                        Joined
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-border-dark bg-white dark:bg-card-dark">
                                {volunteers.map(volunteer => (
                                    <tr key={volunteer._id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white">
                                            {volunteer.name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                            {volunteer.email}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <span
                                                className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                                                    volunteer.status === 'active'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                {volunteer.status}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                            {new Date(volunteer.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                            <button
                                                onClick={() => confirmDelete(volunteer)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                <FiTrash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* Add Volunteer Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-card-dark rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Add New Volunteer
                            </h3>
                            <button
                                type="button"
                                className="text-gray-400 hover:text-gray-500 dark:text-gray-300"
                                onClick={() => setShowAddModal(false)}
                            >
                                <span className="sr-only">Close</span>
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleAddVolunteer} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={newVolunteer.name}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-theme-nature focus:outline-none dark:bg-card-dark dark:border-border-dark dark:text-white dark:focus:border-theme-heart"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={newVolunteer.email}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-theme-nature focus:outline-none dark:bg-card-dark dark:border-border-dark dark:text-white dark:focus:border-theme-heart"
                                />
                            </div>

                            <div className="mt-6 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-border-dark dark:text-gray-300 dark:hover:bg-gray-800 focus:outline-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-md bg-theme-nature text-white hover:bg-theme-nature/90 dark:bg-theme-heart dark:hover:bg-theme-heart/90 focus:outline-none"
                                    disabled={loading}
                                >
                                    {loading ? 'Adding...' : 'Add Volunteer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedVolunteer && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-card-dark rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Confirm Deletion
                            </h3>
                            <button
                                type="button"
                                className="text-gray-400 hover:text-gray-500 dark:text-gray-300"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                <span className="sr-only">Close</span>
                                &times;
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-300">
                                Are you sure you want to remove{' '}
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {selectedVolunteer.name}
                                </span>{' '}
                                from your volunteer team? This action cannot be undone.
                            </p>

                            <div className="mt-6 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-border-dark dark:text-gray-300 dark:hover:bg-gray-800 focus:outline-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteVolunteer}
                                    className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none"
                                    disabled={loading}
                                >
                                    {loading ? 'Removing...' : 'Remove Volunteer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
