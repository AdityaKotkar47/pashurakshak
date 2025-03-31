import axios from 'axios';
import { getNgoAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Interface for Volunteer data
export interface Volunteer {
    _id: string;
    name: string;
    email: string;
    status: 'active' | 'inactive';
    ngo: string;
    activeRescues: string[];
    completedRescues: number;
    createdAt: string;
    updatedAt: string;
}

// Interface for adding a new volunteer
export interface AddVolunteerRequest {
    name: string;
    email: string;
}

// Volunteer service functions
const volunteerService = {
    // Get all volunteers for the NGO
    async getVolunteers(): Promise<Volunteer[]> {
        try {
            getNgoAuthToken();

            const response = await axios.get(`${API_URL}/api/volunteers`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching volunteers:', error);
            throw error;
        }
    },

    // Add a new volunteer
    async addVolunteer(volunteer: AddVolunteerRequest): Promise<Volunteer> {
        try {
            getNgoAuthToken();

            const response = await axios.post(`${API_URL}/api/volunteers/add`, volunteer);
            return response.data.data;
        } catch (error) {
            console.error('Error adding volunteer:', error);
            throw error;
        }
    },

    // Delete a volunteer
    async deleteVolunteer(volunteerId: string): Promise<void> {
        try {
            getNgoAuthToken();

            await axios.delete(`${API_URL}/api/volunteers/remove/${volunteerId}`);
        } catch (error) {
            console.error('Error deleting volunteer:', error);
            throw error;
        }
    },
};

export default volunteerService;
