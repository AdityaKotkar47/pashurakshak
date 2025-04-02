# PashuRakshak API Documentation

This document outlines all the completed API endpoints in the PashuRakshak application and how to test them.

## API Endpoints Overview

| Method | Endpoint                            | Description                    | Auth Required | Request Type        |
| ------ | ----------------------------------- | ------------------------------ | ------------- | ------------------- |
| GET    | /                                   | API Health Check               | No            | -                   |
| POST   | /api/auth/register                  | Register a User                | No            | application/json    |
| POST   | /api/auth/login                     | Login as a User                | No            | application/json    |
| POST   | /api/auth/forgot-password           | Request Password Reset         | No            | application/json    |
| POST   | /api/auth/reset-password/:token     | Reset Password                 | No            | application/json    |
| POST   | /api/ngo/register                   | Register an NGO                | No            | application/json    |
| POST   | /api/ngo/login                      | Login as an NGO                | No            | application/json    |
| GET    | /api/ngo/profile                    | Get NGO Profile                | Yes (NGO)     | -                   |
| GET    | /api/ngo/status/:id                 | Check NGO Registration Status  | No            | -                   |
| POST   | /api/admin/login                    | Admin Login                    | No            | application/json    |
| GET    | /api/admin/verify                   | Verify Admin Token             | Yes (Admin)   | -                   |
| GET    | /api/admin/registrations            | Get All NGO Registrations      | Yes (Admin)   | -                   |
| PUT    | /api/admin/registrations/:id        | Update NGO Registration Status | Yes (Admin)   | application/json    |
| GET    | /api/admin/ngo/:id                  | Get Complete NGO Profile       | Yes (Admin)   | -                   |
| POST   | /api/upload/image                   | Upload Image to Cloudinary     | No            | multipart/form-data |
| POST   | /api/volunteers/login               | Volunteer Login                | No            | application/json    |
| POST   | /api/volunteers/add                 | Add a New Volunteer            | Yes (NGO)     | application/json    |
| GET    | /api/volunteers                     | Get NGO's Volunteers           | Yes (NGO)     | -                   |
| DELETE | /api/volunteers/remove/:volunteerId | Remove a Volunteer             | Yes (NGO)     | -                   |

## Base URL

```
http://localhost:5000
```

## Authentication APIs

### Register a User

-   **Endpoint**: `POST /api/auth/register`
-   **Description**: Register a new regular user account
-   **Content-Type**: `application/json`
-   **Request Body**:
    ```json
    {
        "name": "John Doe",
        "email": "john@example.com",
        "password": "password123",
        "phone": "9876543210"
    }
    ```
-   **Success Response**: Status 201
    ```json
    {
        "success": true,
        "message": "User registered successfully",
        "data": {
            "id": "12345",
            "name": "John Doe",
            "email": "john@example.com"
        }
    }
    ```
-   **Error Response**: Status 400/500
    ```json
    {
        "success": false,
        "message": "Error in user registration",
        "error": "Email already in use"
    }
    ```

### Login

-   **Endpoint**: `POST /api/auth/login`
-   **Description**: Login as a registered user
-   **Content-Type**: `application/json`
-   **Request Body**:
    ```json
    {
        "email": "john@example.com",
        "password": "password123"
    }
    ```
-   **Success Response**: Status 200
    ```json
    {
        "success": true,
        "message": "Login successful",
        "data": {
            "token": "jwt_token_here",
            "user": {
                "id": "12345",
                "name": "John Doe",
                "email": "john@example.com"
            }
        }
    }
    ```
-   **Error Response**: Status 401
    ```json
    {
        "success": false,
        "message": "Invalid credentials"
    }
    ```

### Forgot Password

-   **Endpoint**: `POST /api/auth/forgot-password`
-   **Description**: Request password reset for a user account
-   **Content-Type**: `application/json`
-   **Request Body**:
    ```json
    {
        "email": "john@example.com"
    }
    ```
-   **Success Response**: Status 200
    ```json
    {
        "success": true,
        "message": "Password reset email sent"
    }
    ```
