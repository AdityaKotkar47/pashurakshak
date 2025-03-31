# PashuRakshak Rescue System Implementation Roadmap

## Overview

This roadmap outlines a systematic approach to implementing a complete animal rescue system in PashuRakshak, connecting mobile app users, NGO admins, and volunteers in a seamless workflow. The implementation is broken down into manageable phases for easier development and testing.

## Current State

-   Authentication system for users, NGOs, and admin is implemented
-   Basic NGO registration and approval system exists
-   Frontend dashboard shells for NGO admin portal
-   Backend API foundation established
-   **Volunteer management system is implemented** ✅
-   **Volunteer login API for mobile app is implemented** ✅

## Implementation Phases

### Phase 1: Data Models and Basic API Endpoints (Week 1)

#### 1.1 Create New Data Models

-   **Rescue Request Model**

    ```javascript
    const rescueRequestSchema = new mongoose.Schema(
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            animalType: {
                type: String,
                required: [true, 'Animal type is required'],
                enum: ['Dog', 'Cat', 'Bird', 'Cattle', 'Wildlife', 'Other'],
            },
            animalDetails: {
                breed: String,
                color: String,
                approximateAge: String,
                condition: {
                    type: String,
                    enum: ['Critical', 'Injured', 'Sick', 'Healthy', 'Unknown'],
                    default: 'Unknown',
                },
                specialNeeds: String,
            },
            location: {
                address: String,
                landmark: String,
                city: {
                    type: String,
                    required: [true, 'City is required'],
                },
                state: {
                    type: String,
                    required: [true, 'State is required'],
                },
                pincode: String,
                coordinates: {
                    latitude: Number,
                    longitude: Number,
                },
            },
            images: [
                {
                    url: String,
                    caption: String,
                },
            ],
            status: {
                type: String,
                enum: [
                    'pending',
                    'accepted',
                    'in_progress',
                    'completed',
                    'cancelled',
                ],
                default: 'pending',
            },
            emergency: {
                type: Boolean,
                default: false,
            },
            assignedTo: {
                ngo: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Ngo',
                },
                volunteer: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Volunteer',
                },
                assignedAt: Date,
            },
            rescueTimeline: [
                {
                    status: {
                        type: String,
                        enum: [
                            'request_received',
                            'ngo_assigned',
                            'volunteer_assigned',
                            'volunteer_dispatched',
                            'reached_location',
                            'animal_rescued',
                            'returning_to_center',
                            'treatment_started',
                            'completed',
                        ],
                    },
                    timestamp: {
                        type: Date,
                        default: Date.now,
                    },
                    notes: String,
                },
            ],
            contactInfo: {
                name: String,
                phone: {
                    type: String,
                    required: [true, 'Contact phone is required'],
                },
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
        {
            timestamps: true,
        }
    );
    ```

-   **Volunteer Model** ✅ (Implemented)
    ```javascript
    const volunteerSchema = new mongoose.Schema(
        {
            name: {
                type: String,
                required: [true, 'Please provide volunteer name'],
                trim: true,
            },
            email: {
                type: String,
                required: [true, 'Please provide email'],
                unique: true,
                lowercase: true,
                trim: true,
            },
            password: {
                type: String,
                required: [true, 'Please provide password'],
                minlength: 6,
                select: false,
            },
            ngo: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Ngo',
                required: [true, 'Volunteer must belong to an NGO'],
            },
            status: {
                type: String,
                enum: ['active', 'inactive'],
                default: 'active',
            },
            activeRescues: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'RescueRequest',
                },
            ],
            completedRescues: {
                type: Number,
                default: 0,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
        {
            timestamps: true,
        }
    );
    ```

#### 1.2 Create API Endpoints for Rescue Requests

-   **Rescue Request Routes**

    -   `POST /api/rescue/request` - Create a new rescue request (from mobile app)
    -   `GET /api/rescue/requests` - Get all rescue requests (paginated)
    -   `GET /api/rescue/requests/:id` - Get rescue request details
    -   `PUT /api/rescue/requests/:id/accept` - NGO accepts a rescue request
    -   `PUT /api/rescue/requests/:id/status` - Update rescue request status

