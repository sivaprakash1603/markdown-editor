# Markdown Editor

A modern, collaborative markdown editor with AI-powered text enhancement and real-time collaboration features.

## 🚀 Features

- **Rich Markdown Editor**: Full-featured markdown editing with live preview
- **AI Text Enhancement**: Powered by Together AI for intelligent text improvement
- **Real-time Collaboration**: Work together on documents with workspace features
- **User Authentication**: Secure login with email/password and Google OAuth
- **Workspace Management**: Create and manage collaborative workspaces
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm/pnpm
- MongoDB database (local or cloud)
- Firebase project for authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd markdown-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Configuration**

   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your actual configuration values:

   ```env
   # Database Configuration (Server-side only - NEVER expose to client)
   MONGODB_DB=your-database-name
   MONGODB_URI=your-mongodb-connection-string

   # API Keys (Server-side only - NEVER expose to client)
   TOGETHER_API_KEY=your-together-api-key

   # Public Configuration (Safe to expose to client)
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Firebase Configuration (Safe to expose - required for client-side SDK)
   NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication and configure sign-in methods (Email/Password and Google)
4. Get your Firebase config from Project Settings > General > Your apps
5. Copy the config values to your `.env` file

### MongoDB Setup

1. Create a MongoDB database (local or cloud like MongoDB Atlas)
2. Get your connection string
3. Update `MONGODB_URI` in your `.env` file

### Development

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## 🔒 Security Notes

- **Never commit your `.env` file to version control**
- **Server-side variables** (without `NEXT_PUBLIC_` prefix) are only accessible in API routes and server-side code
- **Client-side variables** (with `NEXT_PUBLIC_` prefix) are embedded in the client bundle and visible to users
- **Firebase config keys are safe to expose** because they're required for client-side authentication
- **Database credentials and API keys should NEVER be prefixed with `NEXT_PUBLIC_`**

### Environment Variable Security

| Variable Type | Prefix | Accessible In | Security Level |
|---------------|--------|---------------|----------------|
| Server-side | None | API routes only | 🔒 Secure |
| Client-side | `NEXT_PUBLIC_` | Client + Server | ⚠️ Public |

**Safe to expose:**
- Firebase configuration keys
- Public app URLs
- Feature flags
- Public API endpoints

**Never expose:**
- Database connection strings
- Private API keys
- Secret tokens
- Passwords
- Private keys

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── editor/            # Main editor page
│   ├── signup/            # User registration
│   └── workspaces/        # Workspace management
├── components/            # Reusable UI components
├── contexts/              # React contexts (AuthContext)
├── lib/                   # Utility libraries
│   ├── firebase.js        # Firebase configuration
│   └── mongodb.js         # MongoDB connection
└── public/                # Static assets
```

## 🛡️ Security Features

- **Secure Authentication**: Firebase Auth with MongoDB user validation
- **Environment Variables**: All sensitive keys stored securely
- **Input Validation**: Server-side validation for all API endpoints
- **User Verification**: Automatic MongoDB record creation for new users

## 📝 License

This project is licensed under the MIT License.