-   **Error Response**: Status 404
    ```json
    {
        "success": false,
        "message": "No user found with that email"
    }
    ```

### Reset Password

-   **Endpoint**: `POST /api/auth/reset-password/:token`
-   **Description**: Reset password using token received via email
-   **Content-Type**: `application/json`
-   **Request Body**:
    ```json
    {
        "password": "newpassword123"
    }
    ```
-   **Success Response**: Status 200
    ```json
    {
        "success": true,
        "message": "Password has been reset"
    }
    ```
-   **Error Response**: Status 400
    ```json
    {
        "success": false,
        "message": "Token is invalid or has expired"
    }
    ```

## NGO APIs

### Register an NGO

-   **Endpoint**: `POST /api/ngo/register`
-   **Description**: Register a new NGO account (requires admin approval)
-   **Content-Type**: `application/json`
-   **Request Body**:
    ```json
    {
        "name": "Animal Welfare NGO",
        "email": "ngo@example.com",
        "password": "password123",
        "contactPerson": {
            "name": "John Doe",
            "phone": "9876543210",
            "email": "john@example.com"
        },
        "organizationType": "Animal Welfare",
        "registrationNumber": "AWN12345",
        "address": {
            "street": "123 Main St",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001"
        },
        "focusAreas": ["Animal Rescue", "Pet Adoption"],
        "website": "https://example.com",
        "documents": {
            "registrationCertificate": "https://res.cloudinary.com/pashurakshak/image/upload/v1234567890/certificates/registration_cert.png",
            "taxExemptionCertificate": "https://res.cloudinary.com/pashurakshak/image/upload/v1234567890/certificates/tax_cert.png"
        }
    }
    ```
-   **Success Response**: Status 201
    ```json
    {
        "success": true,
        "message": "NGO registration submitted successfully",
        "data": {
            "id": "12345",
            "name": "Animal Welfare NGO",
            "email": "ngo@example.com",
            "status": "pending"
        }
    }
    ```
-   **Error Response**: Status 400/500
    ```json
    {
        "success": false,
        "message": "Error in NGO registration",
        "error": "Ngo validation failed: documents.registrationCertificate: Please provide registration certificate"
    }
    ```

### Login NGO

-   **Endpoint**: `POST /api/ngo/login`
-   **Description**: Login as an approved NGO
-   **Content-Type**: `application/json`
-   **Request Body**:
    ```json
    {
        "email": "ngo@example.com",
        "password": "password123"
    }
    ```
-   **Success Response**: Status 200
    ```json
    {
        "success": true,
        "message": "Login successful",
        "data": {
            "token": "jwt_token_here",
            "ngo": {
                "id": "12345",
                "name": "Animal Welfare NGO",
                "email": "ngo@example.com",
                "status": "approved"
            }
        }
    }
    ```
-   **Error Response**: Status 401
    ```json
    {
        "success": false,
        "message": "Invalid credentials"
    }
    ```
    OR
    ```json
    {
        "success": false,
        "message": "Your registration is pending approval"
    }
    ```

## Volunteer APIs

### Volunteer Login

-   **Endpoint**: `POST /api/volunteers/login`
-   **Description**: Login as a volunteer (for mobile app)
-   **Content-Type**: `application/json`
-   **Request Body**:
    ```json
    {
        "email": "volunteer@example.com",
        "password": "password123"
    }
    ```
-   **Success Response**: Status 200
    ```json
    {
        "success": true,
        "message": "Login successful",
        "data": {
            "token": "jwt_token_here",
            "volunteer": {
                "_id": "12345",
                "name": "Volunteer Name",
                "email": "volunteer@example.com",
                "ngo": "67890",
                "status": "active",
                "completedRescues": 0,
                "activeRescues": []
            }
        }
    }
    ```
-   **Error Response**: Status 401
    ```json
    {
        "success": false,
        "message": "Invalid credentials"
    }
    ```
    OR
    ```json
    {
        "success": false,
        "message": "Your account is currently inactive. Please contact your NGO."
    }
    ```

