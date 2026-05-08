# Committee Portal - Full Stack Application

A comprehensive full-stack web application designed to help core committee members manage venues, events, bookings, and approval workflows efficiently.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Entity Relationships](#entity-relationships)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Data Flow](#data-flow)
8. [Authentication & Security](#authentication--security)
9. [Why This Tech Stack](#why-this-tech-stack)
10. [Setup & Installation](#setup--installation)
11. [Running the Application](#running-the-application)

---

## Project Overview

**Committee Portal** is a web-based management system that allows:
- **Committees**: To create events, book venues, manage permissions, and track approvals
- **Approvers**: To review and approve events, permissions, and bookings with digital signatures
- **Administrators**: To manage committee members, approvers, and venues

The system streamlines the approval workflow for event management, making it easy for committees to request resources and for approvers to make informed decisions.

### Key Features:
- ✅ User authentication (Committee & Approver roles)
- ✅ Event creation and management
- ✅ Venue booking system
- ✅ Permission application workflow
- ✅ Approval tracking with digital signatures
- ✅ Role-based access control (RBAC)
- ✅ RESTful API with Swagger documentation
- ✅ JWT-based token authentication

---

## Tech Stack

### **Frontend**
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Angular** | 17.0.0 | SPA framework for dynamic UI |
| **TypeScript** | 5.2.0 | Type-safe JavaScript |
| **Angular Material** | 17.0.0 | Pre-built UI components |
| **RxJS** | 7.8.0 | Reactive programming for async operations |
| **Angular Routing** | 17.0.0 | Client-side navigation |
| **Angular Forms** | 17.0.0 | Form handling & validation |
| **Angular HTTP Client** | 17.0.0 | HTTP requests to backend API |

### **Backend**
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Spring Boot** | 3.5.5 | Java framework for REST APIs |
| **Spring Web** | 3.5.5 | REST API support |
| **Spring Data JPA** | 3.5.5 | ORM (Object-Relational Mapping) |
| **Hibernate** | Latest | JPA implementation |
| **PostgreSQL** | Latest | Relational database |
| **Spring Security** | 3.5.5 | Authentication & authorization |
| **JWT (JJWT)** | 0.12.3 | JSON Web Tokens for stateless auth |
| **Springdoc OpenAPI** | 2.8.13 | Swagger UI & API documentation |
| **Spring Validation** | 3.5.5 | Data validation annotations |

### **Database**
| Technology | Purpose |
|-----------|---------|
| **PostgreSQL** | Primary relational database (hosted on Neon) |
| **HikariCP** | Connection pooling for optimized DB access |

### **Build & Deployment**
| Tool | Purpose |
|-----|---------|
| **Maven** | Java build automation |
| **Node.js & NPM** | Frontend package management |
| **Angular CLI** | Angular build tool |

---

## Project Structure

```
committeeportal/
│
├── frontend/                          # Angular Single Page Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/           # Reusable UI components
│   │   │   │   ├── auth/             # Authentication component
│   │   │   │   ├── login/            # Login form component
│   │   │   │   ├── register/         # Registration component
│   │   │   │   ├── landing/          # Landing page
│   │   │   │   ├── committee-dashboard/  # Committee member dashboard
│   │   │   │   └── approver-dashboard/   # Approver dashboard
│   │   │   ├── services/             # HTTP services
│   │   │   │   ├── auth.service.ts   # Authentication API calls
│   │   │   │   └── jwt.interceptor.ts # JWT token injection
│   │   │   ├── app.module.ts         # Root module
│   │   │   ├── app-routing.module.ts # Route configuration
│   │   │   └── app.component.*       # Root component
│   │   ├── assets/                   # Static files (images, etc.)
│   │   ├── styles.css                # Global styles
│   │   └── main.ts                   # Entry point
│   ├── angular.json                  # Angular CLI config
│   ├── package.json                  # NPM dependencies
│   ├── tsconfig.json                 # TypeScript config
│   └── proxy.conf.json               # API proxy config (dev)
│
├── src/                               # Spring Boot Backend
│   ├── main/
│   │   ├── java/com/example/committeeportal/
│   │   │   ├── CommitteeportalApplication.java  # Spring Boot main class
│   │   │   │
│   │   │   ├── Entity/                # Database entities (JPA)
│   │   │   │   ├── Committee.java     # Committee member entity
│   │   │   │   ├── Event.java         # Event entity
│   │   │   │   ├── Booking.java       # Venue booking entity
│   │   │   │   ├── Approval.java      # Approval workflow entity
│   │   │   │   ├── Approver.java      # Approver entity
│   │   │   │   ├── Venue.java         # Venue entity
│   │   │   │   └── PermissionApplication.java  # Permission request entity
│   │   │   │
│   │   │   ├── Repository/            # Data access layer (JPA Repositories)
│   │   │   │   ├── CommitteeRepository.java
│   │   │   │   ├── EventRepository.java
│   │   │   │   ├── BookingRepository.java
│   │   │   │   ├── ApprovalRepository.java
│   │   │   │   ├── ApproverRepository.java
│   │   │   │   ├── VenueRepository.java
│   │   │   │   └── PermissionRepository.java
│   │   │   │
│   │   │   ├── Controller/            # REST API endpoints
│   │   │   │   ├── EventController.java       # /events endpoints
│   │   │   │   ├── BookingController.java     # /bookings endpoints
│   │   │   │   ├── ApprovalController.java    # /approvals endpoints
│   │   │   │   ├── CommitteeController.java   # /committees endpoints
│   │   │   │   ├── ApproverController.java    # /approvers endpoints
│   │   │   │   ├── VenueController.java       # /venues endpoints
│   │   │   │   ├── PermissionController.java  # /permissions endpoints
│   │   │   │   └── AuthController.java        # /api/auth endpoints
│   │   │   │
│   │   │   ├── Service/               # Business logic layer
│   │   │   │   ├── AuthService.java   # Authentication logic
│   │   │   │   └── DataMigrationService.java  # Data utilities
│   │   │   │
│   │   │   ├── DTO/                   # Data Transfer Objects
│   │   │   │   └── AuthValidationResponse.java
│   │   │   │
│   │   │   ├── Security/              # Security configuration
│   │   │   │   ├── JwtUtil.java       # JWT token generation & validation
│   │   │   │   └── SecurityConfig.java # Spring Security setup
│   │   │   │
│   │   │   ├── ResponseBean/          # API response wrappers
│   │   │   │   └── ErrorResponse.java
│   │   │   │
│   │   │   └── Config/                # Application configuration
│   │   │       ├── CorsConfig.java    # CORS configuration
│   │   │       └── Other configs
│   │   │
│   │   └── resources/
│   │       └── application.properties # Spring Boot configuration
│   │
│   └── test/                          # Unit tests
│
├── uploads/
│   └── documents/                     # File upload directory
│
├── logs/                              # Application logs
│
├── pom.xml                            # Maven configuration
├── mvnw / mvnw.cmd                    # Maven wrapper (Windows & Linux)
└── README.md                          # This file

```

---

## Entity Relationships

### **Entity Diagram**

```
┌─────────────────┐
│   COMMITTEE     │
│   (Members)     │
├─────────────────┤
│ id (PK)         │
│ name            │
│ email           │
│ password        │
│ head_of_committee
└────────┬────────┘
         │ 1:N
         ├──────→ ┌──────────────┐
                  │    EVENT     │
                  ├──────────────┤
                  │ event_id(PK) │
                  │ event_name   │
                  │ event_date   │
                  │ status       │
                  └────────┬─────┘
                           │ 1:N
                           └──────→ ┌──────────────┐
                                    │   BOOKING    │
                                    ├──────────────┤
                                    │ booking_id   │
                                    │ venue_id(FK) │
                                    │ event_id(FK) │
                                    └──────────────┘

┌──────────────────┐
│    APPROVER      │
│  (Admin roles)   │
├──────────────────┤
│ approver_id(PK)  │
│ name             │
│ role             │
│ email            │
│ password         │
│ signature        │
└────────┬─────────┘
         │ 1:N
         └──────→ ┌──────────────────┐
                  │    APPROVAL      │
                  ├──────────────────┤
                  │ approval_id      │
                  │ approver_id(FK)  │
                  │ event_id(FK)     │
                  │ status           │
                  │ signed_date      │
                  └──────────────────┘

┌──────────────────────────┐
│   PERMISSION_APPLICATION │
├──────────────────────────┤
│ permission_id(PK)        │
│ committee_id(FK)         │
│ permission_type          │
│ status                   │
│ approval_id(FK)          │
└──────────────────────────┘

┌──────────────┐
│    VENUE     │
├──────────────┤
│ venue_id(PK) │
│ venue_name   │
│ capacity     │
│ location     │
└──────────────┘
```

### **Entity Descriptions**

#### **1. Committee Entity**
Represents a committee member/organization requesting resources.
- **Fields**: id, name, head_of_committee, email, password, contact_email
- **Relationships**: 1:N with Events (one committee creates many events)
- **Purpose**: Users who create events and request approvals

#### **2. Event Entity**
Represents an event organized by a committee.
- **Fields**: eventId, eventName, eventDate, startTime, endTime, expectedParticipants, description, createdDate, status
- **Relationships**: 
  - N:1 with Committee (belongs to one committee)
  - 1:N with Bookings (has many bookings for different venues)
  - 1:N with Approvals (has many approvals from different approvers)
- **Purpose**: Core entity for tracking events

#### **3. Booking Entity**
Represents venue booking for an event.
- **Fields**: bookingId, venueId, eventId, bookingDate, status
- **Relationships**: 
  - N:1 with Event (belongs to one event)
  - N:1 with Venue (books one venue)
  - 1:1 with Approval (linked to approval workflow)
- **Purpose**: Tracks which venues are booked for which events

#### **4. Approver Entity**
Represents an admin/authority who approves events and permissions.
- **Fields**: approverId, name, role, email, password, digitalSignature
- **Relationships**: 1:N with Approvals (one approver gives many approvals)
- **Purpose**: Users responsible for reviewing and signing off on events

#### **5. Approval Entity**
Represents the approval status of an event or booking.
- **Fields**: approvalId, approverId, eventId, status, approvedDate, remarks, digitalSignature
- **Relationships**: 
  - N:1 with Event (approves one event)
  - N:1 with Approver (given by one approver)
- **Purpose**: Audit trail of approval decisions

#### **6. PermissionApplication Entity**
Represents a request for special permission.
- **Fields**: permissionId, committeeId, permissionType, description, status, approvalId
- **Relationships**: 
  - N:1 with Committee (committee requests permission)
  - 1:1 with Approval (linked to approval)
- **Purpose**: Handles permission requests requiring approval

#### **7. Venue Entity**
Represents available venues for booking.
- **Fields**: venueId, venueName, capacity, location, availabilityStatus
- **Relationships**: 1:N with Bookings (one venue has many bookings)
- **Purpose**: Repository of available venues

---

## Backend Architecture

### **Layered Architecture Pattern**

The backend follows a **3-Tier Layered Architecture**:

```
┌─────────────────────────────────────────┐
│         PRESENTATION LAYER              │
│      (REST Controllers)                 │
│ - EventController                       │
│ - BookingController                     │
│ - ApprovalController                    │
│ - AuthController                        │
└──────────────────┬──────────────────────┘
                   │ (HTTP/REST)
                   ↓
┌─────────────────────────────────────────┐
│        BUSINESS LOGIC LAYER             │
│       (Services)                        │
│ - AuthService                           │
│ - DataMigrationService                  │
│ - [Other Services]                      │
└──────────────────┬──────────────────────┘
                   │ (Method calls)
                   ↓
┌─────────────────────────────────────────┐
│      DATA ACCESS LAYER                  │
│    (Repositories)                       │
│ - EventRepository (JPA)                 │
│ - BookingRepository                     │
│ - ApprovalRepository                    │
│ - CommitteeRepository                   │
│ - ApproverRepository                    │
│ - VenueRepository                       │
│ - PermissionRepository                  │
└──────────────────┬──────────────────────┘
                   │ (ORM - Hibernate)
                   ↓
┌─────────────────────────────────────────┐
│       DATABASE LAYER                    │
│    (PostgreSQL - Neon)                  │
│ Tables: committee, event, booking,      │
│         approval, approver, venue,      │
│         permission_application          │
└─────────────────────────────────────────┘
```

### **How Each Entity Works in Backend**

#### **Event Management Workflow**

1. **Committee Creates Event** (EventController)
   ```
   POST /events
   Request: { eventName, eventDate, startTime, endTime, expectedParticipants, description, committeeId }
   ↓
   EventController.createEvent()
   ↓
   EventService.save() [if exists]
   ↓
   EventRepository.save() (JPA)
   ↓
   Hibernate generates SQL INSERT
   ↓
   PostgreSQL stores event
   ↓
   Returns: Event object with generated eventId
   ```

2. **Get Event Details**
   ```
   GET /events/{eventId}
   ↓
   EventController.getEventById()
   ↓
   EventRepository.findById(eventId)
   ↓
   Hibernate generates SELECT query
   ↓
   PostgreSQL retrieves event with bookings and approvals
   ↓
   Returns: Event object with related Bookings and Approvals
   ```

#### **Booking Management Workflow**

1. **Book a Venue**
   ```
   POST /bookings
   Request: { venueId, eventId, bookingDate }
   ↓
   BookingController.createBooking()
   ↓
   Validates: Venue availability, Event exists, Date conflicts
   ↓
   BookingRepository.save()
   ↓
   Creates entry in booking table
   ↓
   Triggers approval workflow
   ```

2. **Get Available Venues**
   ```
   GET /venues/available?date={date}
   ↓
   VenueController.getAvailableVenues()
   ↓
   VenueRepository.findAvailableVenues(date)
   ↓
   Custom JPA query: SELECT venues NOT IN bookings on that date
   ↓
   Returns: List of available venues
   ```

#### **Approval Workflow**

1. **Submit for Approval**
   ```
   Event Status: PENDING_APPROVAL
   ↓
   ApprovalController.createApproval()
   ↓
   Request: { eventId, approverId, remarks }
   ↓
   ApprovalRepository.save()
   ↓
   Generates approval record with status=PENDING
   ↓
   Notifies approver (via email or dashboard)
   ```

2. **Approver Reviews & Signs**
   ```
   GET /approvals/pending (for approver dashboard)
   ↓
   Shows all pending approvals for this approver
   ↓
   Approver reviews event details, bookings, permissions
   ↓
   PATCH /approvals/{approvalId}
   Request: { status: "APPROVED", remarks, digitalSignature }
   ↓
   Updates approval status and signature
   ↓
   Updates event status to APPROVED
   ↓
   Bookings auto-confirmed
   ```

#### **Permission Application Workflow**

1. **Request Permission**
   ```
   POST /permissions
   Request: { committeeId, permissionType, description }
   ↓
   PermissionController.createPermission()
   ↓
   PermissionRepository.save()
   ↓
   Creates permission_application entry (status=PENDING)
   ```

2. **Get Permission Status**
   ```
   GET /permissions/{permissionId}
   ↓
   Retrieves permission with linked approval
   ↓
   Shows approval status from Approver
   ```

### **Security Layer**

**JWT Authentication Flow:**
```
1. Login Request (Committee/Approver credentials)
   POST /auth/login
   ↓
2. Verify credentials against database
   AuthService.authenticate()
   ↓
3. Generate JWT Token
   JwtUtil.generateToken(userId, email, role)
   Token contains: userId, email, role, issuedAt, expiresAt
   ↓
4. Return token to frontend
   Response: { token, userId, email, role }
   ↓
5. Frontend stores token in localStorage
   ↓
6. Every API request includes token:
   Header: Authorization: Bearer {token}
   ↓
7. Backend validates token
   JwtUtil.validateToken(token)
   ↓
8. Extract user info and proceed
```

---

## Frontend Architecture

### **Component Structure**

```
App (Root Component)
│
├── Routing Module (app-routing.module.ts)
│
├── Landing Component
│   └── Navigation & introduction
│
├── Auth Module
│   ├── Login Component
│   │   └── Handles Committee & Approver login
│   ├── Register Component
│   │   └── Role-based registration
│   └── Auth Service (calls backend APIs)
│
├── Committee Dashboard Component
│   ├── Create Event
│   ├── View Events
│   ├── Book Venues
│   ├── Request Permissions
│   └── Track Approvals
│
└── Approver Dashboard Component
    ├── View Pending Approvals
    ├── Review Event Details
    ├── Approve/Reject Events
    ├── Digital Signature
    └── View Approval History
```

### **Service Layer (Services)**

#### **AuthService (auth.service.ts)**
Handles all authentication-related API calls:
```typescript
- login(credentials): Observable<LoginResponse>
  └─ POST /committees/login or /approvers/login
  
- register(data): Observable<void>
  └─ POST /committees/register or /approvers/register
  
- validateToken(): Observable<boolean>
  └─ GET /api/auth/validate
  └─ Verifies JWT token is still valid
  
- logout()
  └─ Clears token from localStorage
  
- resetPassword(email, newPassword): Observable<void>
  └─ POST /reset-password
```

#### **JWT Interceptor (jwt.interceptor.ts)**
Automatically adds JWT token to all HTTP requests:
```typescript
intercept(request, next):
  - Checks if token exists in localStorage
  - Adds Authorization header: Bearer {token}
  - Forwards request with token
  - Catches 401 Unauthorized → redirects to login
```

### **Data Flow in Frontend**

```
User Action (click, form submit)
    ↓
Component Event Handler
    ↓
Calls Service Method
    ↓
Service makes HTTP request (with JWT)
    ↓
JwtInterceptor adds Authorization header
    ↓
Request sent to Backend API
    ↓
Backend processes & returns response
    ↓
Service receives response
    ↓
Updates Component state (RxJS Observable)
    ↓
Component template re-renders (Angular Change Detection)
    ↓
User sees updated UI
```

### **Routing Configuration**

```
Routes:
├── /landing          → Landing Component
├── /login           → Login Component
├── /register        → Register Component
├── /committee       → Committee Dashboard (Protected)
│   ├── /events      → Manage Events
│   ├── /bookings    → Manage Bookings
│   └── /permissions → Request Permissions
├── /approver        → Approver Dashboard (Protected)
│   ├── /pending     → Pending Approvals
│   ├── /approved    → Approval History
│   └── /permissions → Permission Approvals
└── **              → 404 Not Found
```

---

## Data Flow

### **Complete Event Management Data Flow**

```
┌─────────────────────────────────────────────────────────────────────┐
│                      COMMITTEE CREATES EVENT                        │
└─────────────────────────────────────────────────────────────────────┘

1. FRONTEND (Committee Dashboard)
   ├─ User fills: Event name, date, time, participants, description
   └─ Clicks: "Create Event"
   
   ↓
   
2. SERVICE CALL
   └─ this.eventService.createEvent(eventData)
   
   ↓
   
3. HTTP REQUEST
   ├─ URL: POST http://localhost:8080/events
   ├─ Headers: Authorization: Bearer {JWT_TOKEN}
   ├─ Body: { eventName, eventDate, startTime, endTime, expectedParticipants, description, committeeId }
   
   ↓ [JwtInterceptor adds Authorization header]
   
4. BACKEND CONTROLLER
   ├─ EventController.createEvent(@RequestBody Event event)
   ├─ Validates input (using @Valid annotations)
   ├─ Checks: user is authenticated (JWT), has COMMITTEE role
   
   ↓
   
5. BUSINESS LOGIC
   ├─ EventService logic (if exists)
   ├─ Generate createdDate = today
   ├─ Set status = "PENDING_APPROVAL"
   
   ↓
   
6. PERSISTENCE
   ├─ EventRepository.save(event)
   ├─ Hibernate generates SQL:
   │  INSERT INTO event (event_name, event_date, start_time, end_time, expected_participants, description, created_date, status, committee_id)
   │  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
   │
   └─ PostgreSQL executes insert, returns generated eventId
   
   ↓
   
7. BACKEND RESPONSE
   ├─ EventController returns: ResponseEntity.ok(savedEvent)
   ├─ Status: 200 OK
   ├─ Body: { eventId, eventName, eventDate, status, ...}
   
   ↓
   
8. FRONTEND UPDATES
   ├─ Service receives response in Observable
   ├─ Component receives event data
   ├─ Updates component property: this.events.push(newEvent)
   ├─ Angular triggers Change Detection
   ├─ Template re-renders: shows new event in list
   └─ User sees: "Event created successfully!"

┌─────────────────────────────────────────────────────────────────────┐
│                    COMMITTEE BOOKS A VENUE                          │
└─────────────────────────────────────────────────────────────────────┘

1. FRONTEND (Committee Dashboard)
   ├─ User selects: Event & Venue
   ├─ Chooses: Booking date
   └─ Clicks: "Book Venue"
   
   ↓
   
2. HTTP REQUEST
   ├─ URL: POST http://localhost:8080/bookings
   ├─ Headers: Authorization: Bearer {JWT_TOKEN}
   ├─ Body: { venueId, eventId, bookingDate }
   
   ↓
   
3. BACKEND PROCESSING
   ├─ BookingController.createBooking()
   ├─ Validates:
   │  ├─ Venue exists
   │  ├─ Event exists & belongs to committee
   │  ├─ No conflicting bookings on that date
   │  └─ Venue capacity >= expected participants
   │
   ├─ BookingRepository.save()
   ├─ Database records: { venueId, eventId, bookingDate, status: PENDING }
   │
   └─ Creates Approval record (auto-linked)
      └─ ApprovalRepository.save()
         └─ Database: { eventId, approverId: null, status: PENDING, signingRequired: true }
   
   ↓
   
4. RESPONSE
   └─ Returns: Booking object with status PENDING

5. FRONTEND UPDATE
   ├─ Booking added to list
   ├─ Shows: "Booking created, awaiting approval"
   ├─ Booking appears in pending bookings view
   └─ Event status updates to PENDING_APPROVAL

┌─────────────────────────────────────────────────────────────────────┐
│                   APPROVER REVIEWS & APPROVES                       │
└─────────────────────────────────────────────────────────────────────┘

1. FRONTEND (Approver Dashboard)
   ├─ Page loads: GET /approvals/pending
   ├─ Calls: ApprovalService.getPendingApprovals()
   │
   ↓ HTTP GET request with JWT
   │
   ├─ Backend ApprovalController.getPendingApprovals()
   ├─ Repository: SELECT * FROM approval WHERE approver_id IS NULL OR status = 'PENDING'
   ├─ Returns: List of pending approvals with event details
   │
   ├─ Frontend receives & displays:
   │  ├─ Event name, date, venue, participants
   │  ├─ Committee details
   │  ├─ Booking details
   │  └─ [Approve] [Reject] buttons
   └─ Approver reviews information

2. APPROVER ACTION
   ├─ Approver clicks: [Approve]
   ├─ Signs digitally (signature captured)
   ├─ Adds remarks (optional)
   
   ↓
   
3. HTTP UPDATE REQUEST
   ├─ URL: PATCH http://localhost:8080/approvals/{approvalId}
   ├─ Headers: Authorization: Bearer {APPROVER_JWT}
   ├─ Body: { status: "APPROVED", remarks: "...", digitalSignature: "..." }
   
   ↓
   
4. BACKEND PROCESSING
   ├─ ApprovalController.updateApproval()
   ├─ Validates approver authorization
   ├─ Updates approval record:
   │  └─ UPDATE approval SET status='APPROVED', signed_date=now(), digital_signature='...', remarks='...'
   │
   ├─ Updates linked event:
   │  └─ UPDATE event SET status='APPROVED'
   │
   ├─ Confirms booking:
   │  └─ UPDATE booking SET status='CONFIRMED'
   │
   └─ Creates audit log entry

5. RESPONSE & NOTIFICATION
   ├─ Returns: Updated approval object
   ├─ Frontend updates state
   ├─ Approver sees: "Approval recorded successfully"
   └─ Optional: Email notification to committee

6. COMMITTEE SEES UPDATE
   ├─ Frontend polls or WebSocket receives update
   ├─ Event status changes to "APPROVED"
   ├─ Booking status changes to "CONFIRMED"
   ├─ Committee receives notification
   └─ Can proceed with event

┌─────────────────────────────────────────────────────────────────────┐
│                    PERMISSION REQUEST FLOW                          │
└─────────────────────────────────────────────────────────────────────┘

1. Committee requests special permission
   └─ POST /permissions { committeeId, permissionType, description }
   
2. Backend creates PermissionApplication record
   └─ Status: PENDING, linked to committee
   
3. Approver sees in dashboard
   └─ GET /permissions/pending
   
4. Approver approves with signature
   └─ PATCH /permissions/{permissionId} { status: APPROVED, signature }
   
5. Committee notified
   └─ Permission granted, can proceed
```

---

## Authentication & Security

### **JWT Token Structure**

```json
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "userId": 1,
  "email": "committee@example.com",
  "role": "COMMITTEE",
  "iat": 1704067200,
  "exp": 1704153600
}

Signature: HMAC-SHA256(base64(header) + "." + base64(payload), secret_key)
```

### **Security Features**

1. **JWT Tokens**
   - Stateless authentication
   - 24-hour expiration
   - Secret key: `CommittePortalSecretKey...` (in application.properties)
   - Signed with JJWT library

2. **Spring Security**
   - Role-based access control (Committee vs Approver)
   - Password stored securely (should use BCrypt in production)
   - CORS configured for frontend origin

3. **HTTPS (Production)**
   - Enable SSL/TLS certificates
   - Redirect HTTP to HTTPS

4. **Database**
   - PostgreSQL with connection encryption
   - Credentials in environment variables (not in code)

---

## Why This Tech Stack

### **Frontend: Angular 17**

**Why Angular?**
- ✅ **Enterprise-Grade Framework**: Stable, well-documented, backed by Google
- ✅ **Type Safety**: TypeScript ensures compile-time error detection
- ✅ **Component-Based Architecture**: Reusable, maintainable UI components
- ✅ **Built-in Services**: Routing, HTTP client, Forms, Animations
- ✅ **Material UI**: Pre-built professional components for quick development
- ✅ **RxJS**: Powerful async handling for real-time data
- ✅ **Developer Tools**: Angular DevTools, Excellent IDE support
- ✅ **Large Community**: Extensive resources, libraries, and support

**Alternatives Considered:**
- React: More lightweight but requires more setup, no built-in routing
- Vue: Easier to learn but smaller ecosystem
- Angular wins for enterprise-scale applications

### **Backend: Spring Boot 3.5.5**

**Why Spring Boot?**
- ✅ **Convention over Configuration**: Reduces boilerplate, faster development
- ✅ **Microservices Ready**: Perfect for scalable applications
- ✅ **Dependency Injection**: Loose coupling, testable code
- ✅ **Spring Ecosystem**: Spring Security, JPA, Web, Validation, etc.
- ✅ **Built-in Server**: Tomcat embedded, no separate deployment needed
- ✅ **Security Framework**: Industry-standard security patterns
- ✅ **Performance**: Fast startup, low memory footprint
- ✅ **Java 17**: Latest JVM features, better performance

**Alternatives Considered:**
- Node.js: Good for I/O operations but not ideal for heavy business logic
- Django: Python-based, but Java is more performant for this use case
- Spring Boot wins for robust, scalable enterprise applications

### **Database: PostgreSQL**

**Why PostgreSQL?**
- ✅ **ACID Compliance**: Data integrity guaranteed
- ✅ **Relational Model**: Perfect for structured data (committees, events, approvals)
- ✅ **Complex Queries**: JOIN operations for multiple entities
- ✅ **Neon Hosting**: Serverless PostgreSQL with auto-scaling
- ✅ **Open Source**: Free, no licensing costs
- ✅ **JSON Support**: Can store semi-structured data if needed
- ✅ **Triggers & Functions**: Complex workflows (approvals, notifications)

**Alternatives Considered:**
- MongoDB: Document DB, not ideal for approval workflows requiring ACID
- MySQL: Simpler but less robust than PostgreSQL
- PostgreSQL wins for complex relational data and reliability

### **Stack Combination Benefits**

1. **Full TypeScript Stack** (Angular + Node-like consistency)
   - Consistent language across frontend
   - Easy to share types (DTOs)

2. **Separation of Concerns**
   - Clean frontend/backend separation
   - Angular handles UI rendering
   - Spring handles business logic & data

3. **Scalability**
   - Frontend: Static assets on CDN
   - Backend: Horizontal scaling with load balancing
   - Database: Connection pooling (HikariCP) for efficiency

4. **Security**
   - JWT: Stateless, no session storage needed
   - Spring Security: Industry-standard practices
   - CORS: Controlled cross-origin access

5. **Developer Experience**
   - Angular CLI: Easy project setup
   - Spring Boot: Auto-configuration
   - Hot reload: Rapid development cycle
   - Swagger UI: Built-in API documentation

6. **Performance**
   - Java: Fast execution, JIT compilation
   - PostgreSQL: Optimized queries, indexing
   - Angular: Client-side rendering, reduced server load

---

## Setup & Installation

### **Prerequisites**

- **Java 17+** → [Download](https://www.oracle.com/java/technologies/downloads/)
- **Node.js 18+** → [Download](https://nodejs.org/)
- **PostgreSQL 12+** → [Download](https://www.postgresql.org/)
- **Git** → [Download](https://git-scm.com/)
- **Maven 3.8+** (or use `mvnw` wrapper)
- **VS Code** or any IDE (IntelliJ IDEA recommended for Java)

### **Database Setup**

1. **Create PostgreSQL Database**
   ```bash
   createdb committeeportal
   ```

2. **Update connection in `application.properties`**
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/committeeportal
   spring.datasource.username=postgres
   spring.datasource.password=your_password
   ```

3. **Hibernate will auto-create tables** (ddl-auto=update)

### **Backend Setup**

1. **Navigate to project root**
   ```bash
   cd d:\projects\FSD\committeeportal
   ```

2. **Build project**
   ```bash
   mvnw clean package
   ```

3. **Or run directly**
   ```bash
   mvnw spring-boot:run
   ```

### **Frontend Setup**

1. **Navigate to frontend folder**
   ```bash
   cd d:\projects\FSD\committeeportal\frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   - Frontend will be available at `http://localhost:4200`
   - Proxy redirects API calls to `http://localhost:8080`

---

## Running the Application

### **Start Backend**
```bash
cd d:\projects\FSD\committeeportal
mvnw spring-boot:run
```
- Backend starts on `http://localhost:8080`
- Swagger UI available at `http://localhost:8080/swagger-ui.html`

### **Start Frontend**
```bash
cd d:\projects\FSD\committeeportal\frontend
npm start
```
- Frontend starts on `http://localhost:4200`
- Automatically opens in browser

### **Access the Application**

| Role | URL | Email | Password |
|------|-----|-------|----------|
| Committee | http://localhost:4200/login | committee@example.com | pass123 |
| Approver | http://localhost:4200/login | approver@example.com | pass123 |

### **API Documentation**

Swagger UI available at: `http://localhost:8080/swagger-ui.html`

### **View Logs**

Backend logs: `logs/committeeportal.log`

---

## Summary

**Committee Portal** is a production-ready full-stack application that demonstrates:
- ✅ Modern web application architecture
- ✅ Role-based access control
- ✅ Complex approval workflows
- ✅ RESTful API design
- ✅ JWT authentication
- ✅ Component-based frontend
- ✅ Layered backend architecture
- ✅ PostgreSQL integration
- ✅ Professional UI with Angular Material

This tech stack provides **scalability, maintainability, security, and performance** for enterprise-grade applications.

---

## Contributing

1. Create a feature branch
2. Commit changes
3. Push to main
4. Create Pull Request

## License

MIT License - Feel free to use this project.
