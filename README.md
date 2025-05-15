# Unified Event Analytics Engine

A scalable backend API for website and mobile app analytics that collects detailed events such as clicks, page visits, referrer data, and device metrics.

## 📊 Overview

This system provides a comprehensive solution for tracking user interactions across websites and mobile applications. It handles high traffic loads, provides efficient data aggregation endpoints, and is fully containerized for easy deployment.

### Key Features

- **API Key Management**: Secure registration and authentication system for websites and apps
- **Event Data Collection**: High-volume ingestion of analytics events with data integrity
- **Analytics & Reporting**: Insights through time-based, event-based, app-based, and user-based aggregation
- **Performance Optimized**: Redis caching for frequently requested analytics data
- **Google Auth Integration**: Simple onboarding for app/website owners

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [Docker](https://www.docker.com/) and Docker Compose
- [Git](https://git-scm.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/unified-event-analytics.git
   cd unified-event-analytics
   ```

2. Create a `.env` file in the project root with the following structure:
   ```env
   NODE_ENV=development
   PORT=3000

   # Database (PostgreSQL)
   DB_HOST=postgres
   DB_PORT=5432
   DB_USERNAME=malay
   DB_PASSWORD=password
   DB_DATABASE=analytics_db

   # Redis
   REDIS_HOST=redis
   REDIS_PORT=6379

   # Google OAuth
   GOOGLE_CLIENT_ID=yourId
   GOOGLE_CLIENT_SECRET=yourSecret
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

   # JWT Secrets
   JWT_SECRET=yourVeryStrongAndRandomSecretKeyForAppOwnerSessions32CharsMinimum
   JWT_EXPIRATION_TIME=1h

   # API Key Settings
   API_KEY_DEFAULT_EXPIRATION_DAYS=365
   ```

3. Install dependencies and build the project:
   ```bash
   npm install
   npm run build
   ```

4. Build and start the Docker containers:
   ```bash
   docker-compose build --no-cache
   docker-compose up
   ```

### Clean Installation

To perform a clean installation and remove all existing containers, volumes, and build artifacts:

```bash
rm -rf dist node_modules package-lock.json
docker-compose down -v --remove-orphans
docker system prune -af
```

Then follow the installation steps above.

## 🔌 API Documentation

### Authentication

#### Register a new website/app

```
POST /api/auth/register
```
Registers a new website or app and generates an API key. Uses Google Auth for account verification.

#### Get API Key

```
GET /api/auth/api-key
```
Retrieves the API key for a registered application.

#### Revoke API Key

```
POST /api/auth/revoke
```
Revokes an existing API key to prevent further use.

### Event Collection

#### Submit Analytics Event

```
POST /api/analytics/collect
```

**Headers:**
- `x-api-key`: Your application's API key

**Request Body Example:**
```json
{
  "event": "login_form_cta_click",
  "url": "https://example.com/page",
  "referrer": "https://google.com",
  "device": "mobile",
  "ipAddress": "...",
  "timestamp": "2024-02-20T12:34:56Z",
  "metadata": {
    "browser": "Chrome",
    "os": "Android",
    "screenSize": "1080x1920"
  }
}
```

### Analytics Endpoints

#### Event Summary

```
GET /api/analytics/event-summary
```

**Query Parameters:**
- `event`: Type of event to analyze
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `app_id` (optional): Filter by specific app ID

**Response Example:**
```json
{
  "event": "click",
  "count": 3400,
  "uniqueUsers": 1200,
  "deviceData": {
    "mobile": 2200,
    "desktop": 1200
  }
}
```

#### User Statistics

```
GET /api/analytics/user-stats
```

**Query Parameters:**
- `userId`: User ID to retrieve statistics for

**Response Example:**
```json
{
  "userId": "user789",
  "totalEvents": 150,
  "deviceDetails": {
    "browser": "Chrome",
    "os": "Android"
  },
  "ipAddress": "192.168.1.1"
}
```

## 📂 Project Structure

```
unified-event-analytics/
├── src/
│   ├── common/
|   |   └── guards/
│   ├── config/      
│   ├── database/ 
|   |   └── entities/        
│   ├── modules/          
│   ├── shared/
|   |   └── utils/        
│   └── app.controller.spec.ts
│   └── app.controller.ts
│   └── app.module.ts  
│   └── app.service.ts   
│   └── main.ts      
├── test/               
├── docker-compose.yml   
├── Dockerfile
├── package.json
├── eslint.config.mjs
├── nest.cli.json
├── package.json
├── .prettierc
├── tsconfig.json
├── tsconfig.build.json       
└── .gitignore
            
```

## 🔒 Security

- API key authentication for all analytics endpoints
- JWT tokens for app owner sessions
- Rate limiting to prevent abuse
- Secure handling of sensitive data

## 🧪 Testing

Run the test suite with:

```bash
npm test
```

## 📋 Development Checklist

- [x] API Key Management
- [x] Event Collection API
- [x] Analytics Endpoints
- [x] Testing
- [x] Rate Limiting
- [x] Caching
- [x] Documentation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.