### Add a Volunteer

-   **Endpoint**: `POST /api/volunteers/add`
-   **Description**: Add a new volunteer to an NGO (NGO admin only)
-   **Content-Type**: `application/json`
-   **Headers**:
    ```
    Authorization: Bearer <ngo_token>
    ```
-   **Request Body**:
    ```json
    {
        "name": "Volunteer Name",
        "email": "volunteer@example.com"
    }
    ```
-   **Success Response**: Status 201
    ```json
    {
        "success": true,
        "message": "Volunteer added successfully",
        "data": {
            "_id": "12345",
            "name": "Volunteer Name",
            "email": "volunteer@example.com",
            "ngo": "67890",
            "status": "active",
            "completedRescues": 0,
            "activeRescues": []
        }
    }
    ```
-   **Error Response**: Status 400/500
    ```json
    {
        "success": false,
        "message": "A volunteer with this email already exists"
    }
    ```

### Get NGO's Volunteers

-   **Endpoint**: `GET /api/volunteers`
-   **Description**: Get all volunteers for the authenticated NGO
-   **Headers**:
    ```
    Authorization: Bearer <ngo_token>
    ```
-   **Success Response**: Status 200
    ```json
    {
        "success": true,
        "count": 2,
        "data": [
            {
                "_id": "12345",
                "name": "Volunteer 1",
                "email": "volunteer1@example.com",
                "ngo": "67890",
                "status": "active",
                "completedRescues": 0,
                "activeRescues": []
            },
            {
                "_id": "67891",
                "name": "Volunteer 2",
                "email": "volunteer2@example.com",
                "ngo": "67890",
                "status": "active",
                "completedRescues": 3,
                "activeRescues": ["rescue_id_1", "rescue_id_2"]
            }
        ]
    }
    ```
-   **Error Response**: Status 401/500
    ```json
    {
        "success": false,
        "message": "Not authorized, no token"
    }
    ```

### Remove a Volunteer

-   **Endpoint**: `DELETE /api/volunteers/remove/:volunteerId`
-   **Description**: Remove a volunteer from an NGO
-   **Headers**:
    ```
    Authorization: Bearer <ngo_token>
    ```
-   **Success Response**: Status 200
    ```json
    {
        "success": true,
        "message": "Volunteer deleted successfully"
    }
    ```
-   **Error Response**: Status 404
    ```json
    {
        "success": false,
        "message": "Volunteer not found or not authorized"
    }
    ```

## Admin APIs

### Admin Login

-   **Endpoint**: `POST /api/admin/login`
-   **Description**: Login as an administrator
-   **Content-Type**: `application/json`
-   **Request Body**:
    ```json
    {
        "email": "admin@pashurakshak.org",
        "password": "admin123"
    }
    ```
-   **Success Response**: Status 200
    ```json
    {
        "success": true,
        "message": "Login successful",
        "data": {
            "token": "jwt_token_here",
            "user": {
                "email": "admin@pashurakshak.org",
                "role": "admin"
            }
        }
    }
    ```
-   **Error Response**: Status 401
    ```json
    {
        "success": false,
        "message": "Invalid email or password"
    }
    ```

### Verify Admin Token

-   **Endpoint**: `GET /api/admin/verify`
-   **Description**: Verify if the admin token is valid
-   **Headers**:
    ```
    Authorization: Bearer <admin_token>
    ```
-   **Success Response**: Status 200
    ```json
    {
        "success": true,
        "data": {
            "user": {
                "id": "admin",
                "role": "admin",
                "email": "admin@pashurakshak.org"
            }
        }
    }
    ```
-   **Error Response**: Status 401
    ```json
    {
        "success": false,
        "message": "Not authorized, no token"
    }
    ```

### Get All NGO Registrations

-   **Endpoint**: `GET /api/admin/registrations`
-   **Description**: Get a list of all NGO registrations
-   **Headers**:
    ```
    Authorization: Bearer <admin_token>
    ```
