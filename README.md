# ConvoHub 💬

A modern real-time chat messaging application with AI-powered features.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4+-yellow)
![License](https://img.shields.io/badge/License-MIT-purple)

## ✨ Features

- **Real-time Messaging** - Instant message delivery using Socket.IO
- **Private & Group Chats** - One-on-one conversations and group discussions
- **AI Smart Replies** - Get intelligent reply suggestions powered by Gemini AI
- **Message Translation** - Translate messages to 12+ languages
- **File Sharing** - Share files up to 50MB with chunked uploads
- **Push Notifications** - Stay updated with web push notifications
- **Typing Indicators** - See when others are typing
- **Read Receipts** - Know when your messages are read
- **Message Replies** - Reply to specific messages in a conversation
- **User Presence** - See online/offline status of users

## 🛠️ Tech Stack

| Frontend | Backend | Database | Real-time |
|----------|---------|----------|-----------|
| React.js | Node.js | MySQL | Socket.IO |
| CSS3 | Express | Prisma ORM | WebSocket |
| Electron | JWT Auth | Redis | - |

## 📦 Installation

### Prerequisites

- Node.js 18+
- MySQL 8+
- Redis

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/RushiK8626/Chat-Messaging-App.git
   cd ConvoHub
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database and API credentials
   ```

4. **Setup database**
   ```bash
   npx prisma migrate dev
   ```

5. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

6. **Start the application**
   ```bash
   # Terminal 1 - Start server
   cd server
   npm start

   # Terminal 2 - Start client
   cd client
   npm start
   ```

7. **Open in browser**
   ```
   http://localhost:3000
   ```
8. **To start Electron app**
    ```
    yarn electron:serve
    ```

## 🔧 Environment Variables

### Server (.env)
```env
DATABASE_URL="mysql://user:password@localhost:3306/convohub"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
REDIS_URL="redis://localhost:6379"
GEMINI_API_KEY="your-gemini-api-key"
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
```

### Client (.env)
```env
REACT_APP_API_URL="http://localhost:3001"
```

## 📱 Screenshot

Chat Window 

![Chat Window](docs/screenshots/home.png)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Rushikesh**
- GitHub: [@RushiK8626](https://github.com/RushiK8626)

---

⭐ Star this repo if you find it helpful!
