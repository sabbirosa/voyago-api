# Voyago API

Voyago API is the backend service for the Voyago platform, a marketplace that connects travelers with local guides for authentic travel experiences. The API provides a RESTful interface built with Express.js, Prisma ORM, and PostgreSQL, supporting authentication, booking management, payment processing, and comprehensive admin functionality.

## Table of Contents

- [Overview](#overview)
- [Live Deployment](#live-deployment)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Live Deployment

The Voyago API is deployed and available at:

- **Production API**: [https://voyago-api.vercel.app](https://voyago-api.vercel.app)
- **API Base URL**: [https://voyago-api.vercel.app/api/v1](https://voyago-api.vercel.app/api/v1)
- **Health Check**: [https://voyago-api.vercel.app/health](https://voyago-api.vercel.app/health)

## Overview

Voyago API serves as the core backend infrastructure for the Voyago platform, enabling:

- Multi-role user management (Tourist, Guide, Admin)
- Tour listing creation and management
- Booking request and approval workflow
- Secure payment processing via Stripe
- Real-time messaging between users
- Review and rating system
- Availability calendar management
- Notification system
- Admin dashboard functionality
- File upload and storage via AWS S3/R2

## Technology Stack

### Core Technologies

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.x
- **ORM**: Prisma 7.x
- **Database**: PostgreSQL
- **Cache**: Redis (via ioredis)

### Key Dependencies

- **Authentication**: JWT (jsonwebtoken), bcryptjs
- **Payment Processing**: Stripe
- **File Storage**: AWS SDK (S3-compatible, including Cloudflare R2)
- **Email Service**: Resend
- **Validation**: Zod
- **Security**: Helmet, express-rate-limit, CORS
- **Logging**: Morgan
- **HTTP Utilities**: http-status

### Development Tools

- **TypeScript**: Type checking and compilation
- **ts-node-dev**: Development server with hot reload
- **ESLint**: Code linting

## Architecture

The API follows a modular MVC-inspired architecture, organized by feature domains:

```
src/
├── app/
│   ├── config/          # Configuration files (env, database, redis)
│   ├── constants.ts     # Application constants
│   ├── errorHelpers/   # Error handling utilities
│   ├── helpers/        # Shared helper functions
│   ├── interfaces/     # TypeScript interfaces
│   ├── middlewares/    # Express middlewares
│   ├── modules/        # Feature modules (auth, booking, etc.)
│   ├── routes/         # Route definitions
│   ├── utils/          # Utility functions
│   ├── templates/      # Email templates
│   ├── app.ts          # Express app configuration
│   └── env.ts          # Environment variable validation
├── server.ts            # Server entry point
└── api/                 # Vercel serverless entry point
```

Each module follows a consistent structure:

- `*.controller.ts` - Request handlers
- `*.service.ts` - Business logic
- `*.route.ts` - Route definitions
- `*.validation.ts` - Request validation schemas
- `*.interface.ts` - TypeScript interfaces

## Features

### Authentication & Authorization

- JWT-based authentication with access and refresh tokens
- Role-based access control (RBAC) for Tourist, Guide, and Admin roles
- Email verification via OTP
- Password hashing with bcrypt
- Rate limiting on authentication endpoints

### User Management

- User registration and login
- Profile management (UserProfile and GuideProfile)
- Guide verification workflow
- User approval and banning system
- Badge system for guides (Super Guide, Top Rated, Verified, etc.)

### Listing Management

- CRUD operations for tour listings
- Multiple categories (Food, Art, Adventure, Culture, Photography, etc.)
- Image upload and management
- Listing status workflow (Draft, Active, Inactive, Blocked)
- Search and filtering capabilities
- Rating and review aggregation

### Booking System

- Booking request creation
- Guide approval/decline workflow
- Booking status management (Pending, Accepted, Declined, Paid, Completed, Cancelled)
- Group size management
- Platform fee calculation

### Payment Processing

- Stripe integration for secure payments
- Payment intent creation and management
- Webhook handling for payment events
- Refund processing
- Payment status tracking

### Messaging

- Real-time messaging between tourists and guides
- Message threading by booking
- Read receipt tracking
- Message history

### Reviews & Ratings

- Post-booking review submission
- Rating system (1-5 stars)
- Review aggregation for listings
- Review moderation

### Availability Management

- Calendar-based availability slots
- Recurring and one-time availability
- Time slot management
- Availability conflict detection

### Notifications

- In-app notification system
- Email notifications via Resend
- Notification types: booking updates, payment events, reviews, etc.
- Read/unread status tracking

### Admin Features

- User management (approval, banning, role assignment)
- Listing moderation
- Booking oversight
- Payment analytics
- System statistics

### File Upload

- AWS S3/R2 integration for file storage
- Image upload with validation
- Public URL generation
- File type and size restrictions

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** or **bun** package manager
- **PostgreSQL** (v12 or higher)
- **Redis** (v6 or higher) - Optional but recommended for production
- **Git**

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd voyago-api
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
bun install
```

3. Set up environment variables (see [Configuration](#configuration))

4. Set up the database (see [Database Setup](#database-setup))

5. Generate Prisma client:

```bash
npx prisma generate
```

## Configuration

Create a `.env` file in the root directory with the following variables:

### Required Variables

```env
# Application
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/voyago

# JWT Secrets
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@voyago.com

# File Storage (AWS S3 or Cloudflare R2)
R2_ENDPOINT=https://your-endpoint.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=voyago-uploads
R2_PUBLIC_URL=https://your-public-url.com

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# OTP Configuration
OTP_EXPIRES_IN=600
```

### Environment Variable Descriptions

- `NODE_ENV`: Application environment (development, production)
- `PORT`: Server port number
- `FRONTEND_URL`: Frontend application URL for CORS and email links
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_ACCESS_SECRET`: Secret key for access token signing
- `JWT_REFRESH_SECRET`: Secret key for refresh token signing
- `REDIS_HOST`: Redis server hostname
- `REDIS_PORT`: Redis server port
- `RESEND_API_KEY`: Resend API key for email sending
- `R2_ENDPOINT`: S3-compatible storage endpoint
- `STRIPE_SECRET_KEY`: Stripe secret key for payment processing
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret for signature verification

## Database Setup

1. Create a PostgreSQL database:

```bash
createdb voyago
# or using psql
psql -U postgres
CREATE DATABASE voyago;
```

2. Run database migrations:

```bash
npx prisma migrate dev
```

3. (Optional) Seed the database:

```bash
npx prisma db seed
```

4. Generate Prisma Client:

```bash
npx prisma generate
```

## Running the Application

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Production Mode

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests (placeholder)

## API Documentation

### Base URL

- Development: `http://localhost:5000/api/v1`
- Production: `https://voyago-api.vercel.app/api/v1`

### API Endpoints

#### Authentication

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/verify-otp` - Verify email with OTP
- `POST /api/v1/auth/resend-otp` - Resend OTP
- `POST /api/v1/auth/logout` - User logout

#### Users

- `GET /api/v1/users/profile` - Get current user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/:id` - Get user by ID

#### Listings

- `GET /api/v1/listings` - Get all listings (with filters)
- `GET /api/v1/listings/:id` - Get listing by ID
- `POST /api/v1/listings` - Create new listing (Guide only)
- `PUT /api/v1/listings/:id` - Update listing (Guide only)
- `DELETE /api/v1/listings/:id` - Delete listing (Guide only)

#### Bookings

- `GET /api/v1/bookings` - Get user bookings
- `GET /api/v1/bookings/:id` - Get booking by ID
- `POST /api/v1/bookings` - Create booking request (Tourist only)
- `PUT /api/v1/bookings/:id/accept` - Accept booking (Guide only)
- `PUT /api/v1/bookings/:id/decline` - Decline booking (Guide only)
- `PUT /api/v1/bookings/:id/cancel` - Cancel booking

#### Payments

- `POST /api/v1/payments/create-checkout` - Create Stripe checkout session
- `POST /api/v1/payments/webhook` - Stripe webhook handler
- `GET /api/v1/payments/:id` - Get payment details

#### Reviews

- `POST /api/v1/reviews` - Create review (Tourist only)
- `GET /api/v1/reviews/listing/:listingId` - Get reviews for a listing
- `GET /api/v1/reviews/user/:userId` - Get reviews by user

#### Availability

- `GET /api/v1/availability` - Get guide availability
- `POST /api/v1/availability` - Create availability slot (Guide only)
- `PUT /api/v1/availability/:id` - Update availability slot (Guide only)
- `DELETE /api/v1/availability/:id` - Delete availability slot (Guide only)

#### Notifications

- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/:id/read` - Mark notification as read
- `PUT /api/v1/notifications/read-all` - Mark all notifications as read

#### Wishlist

- `GET /api/v1/wishlist` - Get user wishlist
- `POST /api/v1/wishlist` - Add listing to wishlist
- `DELETE /api/v1/wishlist/:listingId` - Remove from wishlist

#### Upload

- `POST /api/v1/upload` - Upload file/image

#### Admin

- `GET /api/v1/admin/users` - Get all users (Admin only)
- `PUT /api/v1/admin/users/:id/approve` - Approve user (Admin only)
- `PUT /api/v1/admin/users/:id/ban` - Ban user (Admin only)
- `GET /api/v1/admin/listings` - Get all listings (Admin only)
- `GET /api/v1/admin/bookings` - Get all bookings (Admin only)
- `GET /api/v1/admin/analytics` - Get analytics data (Admin only)

#### Health Check

- `GET /health` - Health check endpoint
- `GET /api/v1/health` - API health check

### Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Response Format

Success response:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

## Project Structure

```
voyago-api/
├── api/                    # Vercel serverless entry point
├── dist/                   # Compiled JavaScript output
├── node_modules/           # Dependencies
├── prisma/                 # Prisma schema and migrations
│   └── schema.prisma      # Database schema
├── src/
│   ├── app/
│   │   ├── config/        # Configuration files
│   │   │   ├── env.ts     # Environment variables
│   │   │   ├── prisma.ts  # Prisma client
│   │   │   └── redis.ts   # Redis client
│   │   ├── constants.ts   # Application constants
│   │   ├── errorHelpers/ # Error handling
│   │   ├── helpers/       # Helper functions
│   │   ├── interfaces/    # TypeScript interfaces
│   │   ├── middlewares/   # Express middlewares
│   │   │   ├── auth.middleware.ts
│   │   │   ├── globalErrorHandler.ts
│   │   │   ├── notFound.ts
│   │   │   └── rbac.middleware.ts
│   │   ├── modules/       # Feature modules
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── availability/
│   │   │   ├── booking/
│   │   │   ├── guide/
│   │   │   ├── listing/
│   │   │   ├── message/
│   │   │   ├── notification/
│   │   │   ├── payment/
│   │   │   ├── review/
│   │   │   ├── upload/
│   │   │   ├── user/
│   │   │   └── wishlist/
│   │   ├── routes/        # Route definitions
│   │   ├── utils/         # Utility functions
│   │   └── templates/     # Email templates
│   ├── app.ts             # Express app setup
│   └── server.ts          # Server entry point
├── .env                   # Environment variables (not in git)
├── .gitignore
├── package.json
├── tsconfig.json
├── vercel.json            # Vercel deployment config
└── README.md
```

## Security

The API implements several security measures:

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configured for cross-origin requests
- **Rate Limiting**: Prevents abuse with express-rate-limit
  - General endpoints: 100 requests per 15 minutes
  - Authentication endpoints: 5 requests per 15 minutes
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Zod schemas for request validation
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: Helmet and input sanitization
- **HTTPS**: Enforced in production

## Testing

Currently, the test suite is in development. To run tests:

```bash
npm test
```

## Deployment

### Vercel Deployment

The API is configured for Vercel serverless deployment:

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Deploy:

```bash
vercel
```

3. Set environment variables in Vercel dashboard

### Environment Variables for Production

Ensure all required environment variables are set in your deployment platform:

- Database connection string
- JWT secrets (use strong, random strings)
- Stripe keys
- File storage credentials
- Email service API key
- Redis connection details (if using)

### Database Migrations

Run migrations in production:

```bash
npx prisma migrate deploy
```

### Health Checks

The API provides health check endpoints for monitoring:

- `GET /health` - Basic health check
- `GET /api/v1/health` - Detailed health check

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure code follows the project's style guidelines
4. Run linter: `npm run lint`
5. Submit a pull request

## License

ISC

## Support

For issues and questions, please contact the development team or create an issue in the repository.