-   **Success Response**: Status 200
    ```json
    {
        "success": true,
        "registrations": [
            {
                "_id": "12345",
                "name": "Animal Welfare NGO",
                "email": "ngo@example.com",
                "status": "pending",
                "organizationType": "Animal Welfare",
                "address": {
                    "state": "Maharashtra"
                },
                "createdAt": "2023-01-01T00:00:00.000Z"
            }
        ]
    }
    ```
-   **Error Response**: Status 401/500
    ```json
    {
        "success": false,
        "message": "Not authorized to access this route"
    }
    ```

### Get Complete NGO Profile

-   **Endpoint**: `GET /api/admin/ngo/:id`
-   **Description**: Get the complete profile of an NGO by ID (Admin only)
-   **Headers**:
    ```
    Authorization: Bearer <admin_token>
    ```
-   **Success Response**: Status 200
    ```json
    {
        "success": true,
        "data": {
            "_id": "12345",
            "name": "Animal Welfare NGO",
            "email": "ngo@example.com",
            "status": "approved",
            "contactPerson": {
                "name": "John Doe",
                "phone": "9876543210",
                "email": "john@example.com"
            },
            "organizationType": "Animal Welfare",
            "registrationNumber": "AWN12345",
            "address": {
                "street": "123 Main St",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001"
            },
            "focusAreas": ["Animal Rescue", "Pet Adoption"],
            "website": "https://example.com",
            "documents": {
                "registrationCertificate": "url_to_certificate",
                "taxExemptionCertificate": "url_to_certificate"
            },
            "createdAt": "2023-01-01T00:00:00.000Z"
        }
    }
    ```
-   **Error Response**: Status 404
    ```json
    {
        "success": false,
        "message": "NGO not found"
    }
    ```

### Update NGO Registration Status

-   **Endpoint**: `PUT /api/admin/registrations/:id`
-   **Description**: Approve or reject an NGO registration
-   **Headers**:
    ```
    Authorization: Bearer <admin_token>
    Content-Type: application/json
    ```
-   **Request Body**:
    ```json
    {
        "status": "approved" // or "rejected"
    }
    ```
-   **Success Response**: Status 200
    ```json
    {
        "success": true,
        "message": "NGO status updated to approved",
        "data": {
            "id": "12345",
            "name": "Animal Welfare NGO",
            "email": "ngo@example.com",
            "status": "approved"
        }
    }
    ```

````
- **Error Response**: Status 404
  ```json
  {
    "success": false,
    "message": "NGO not found"
  }
````

OR Status 400

```json
{
    "success": false,
    "message": "NGO is already approved"
}
```

## NGO APIs

### Get NGO Profile

-   **Endpoint**: `GET /api/ngo/profile`
-   **Description**: Get the profile of the logged-in NGO
-   **Headers**:
    ```
    Authorization: Bearer <ngo_token>
    ```
-   **Success Response**: Status 200
    ```json
    {
        "success": true,
        "data": {
            "_id": "12345",
            "name": "Animal Welfare NGO",
            "email": "ngo@example.com",
            "status": "approved",
            "contactPerson": {
                "name": "John Doe",
                "phone": "9876543210",
                "email": "john@example.com"
            },
            "organizationType": "Animal Welfare",
            "registrationNumber": "AWN12345",
            "address": {
                "street": "123 Main St",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001"
            },
            "focusAreas": ["Animal Rescue", "Pet Adoption"],
            "website": "https://example.com",
            "documents": {
                "registrationCertificate": "url_to_certificate",
                "taxExemptionCertificate": "url_to_certificate"
            },
            "createdAt": "2023-01-01T00:00:00.000Z"
        }
    }
    ```

````
- **Error Response**: Status 401
  ```json
  {
    "success": false,
    "message": "Not authorized, no token"
  }
````

### Get NGO Status

-   **Endpoint**: `GET /api/ngo/status/:id`
-   **Description**: Check the status of an NGO registration using its ID
-   **Success Response**: Status 200
    ```json
    {
        "success": true,
        "data": {
            "name": "Animal Welfare NGO",
            "status": "pending",
            "createdAt": "2023-01-01T00:00:00.000Z"
        }
    }
    ```
