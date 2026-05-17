
<span align="center">
  <img src="client/public/logo192.png" alt="SwiftTalk Logo" width="120" height="120">
</span>

# SwiftTalk - Real-Time Chat Messaging Application

A modern, full-stack messaging application with real-time communication, AI-powered chat assistance, task management, and smart notifications built with React, Node.js, and WebSockets.

## 🚀 Features

- **Real-Time Messaging**: Instant message delivery with live read receipts and typing indicators
- **AI-Powered Chat**: AI assistance for writing suggestions and smart replies
- **Task Management**: Integrated task management for personal and shared tasks
- **Smart Notifications**: Web push notifications with optional email alerts
- **File & Media Sharing**: Send images, documents, and files with instant previews
- **User Authentication**: Secure JWT-based authentication with OTP verification
- **Privacy Controls**: Blocked-user management and private/public chat options

## 📋 Prerequisites

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- Modern web browser with JavaScript enabled

## 🐳 Quick Start with Docker

### 1. Clone and Navigate

```bash
cd SwitftTalk
```

### 2. Start All Services

```bash
docker-compose up -d
```

This will start:
- **MySQL Database** (port 3306) - Database for chat data
- **Redis Cache** (port 6379) - Session and cache store
- **Node.js Server** (port 3001) - REST API & WebSocket server
- **React Client** (port 3000) - Web application

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **API Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### 4. Stop All Services

```bash
docker-compose down
```

### 5. Stop and Remove Data (Hard Reset)

```bash
docker-compose down -v
```

## 🏗️ Project Structure

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

## 🔧 Environment Configuration

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

The `.env` file is automatically loaded by Docker Compose. Do not commit this file to version control.

## 🧪 Testing the Setup

### Test Frontend
```bash
curl http://localhost:3000
```

### Test API Health
```bash
curl http://localhost:3001/health
```

### View Service Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f mysql
docker-compose logs -f redis
```

### Check Container Status
```bash
docker-compose ps
```

### Execute Commands in Container
```bash
# Run a command in the server container
docker exec switfttalk-server-1 npm run dev

# Access MySQL shell
docker exec -it switfttalk-mysql-1 mysql -u root -psecret -D swifttalk
```

## 📝 API Endpoints

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

## 🚨 Troubleshooting

### Client not accessible on port 3000
- Check if port 3000 is already in use: `netstat -an | findstr :3000`
- Verify client container is healthy: `docker-compose ps`
- Check client logs: `docker-compose logs client`

### Server API not responding
- Check if port 3001 is already in use: `netstat -an | findstr :3001`
- Verify database is healthy: `docker-compose logs mysql`
- Check server logs: `docker-compose logs server`

### Database connection errors
- Ensure MySQL container is healthy: `docker-compose ps`
- Check database logs: `docker-compose logs mysql`
- Verify DATABASE_URL in server/.env

### Redis connection errors
- Verify Redis container is running: `docker-compose ps`
- Check Redis logs: `docker-compose logs redis`
- Test Redis connection: `docker exec switfttalk-redis-1 redis-cli ping`

### VAPID key errors
- Ensure VAPID keys are set in `.env` file at root
- Keys must be valid and properly formatted
- Restart services after updating keys: `docker-compose restart server`

## 📦 Technology Stack

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
- **Gemini API** - AI integration

### Infrastructure
- **MySQL 8.0** - Primary database
- **Redis 6.2** - Cache & session store
- **Nginx** - Reverse proxy & static file server
- **Docker** - Containerization
- **Docker Compose** - Service orchestration

## 🔐 Security Features

- ✅ JWT-based authentication with refresh tokens
- ✅ OTP email verification
- ✅ Password hashing with bcrypt
- ✅ CORS protection
- ✅ Rate limiting on API endpoints
- ✅ User blocking/privacy controls
- ✅ Secure WebSocket connections
- ✅ Environment variable isolation

## 🤝 Development Tips

### Hot Reload Development (Without Docker)
For local development with hot reload:

```bash
# Terminal 1 - Start backend
cd server
npm install
npm run dev

# Terminal 2 - Start frontend
cd client
npm install
npm start
```

### Database Migrations
```bash
# Create new migration
docker exec switfttalk-server-1 npx prisma migrate dev --name your_migration_name

# View database schema
docker exec switfttalk-server-1 npx prisma studio
```

### View Database
```bash
docker exec -it switfttalk-mysql-1 mysql -u root -psecret -D swifttalk
```

## 📄 License

See [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Created by Rushikesh

## 🐛 Known Issues

- Prisma 6.x is deprecated. Plan upgrade to Prisma 7.x
- Some WebSocket events may retry on connection loss

---

**Last Updated**: April 28, 2026