-   **Volunteer Management Routes** ✅ (Implemented)
    -   `POST /api/volunteers/add` - Add a new volunteer
    -   `GET /api/volunteers` - Get all volunteers for an NGO
    -   `DELETE /api/volunteers/remove/:volunteerId` - Remove a volunteer
    -   `POST /api/volunteers/login` - Volunteer login for mobile app

### Phase 2: NGO Admin Portal Development (Week 2)

#### 2.1 Rescue Request Dashboard

-   Create request list view with filtering options (status, date, emergency)
-   Implement request detail view with complete information
-   Create request management interface (accept/assign buttons)
-   Add search and sort functionalities

#### 2.2 Volunteer Management Interface ✅ (Implemented)

-   Create volunteer registration form
-   Build volunteer list view with status indicators
-   Create volunteer assignment interface for rescue requests (Next up)

#### 2.3 Rescue Progress Tracking

-   Implement timeline visualization for rescue requests
-   Create status update interface for NGO admins
-   Add notes and communication features

### Phase 3: Mobile App Integration (Week 3)

#### 3.1 Create Mobile API Endpoints

-   Volunteer mobile app endpoints

    -   `POST /api/volunteers/login` - Volunteer login ✅ (Implemented)
    -   `GET /api/volunteer/profile` - Get volunteer profile
    -   `GET /api/volunteer/missions` - Get assigned rescue missions
    -   `PUT /api/volunteer/missions/:id/status` - Update mission status
    -   `POST /api/volunteer/missions/:id/notes` - Add notes to mission

-   User mobile app endpoints
    -   `GET /api/rescue/requests/user/:userId` - Get user's rescue requests
    -   `GET /api/rescue/requests/:id/timeline` - Get rescue timeline updates

#### 3.2 Real-time Updates System

-   Implement webhook endpoints for status changes
-   Create polling-based update system (workaround for Vercel limitations)
-   Set up scheduled jobs for status synchronization

### Phase 4: Testing and Optimization (Week 4)

#### 4.1 End-to-End Testing

-   Create test scripts for complete rescue workflow
-   Test concurrent rescue requests
-   Test edge cases (cancellations, reassignments)

#### 4.2 Performance Optimization

-   Optimize database queries
-   Implement caching where applicable
-   Add pagination and lazy loading for large data sets

#### 4.3 Security Enhancements

-   Review and strengthen authentication
-   Implement proper access controls
-   Add rate limiting for API endpoints

### Phase 5: Final Integration and Deployment (Week 5)

#### 5.1 Final Integration

-   Connect all components (mobile app, NGO portal, admin panel)
-   Verify data consistency across all platforms
-   Test full user journeys

#### 5.2 Documentation and Training

-   Create API documentation
-   Write user guides for NGO admins
-   Prepare training materials for volunteers

#### 5.3 Deployment

-   Deploy updated backend to Vercel
-   Deploy updated frontend to Vercel
-   Configure monitoring and alerts

## Next Steps (Immediate Tasks)

1. Implement RescueRequest model and API endpoints
2. Create rescue request list and detail views in NGO portal
3. Implement volunteer assignment to rescue requests
4. Add rescue progress tracking functionality

## Implementation Priorities

1. Focus first on core rescue request functionality
2. Prioritize NGO admin features needed for rescue coordination
3. Then implement volunteer management system ✅ (Completed)
4. Finally enhance with real-time updates

## Technical Considerations

### Database Optimization for Vercel

-   Use efficient queries to minimize database load
-   Implement smart pagination and data fetching
-   Consider using edge caching where appropriate

### Real-time Updates Alternative

Since Vercel free tier doesn't support WebSockets or long-polling efficiently:

1. Implement a polling mechanism with appropriate intervals (15-30 seconds)
2. Use optimistic UI updates for better user experience
3. Consider a hybrid approach with webhooks for critical status changes

### Mobile Integration Strategy

1. Define clear API contracts between backend and mobile app
2. Use versioned APIs to allow for future changes
3. Implement proper error handling and offline capabilities