-   **Error Response**: Status 404
    ```json
    {
        "success": false,
        "message": "NGO not found"
    }
    ```

## Testing the APIs with Postman

### 1. Setting Up Postman

1. **Create a new Collection** named "PashuRakshak API"
2. **Create a new Environment** named "PashuRakshak Local" with these variables:
    - `BASE_URL`: `http://localhost:5000`
    - `ADMIN_TOKEN`: (Populated after admin login)
    - `NGO_TOKEN`: (Populated after NGO login)
    - `NGO_ID`: (Populated after NGO registration)
    - `VOLUNTEER_TOKEN`: (Populated after volunteer login)

### 2. Testing Root Endpoint

1. **Create a new request**:

    - Method: `GET`
    - URL: `{{BASE_URL}}/`
    - In the Tests tab, add:

        ```javascript
        pm.test('Status code is 200', function () {
            pm.response.to.have.status(200);
        });

        pm.test('API is running', function () {
            var jsonData = pm.response.json();
            pm.expect(jsonData.message).to.include('API is running');
        });
        ```

### 3. Register an NGO

1. **Create a new request**:
    - Method: `POST`
    - URL: `{{BASE_URL}}/api/ngo/register`
    - Headers:
        ```
        Content-Type: application/json
        ```
    - Body: Select `raw` and choose `JSON`
    - Add JSON:
        ```json
        {
            "name": "Animal Welfare NGO",
            "email": "ngo@example.com",
            "password": "password123",
            "contactPerson": {
                "name": "John Doe",
                "phone": "9876543210",
                "email": "john@example.com"
            },
            "organizationType": "Animal Welfare",
            "registrationNumber": "AWN12345",
            "address": {
                "street": "123 Main St",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001"
            },
            "focusAreas": ["Animal Rescue", "Pet Adoption"],
            "website": "https://example.com",
            "documents": {
                "registrationCertificate": "https://res.cloudinary.com/pashurakshak/image/upload/v1234567890/certificates/registration_cert.png",
                "taxExemptionCertificate": "https://res.cloudinary.com/pashurakshak/image/upload/v1234567890/certificates/tax_cert.png"
            }
        }
        ```
    - In the Tests tab, add:
        ```javascript
        if (pm.response.code === 201) {
            var jsonData = pm.response.json();
            pm.environment.set('NGO_ID', jsonData.data.id);
        }
        ```

### 4. Login as Admin

1. **Create a new request**:
    - Method: `POST`
    - URL: `{{BASE_URL}}/api/admin/login`
    - Headers:
        ```
        Content-Type: application/json
        ```
    - Body: Select `raw` and choose `JSON`
    - Add JSON:
        ```json
        {
            "email": "admin@pashurakshak.org",
            "password": "admin123"
        }
        ```
    - In the Tests tab, add:
        ```javascript
        if (pm.response.code === 200) {
            var jsonData = pm.response.json();
            pm.environment.set('ADMIN_TOKEN', jsonData.data.token);
        }
        ```

### 5. View NGO Registrations

1. **Create a new request**:
    - Method: `GET`
    - URL: `{{BASE_URL}}/api/admin/registrations`
    - Headers:
        ```
        Authorization: Bearer {{ADMIN_TOKEN}}
        ```

### 6. Approve an NGO Registration

1. **Create a new request**:
    - Method: `PUT`
    - URL: `{{BASE_URL}}/api/admin/registrations/{{NGO_ID}}`
    - Headers:
        ```
        Authorization: Bearer {{ADMIN_TOKEN}}
        Content-Type: application/json
        ```
    - Body: Select `raw` and choose `JSON`
    - Add JSON:
        ```json
        {
            "status": "approved"
        }
        ```

### 7. Login as NGO

