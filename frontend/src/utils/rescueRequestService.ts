import axios from 'axios';
import { getNgoAuthToken, getAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Interface for RescueRequest data
export interface RescueRequest {
    _id: string;
    userId: string;
    animalType: 'Dog' | 'Cat' | 'Bird' | 'Cattle' | 'Wildlife' | 'Other';
    animalDetails: {
        breed?: string;
        color?: string;
        approximateAge?: string;
        condition?: 'Critical' | 'Injured' | 'Sick' | 'Healthy' | 'Unknown';
        specialNeeds?: string;
    };
    location: {
        address?: string;
        landmark?: string;
        city: string;
        state: string;
        pincode?: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
    images?: Array<{
        url: string;
        caption?: string;
    }>;
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
    emergency: boolean;
    assignedTo?: {
        ngo?: string;
        volunteer?: string;
        assignedAt?: string;
    };
    rescueTimeline: Array<{
        status: string;
        timestamp: string;
        notes?: string;
    }>;
    contactInfo: {
        name?: string;
        phone: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface RescueRequestsResponse {
    requests: RescueRequest[];
    currentPage: number;
    totalPages: number;
    totalRequests: number;
}

// Rescue request service functions
const rescueRequestService = {
    // Get all rescue requests (paginated)
    async getRescueRequests(page = 1, limit = 10, status?: string, emergency?: boolean): Promise<RescueRequestsResponse> {
        try {
            // Use NGO token by default, fall back to admin token if needed
            const ngoToken = getNgoAuthToken();
            if (!ngoToken) {
                getAuthToken(); // Set admin token if NGO token not available
            }

            let url = `${API_URL}/api/rescue/requests?page=${page}&limit=${limit}`;
            if (status) url += `&status=${status}`;
            if (emergency !== undefined) url += `&emergency=${emergency}`;

            const response = await axios.get(url);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching rescue requests:', error);
            throw error;
        }
    },

    // Get a single rescue request by ID
    async getRescueRequestById(id: string): Promise<RescueRequest> {
        try {
            // Use NGO token by default, fall back to admin token if needed
            const ngoToken = getNgoAuthToken();
            if (!ngoToken) {
                getAuthToken(); // Set admin token if NGO token not available
            }

            const response = await axios.get(`${API_URL}/api/rescue/requests/${id}`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching rescue request ${id}:`, error);
            throw error;
        }
    },

    // Accept a rescue request (NGO only)
    async acceptRescueRequest(id: string, volunteerId?: string): Promise<RescueRequest> {
        try {
            getNgoAuthToken();

            const payload = volunteerId ? { volunteerId } : {};
            const response = await axios.put(`${API_URL}/api/rescue/requests/${id}/accept`, payload);
            return response.data.data;
        } catch (error) {
            console.error(`Error accepting rescue request ${id}:`, error);
            throw error;
        }
    },

    // Assign a volunteer to an accepted request (NGO only)
    async assignVolunteerToRequest(id: string, volunteerId: string): Promise<RescueRequest> {
        try {
            getNgoAuthToken();

            const response = await axios.put(`${API_URL}/api/rescue/requests/${id}/assign-volunteer`, { volunteerId });
            return response.data.data;
        } catch (error) {
            console.error(`Error assigning volunteer to rescue request ${id}:`, error);
            throw error;
        }
    },

    // Get timeline for a rescue request
    async getRescueRequestTimeline(id: string): Promise<{ id: string; status: string; timeline: any[]; assignedTo?: any }> {
        try {
            // Use NGO token by default, fall back to admin token if needed
            const ngoToken = getNgoAuthToken();
            if (!ngoToken) {
                getAuthToken(); // Set admin token if NGO token not available
            }

            const response = await axios.get(`${API_URL}/api/rescue/requests/${id}/timeline`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching timeline for rescue request ${id}:`, error);
            throw error;
        }
    },

    // Update request status
    async updateRescueRequestStatus(id: string, status: string, notes?: string): Promise<RescueRequest> {
        try {
            getNgoAuthToken();

            const payload = { status, notes };
            const response = await axios.put(`${API_URL}/api/rescue/requests/${id}/status`, payload);
            return response.data.data;
        } catch (error) {
            console.error(`Error updating status for rescue request ${id}:`, error);
            throw error;
        }
    }
};

export default rescueRequestService;