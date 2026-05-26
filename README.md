<div align="center">
  <img src="client/public/logo192.png" alt="SwiftTalk Logo" width="60" height="60">
  <h1>SwiftTalk - Real-Time Chat Messaging Application</h1>
</div>

A modern, full-stack messaging application with real-time communication, AI-powered chat assistance, task management, and smart notifications built with React, Node.js, and WebSockets.

## Features

- **Real-Time Messaging**: Instant message delivery with live read receipts and typing indicators
- **AI-Powered Chat**: AI assistance for writing suggestions and smart replies
- **Task Management**: Integrated task management for personal and shared tasks
- **Smart Notifications**: Web push notifications with optional email alerts
- **File & Media Sharing**: Send images, documents, and files with instant previews
- **User Authentication**: Secure JWT-based authentication with OTP verification
- **Privacy Controls**: Blocked-user management and private/public chat options

---

## Project Structure

```
SwitftTalk/
├── client/                      # React frontend
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   ├── pages/               # Page components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── context/             # Context API for state
│   │   ├── utils/               # Utility functions
│   │   ├── styles/              # Global styles
│   │   └── config/              # Configuration files
│   ├── Dockerfile               # Docker image for React app
│   ├── nginx.conf               # Nginx configuration for production
│   └── package.json             # Frontend dependencies
│
├── server/                      # Node.js backend
│   ├── src/
│   │   ├── controller/          # Route handlers
│   │   ├── middleware/          # Express middleware
│   │   ├── routes/              # API endpoints
│   │   ├── services/            # Business logic
│   │   ├── socket/              # WebSocket handlers
│   │   ├── config/              # Database, Redis config
│   │   └── server.js            # Entry point
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── seed.js              # Database seeding
│   │   └── migrations/          # Database migrations
│   ├── uploads/                 # User file uploads
│   ├── Dockerfile               # Docker image for Node.js
│   └── package.json             # Backend dependencies
│
├── docker-compose.yml           # Docker Compose configuration
├── .env                         # Environment variables
└── README.md                    # This file
```

---

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# Web Push Notification (VAPID Keys)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# AI Integration
GEMINI_API_KEY=your_gemini_api_key
```

---

## Setup: Docker (Recommended)

### Prerequisites

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- Modern web browser with JavaScript enabled

### 1. Clone and Navigate

```bash
cd SwitftTalk
```

### 2. Configure Environment

Create the `.env` file in the root directory as described in [Environment Configuration](#environment-configuration).

The `.env` file is automatically loaded by Docker Compose.

### 3. Start All Services

```bash
docker-compose up -d
```

This starts the following services:

| Service         | Port | Description                   |
|-----------------|------|-------------------------------|
| MySQL Database  | 3306 | Primary database              |
| Redis Cache     | 6379 | Session and cache store       |
| Node.js Server  | 3001 | REST API & WebSocket server   |
| React Client    | 3000 | Web application               |

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **API Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### 5. Manage Services

```bash
# Stop all services (keeps data volumes)
docker-compose down

# Stop and remove all data (hard reset)
docker-compose down -v
```

### Database Migrations (Docker)

```bash
# Create a new migration
docker exec switfttalk-server-1 npx prisma migrate dev --name your_migration_name

# Open Prisma Studio (GUI for database)
docker exec switfttalk-server-1 npx prisma studio
```

### Testing the Docker Setup

```bash
# Test frontend
curl http://localhost:3000

# Test API health
curl http://localhost:3001/health
```
---

## Setup: Local Development (Without Docker)

### Prerequisites

- **Node.js** (v18+)
- **MySQL** (v8.0+) — running locally or remotely
- **Redis** (v6.2+) — running locally or remotely
- **npm** or **yarn**

### 1. Clone and Navigate

```bash
cd SwitftTalk
```

### 2. Configure Environment

Create the `.env` file in the root directory as described in [Environment Configuration](#environment-configuration).

Additionally, configure database and Redis connections in `server/.env`:

```bash
# Database
DATABASE_URL="mysql://root:your_password@localhost:3306/swifttalk"

# Redis
REDIS_URL="redis://localhost:6379"
```

### 3. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 4. Set Up the Database

```bash
cd server

# Run migrations to create schema
npx prisma migrate dev

# (Optional) Seed initial data
npx prisma db seed
```

### 5. Start the Application

Open two terminal windows:

```bash
# Terminal 1 — Start backend server (from /server)
cd server
npm run dev

# Terminal 2 — Start frontend (from /client)
cd client
npm start
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **API Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### Database Migrations (Local)

```bash
# Create a new migration
cd server
npx prisma migrate dev --name your_migration_name

# Open Prisma Studio (GUI for database)
npx prisma studio
```
---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID
- `POST /api/users/block/:id` - Block a user

### Chats
- `GET /api/chats` - List all chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id` - Get chat details
- `DELETE /api/chats/:id` - Delete chat

### Messages
- `GET /api/messages/:chatId` - Get chat messages
- `POST /api/messages` - Send message
- `DELETE /api/messages/:id` - Delete message

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications/subscribe` - Subscribe to push notifications
- `POST /api/notifications/send` - Send notification

### AI
- `POST /api/ai/smart-replies` - Get AI generated smart replies
- `POST /api/ai/translate` - Get translation for message in target language
- `POST /api/ai/summarize` - Summarize the current chat
- `POST /api/ai/sessions` - Create new user session
- `GET /api/ai/sessions` - Get all sessions of current user
- `GET /api/ai/sessions/:id` - Get session with specified session_id
- `DELETE /api/ai/sessions/:id` - Delete session with specified session_id

---

## 🔌 WebSocket Events

Real-time communication uses Socket.IO:

```javascript
// Client connects
io.on('connect', () => { /* handle connection */ })

// Listen for new messages
socket.on('message:new', (data) => { /* handle new message */ })

// Listen for typing indicators
socket.on('user:typing', (data) => { /* handle typing */ })

// Listen for read receipts
socket.on('message:read', (data) => { /* handle read */ })

// Listen for online status
socket.on('user:online', (data) => { /* handle online status */ })
```

---

## Technology Stack

### Frontend
- **React 19** - UI framework
- **React Router 7** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **React Helmet** - Document head management

### Backend
- **Node.js 18** - Runtime
- **Express.js** - Web framework
- **Prisma** - Database ORM
- **Socket.IO** - WebSocket library
- **JWT** - Authentication
- **Redis** - Caching & sessions
- **Langchain** - AI pipeline
- **Gemini API** - AI integration

### Infrastructure
- **MySQL 8.0** - Primary database
- **Redis 6.2** - Cache & session store
- **Nginx** - Reverse proxy & static file server
- **Docker** - Containerization
- **Docker Compose** - Service orchestration

---

## Security Features

- ✅ JWT-based authentication with refresh tokens
- ✅ OTP email verification
- ✅ Password hashing with bcrypt
- ✅ CORS protection
- ✅ Rate limiting on API endpoints
- ✅ User blocking/privacy controls
- ✅ Secure WebSocket connections
- ✅ Environment variable isolation

---

## License

See [LICENSE](LICENSE) file for details.

## Author

Created by Rushikesh

---

**Last Updated**: May 26, 2026