1. **Create a new request**:
    - Method: `POST`
    - URL: `{{BASE_URL}}/api/ngo/login`
    - Headers:
        ```
        Content-Type: application/json
        ```
    - Body: Select `raw` and choose `JSON`
    - Add JSON:
        ```json
        {
            "email": "ngo@example.com",
            "password": "password123"
        }
        ```
    - In the Tests tab, add:
        ```javascript
        if (pm.response.code === 200) {
            var jsonData = pm.response.json();
            pm.environment.set('NGO_TOKEN', jsonData.data.token);
        }
        ```

### 8. Add a Volunteer

1. **Create a new request**:
    - Method: `POST`
    - URL: `{{BASE_URL}}/api/volunteers/add`
    - Headers:
        ```
        Authorization: Bearer {{NGO_TOKEN}}
        Content-Type: application/json
        ```
    - Body: Select `raw` and choose `JSON`
    - Add JSON:
        ```json
        {
            "name": "Volunteer Name",
            "email": "volunteer@example.com"
        }
        ```
    - In the Tests tab, add:
        ```javascript
        if (pm.response.code === 201) {
            var jsonData = pm.response.json();
            pm.environment.set('VOLUNTEER_ID', jsonData.data._id);
        }
        ```

### 9. Get NGO's Volunteers

1. **Create a new request**:
    - Method: `GET`
    - URL: `{{BASE_URL}}/api/volunteers`
    - Headers:
        ```
        Authorization: Bearer {{NGO_TOKEN}}
        ```

### 10. Login as a Volunteer

1. **Create a new request**:
    - Method: `POST`
    - URL: `{{BASE_URL}}/api/volunteers/login`
    - Headers:
        ```
        Content-Type: application/json
        ```
    - Body: Select `raw` and choose `JSON`
    - Add JSON:
        ```json
        {
            "email": "volunteer@example.com",
            "password": "password_from_email" // This would be the password sent to the volunteer's email
        }
        ```
    - In the Tests tab, add:
        ```javascript
        if (pm.response.code === 200) {
            var jsonData = pm.response.json();
            pm.environment.set('VOLUNTEER_TOKEN', jsonData.data.token);
        }
        ```

### 11. Delete a Volunteer

1. **Create a new request**:
    - Method: `DELETE`
    - URL: `{{BASE_URL}}/api/volunteers/remove/{{VOLUNTEER_ID}}`
    - Headers:
        ```
        Authorization: Bearer {{NGO_TOKEN}}
        ```

## Cloudinary Integration

PashuRakshak uses Cloudinary for storing document images. Follow these steps to integrate with Cloudinary:

### 1. Upload Images to Cloudinary

You can upload images to Cloudinary using one of these methods:

#### Method 1: Use the PashuRakshak Upload API

Send a POST request with the image file to our upload API:

**Single Image Upload:**

```
POST /api/upload/image
```

With multipart/form-data containing:

-   `image`: The image file
-   `category`: Either "certificates" or "rescue"
-   `filename` (optional): Custom filename to use

#### Method 2: Direct Cloudinary Integration

Alternatively, you can upload directly to Cloudinary using:

-   Cloudinary's direct upload API
-   Cloudinary upload widget in your frontend
-   Your existing Cloudinary integration

### 2. Use the Returned URL in API Requests

After a successful upload, you'll receive a URL like this:

```
https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/folder/filename.png
```

Use this URL in the NGO registration request:

```json
{
    "documents": {
        "registrationCertificate": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/folder/certificate.png"
    }
}
```

### 3. Format Requirements

-   Prefer PNG format for better clarity
-   Ensure documents are legible and clearly visible
-   Keep file sizes reasonable for faster loading

## Image Upload APIs

### Upload Single Image

-   **Endpoint**: `POST /api/upload/image`
-   **Description**: Upload single image to Cloudinary with proper folder structure
-   **Content-Type**: `multipart/form-data`
-   **Request Body**:
    ```
    image: [Image File]
    category: "certificates" or "rescue"
    filename: "custom_name" (optional)
    ```
