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
3. Protected routes use `middleware/authMiddleware.js`, which verifies `Authorization: Bearer <token>`, checks the token `authVersion`, and attaches the authenticated user to `req.user`.
4. Controllers validate request data, call Mongoose models, and return a consistent `{ success, data | message }` response shape.
5. Socket.IO verifies the JWT and token `authVersion` from `socket.handshake.auth.token` or `socket.handshake.query.token`, then re-checks `authVersion` before handling inbound events.

## API Modules

- `GET /` - health check
- `/api/auth` - register, login, refresh token, logout, forgot password OTP, reset password
- `/api/user` - profile, profile update, password change, avatar upload, user search
- `/api/tasks` - task list, stats, create, update, delete
- `/api/conversations` - create/list/detail/update/delete conversations and manage participants
- `/api/messages` - list and send messages
- `/uploads` - static file serving for uploaded avatars

## Database

The project uses MongoDB through Mongoose.

### Models

- **User**
  - `email`, `fullName`, `password`, `avatar`, `phone`, `refreshToken`, `authVersion`
  - Passwords are hashed before save.
  - `password`, `refreshToken`, and `authVersion` are removed from JSON responses.

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
# Optional. In local dev, this is auto-detected from your LAN IP if omitted.
PUBLIC_BASE_URL=http://192.168.1.10:3000
MONGO_URI=mongodb://127.0.0.1:27017/task-backend
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
JWT_REFRESH_EXPIRE=7d
DEVICE_ID_HASH_SECRET=replace-with-device-id-hash-secret
PASSWORD_RESET_OTP_DELIVERY=console
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password
```

Notes:

- `MONGO_URI`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` are required.
- `PUBLIC_BASE_URL` is optional in local development. If omitted and `NODE_ENV !== production`, the server auto-detects a LAN IP and uses a value such as `http://192.168.1.10:3000`. Set it explicitly in production, or when you need a fixed host/domain. Avatar responses use this value to return absolute image URLs.
- `DEVICE_ID_HASH_SECRET` is required if you want error logs to include `deviceIdHash`; without it, the server skips device ID hashing instead of logging a predictable hash.
- `PASSWORD_RESET_OTP_DELIVERY=console` is useful for local demos only. It logs password reset OTPs to the backend console instead of sending email. Do not use it in production.
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

Run in development mode and sync the Android dev base URL first:

```bash
npm run dev:android
```

This updates `DEV_BASE_API_URL` in the Android project's `local.properties` to the current LAN URL, such as `"http://192.168.1.10:3000/"`, then starts the backend. By default, the script looks for `../android-story/TreeTask/local.properties` relative to this backend repo.

You can also sync the URL without starting the server:

```bash
npm run sync:android-url
```

Useful overrides:

```bash
npm run sync:android-url -- --host 192.168.1.10
npm run sync:android-url -- --port 3001
npm run sync:android-url -- --path ../android-story/TreeTask/local.properties
npm run sync:android-url -- --dry-run
```

You can also set `ANDROID_LOCAL_PROPERTIES_PATH` locally instead of passing `--path`.

Run in production mode:

```bash
npm start
```

There is no separate build step because this project runs plain CommonJS JavaScript directly with Node.js.

The server listens on:

```text
http://localhost:3000
```

It also binds to `0.0.0.0`, so the console prints a LAN URL that can be used by an Android device on the same network. In local development, if `PUBLIC_BASE_URL` is not set, the server uses the preferred LAN URL as the default public base URL and prints it at startup.
For mobile image loading, do not use `localhost` as the API base URL unless the client runs on the same machine. Use the printed LAN URL so uploaded avatar responses return a URL the device can open directly.

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
- `language` - sent as `Accept-Language`; use `vi` or `en`
- `accessToken` - automatically set after register, login, or refresh token
- `refreshToken` - automatically set after register, login, or refresh token
- `taskId` - required for update/delete task requests
- `conversationId` - required for conversation detail, message, participant requests
- `otherUserId` - required for private/group conversation and participant requests
- `avatarPath` - absolute path to an image file for avatar upload
- `resetOtp` - OTP received by email for `Auth / Reset Password`

### Localized Errors

Clients can send `Accept-Language: vi` or `Accept-Language: en`.
Error responses include a stable `code` for app logic and a localized `message` for display.
The API also returns `requestId`, and echoes the same value in the `X-Request-Id` response header.

```json
{
  "success": false,
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "Email hoặc mật khẩu không đúng.",
  "requestId": "0f5e7b8c-96a5-4e0f-a69d-88d9069e9d6f"
}
```

### Mobile Debug Headers

Mobile clients can send these headers on every request:

```http
X-Request-Id: optional-client-generated-id
X-App-Version-Code: 42
X-App-Version-Name: 1.4.2
X-Platform: android
X-OS-Version: 35
X-Device-Model: Pixel 8
X-Device-Id: device-installation-id
User-Agent: TreeTask/1.4.2 (Android 15; Pixel 8)
Accept-Language: vi-VN
```

The server normalizes those values into `req.client` for error logs. `X-Device-Id` is logged only as `deviceIdHash`.

### Forgot Password Flow

The mobile-friendly password reset flow uses an email OTP instead of sending a new password directly.

1. Call `POST /api/auth/forgot-password` with `{ "email": "user@example.com" }`.
2. The API always returns a generic success response when the request is valid, so it does not reveal whether the email exists.
3. If the email belongs to a user, the API sends a 6-digit OTP that expires after 5 minutes.
4. Call `POST /api/auth/reset-password` with `{ "email": "user@example.com", "otp": "123456", "newPassword": "password1234" }`.
5. The API allows up to 5 wrong OTP attempts, clears the OTP after a successful reset, and invalidates existing access/refresh tokens.

For local demos without SMTP, set:

```env
PASSWORD_RESET_OTP_DELIVERY=console
```

The backend will print the OTP with a masked email and `requestId`. In production, leave this unset and configure `EMAIL_USER` plus `EMAIL_PASS`.

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
