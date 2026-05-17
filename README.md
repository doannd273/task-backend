# Task Backend API

Task Backend API is a Node.js, Express, MongoDB, and Socket.IO backend for a task manager and lightweight messaging application. It provides JWT authentication, task CRUD, user profile management, conversations, messages, avatar uploads, and a Bruno API collection for manual testing.

## Tech Stack

- **Runtime:** Node.js with CommonJS modules
- **HTTP API:** Express 5
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT access tokens and refresh tokens
- **Password hashing:** bcryptjs
- **File upload:** multer
- **Email:** nodemailer for forgot-password flow
- **Realtime:** Socket.IO for conversations and messages
- **API testing:** Bruno collection under `bruno/task-backend`

## Project Architecture

```text
task-backend/
├── config/                  # MongoDB connection
├── controllers/             # Request handlers and business logic
├── middleware/              # Auth and upload middleware
├── models/                  # Mongoose schemas
├── routes/                  # Express route definitions
├── socket/                  # Socket.IO authentication and events
├── uploads/                 # Runtime uploaded files, ignored by git
├── bruno/task-backend/      # Bruno API collection
├── seedTasks.js             # Optional task seeding script
└── server.js                # Express app, HTTP server, Socket.IO setup
```

### Request Flow

1. `server.js` loads environment variables, connects to MongoDB, configures middleware, mounts API routes, and starts the HTTP/Socket.IO server.
2. Public auth routes issue JWT access and refresh tokens.
3. Protected routes use `middleware/authMiddleware.js`, which verifies `Authorization: Bearer <token>` and attaches the authenticated user to `req.user`.
4. Controllers validate request data, call Mongoose models, and return a consistent `{ success, data | message }` response shape.
5. Socket.IO verifies the JWT from `socket.handshake.auth.token` or `socket.handshake.query.token`.

## API Modules

- `GET /` - health check
- `/api/auth` - register, login, refresh token, logout, forgot password
- `/api/user` - profile, profile update, password change, avatar upload, user search
- `/api/tasks` - task list, stats, create, update, delete
- `/api/conversations` - create/list/detail/update/delete conversations and manage participants
- `/api/messages` - list and send messages
- `/uploads` - static file serving for uploaded avatars

## Database

The project uses MongoDB through Mongoose.

### Models

- **User**
  - `email`, `fullName`, `password`, `avatar`, `phone`, `refreshToken`
  - Passwords are hashed before save.
  - `password` and `refreshToken` are removed from JSON responses.

- **Task**
  - `userId`, `title`, `description`, `status`, `dueDate`
  - Supported statuses: `todo`, `in_progress`, `pending`, `done`
  - Tasks are scoped to the authenticated user.

- **Conversation**
  - `type`, `name`, `creator`, `participants`, `lastMessage`, `lastMessageAt`
  - Supported types: `private`, `group`

- **Message**
  - `conversationId`, `senderId`, `content`, `type`
  - Supported message types: `text`, `image`, `system`

## Environment Variables

Create a local `.env` file in the project root. This file is ignored by git.

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/task-backend
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
JWT_REFRESH_EXPIRE=7d
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password
```

Notes:

- `MONGO_URI`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` are required.
- `EMAIL_USER` and `EMAIL_PASS` are required only for `POST /api/auth/forgot-password`.
- Use a Gmail app password or another SMTP-compatible credential for email sending.

## Install, Build, and Run

Install dependencies:

```bash
npm install
```

Run in development mode with nodemon:

```bash
npm run dev
```

Run in production mode:

```bash
npm start
```

There is no separate build step because this project runs plain CommonJS JavaScript directly with Node.js.

The server listens on:

```text
http://localhost:3000
```

It also binds to `0.0.0.0`, so the console prints a LAN URL that can be used by an Android device on the same network.

## Optional Seed Data

After creating at least one user, you can generate sample tasks:

```bash
node seedTasks.js
```

The seeder attaches generated tasks to the first user found in the database.

## Testing with Bruno

A Bruno collection is available at:

```text
bruno/task-backend
```

### Open the Collection

1. Open Bruno.
2. Choose **Open Collection**.
3. Select the `bruno/task-backend` folder.
4. Select the `Local` environment.

If the `Local` environment does not exist after cloning, copy:

```text
bruno/task-backend/environments/Local.example.bru
```

to:

```text
bruno/task-backend/environments/Local.bru
```

`Local.bru` is ignored by git because Bruno can persist real tokens into it.

### Login Flow

1. Start the API server with `npm run dev`.
2. Run `Auth / Register` or `Auth / Login`.
3. The post-response script automatically saves `data.accessToken` and `data.refreshToken` into the selected Bruno environment.
4. Run protected requests such as `User / Get Profile`, `Tasks / Get Tasks`, or `Conversations / Get Conversations`.

### Common Variables

Update these Bruno environment variables as needed:

- `baseUrl` - API base URL, defaults to `http://localhost:3000`
- `accessToken` - automatically set after register, login, or refresh token
- `refreshToken` - automatically set after register, login, or refresh token
- `taskId` - required for update/delete task requests
- `conversationId` - required for conversation detail, message, participant requests
- `otherUserId` - required for private/group conversation and participant requests
- `avatarPath` - absolute path to an image file for avatar upload

## Socket.IO

Connect with a valid access token:

```js
io("http://localhost:3000", {
  auth: {
    token: "<access-token>"
  }
});
```

Supported events:

- `join_conversation`
- `leave_conversation`
- `send_message`
- `typing_start`
- `typing_stop`
- `new_message`
- `user_typing`
- `user_stop_typing`

## Security Notes

- Do not commit `.env`, Bruno local environment files, JWT secrets, email credentials, or private keys.
- Uploaded files are stored under `uploads/` and are ignored by git.
- Rotate tokens and secrets if they are accidentally committed.