-   **Success Response**: Status 200
    ```json
    {
        "success": true,
        "message": "Image uploaded successfully",
        "data": {
            "url": "https://res.cloudinary.com/dlwtrimk6/image/upload/v1234567890/pashurakshak/certificates/my_certificate.jpg",
            "public_id": "pashurakshak/certificates/my_certificate"
        }
    }
    ```
-   **Error Response**: Status 400/500
    ```json
    {
        "success": false,
        "message": "Error message",
        "error": "Detailed error information"
    }
    ```

## Advanced Features

### Creating a Collection Runner

You can create a Collection Runner in Postman to test the entire workflow:

1. Register NGO
2. Login as Admin
3. Approve NGO
4. Login as NGO
5. Add Volunteer
6. Login as Volunteer
7. View NGO Volunteers
8. Delete Volunteer

## Example cURL Commands

### Register NGO

```bash
curl -X POST http://localhost:5000/api/ngo/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Animal Welfare NGO",
    "email": "ngo@example.com",
    "password": "password123",
    "contactPerson": {
      "name": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com"
    },
    "organizationType": "Animal Welfare",
    "registrationNumber": "AWN12345",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "focusAreas": ["Animal Rescue", "Pet Adoption"],
    "website": "https://example.com",
    "documents": {
      "registrationCertificate": "https://res.cloudinary.com/pashurakshak/image/upload/v1234567890/certificates/registration_cert.png",
      "taxExemptionCertificate": "https://res.cloudinary.com/pashurakshak/image/upload/v1234567890/certificates/tax_cert.png"
    }
  }'
```

### Admin Login

```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{ 
    "email": "admin@pashurakshak.org",
    "password": "admin123"
  }'
```

### Add a Volunteer

```bash
curl -X POST http://localhost:5000/api/volunteers/add \
  -H "Authorization: Bearer YOUR_NGO_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Volunteer Name",
    "email": "volunteer@example.com"
  }'
```

### Get NGO's Volunteers

```bash
curl -X GET http://localhost:5000/api/volunteers \
  -H "Authorization: Bearer YOUR_NGO_TOKEN_HERE"
```

### Volunteer Login

```bash
curl -X POST http://localhost:5000/api/volunteers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "volunteer@example.com",
    "password": "password_from_email"
  }'
```

### Delete a Volunteer

```bash
curl -X DELETE http://localhost:5000/api/volunteers/remove/VOLUNTEER_ID_HERE \
  -H "Authorization: Bearer YOUR_NGO_TOKEN_HERE"
```

## Complete Workflow Example

Here's a step-by-step workflow showing how the different APIs work together:

### 1. NGO Registration Process

1. **Upload Documents to Cloudinary** (performed on frontend/client side)
2. **Register as an NGO**:
    ```
    POST /api/ngo/register
    ```
3. **Check Registration Status**:
    ```
    GET /api/ngo/status/:id
    ```
4. **Admin Logs In**:
    ```
    POST /api/admin/login
    ```
5. **Admin Reviews Registrations**:
    ```
    GET /api/admin/registrations
    ```
6. **Admin Approves NGO**:
    ```
    PUT /api/admin/registrations/:id
    ```
7. **NGO Logs In** (with credentials provided via email):
    ```
    POST /api/ngo/login
    ```
8. **NGO Views Profile**:
    ```
    GET /api/ngo/profile
    ```

### 2. Volunteer Management Process

1. **NGO Adds a Volunteer**:
    ```
    POST /api/volunteers/add
    ```
2. **NGO Views All Volunteers**:
    ```
    GET /api/volunteers
    ```
3. **Volunteer Logs In** (with credentials provided via email):
    ```
    POST /api/volunteers/login
    ```
4. **NGO Removes a Volunteer** (if needed):
    ```
    DELETE /api/volunteers/remove/:volunteerId
    ```

### 3. User Registration Process

1. **Register as a User**:
    ```
    POST /api/auth/register
    ```
2. **User Logs In**:
    ```
    POST /api/auth/login
    ```

This API documentation provides a comprehensive guide to all the endpoints in the PashuRakshak system.
