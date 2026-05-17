# Task Backend API Bruno Collection

Open this folder in Bruno as a collection.

## Setup

1. Select the `Local` environment.
2. Keep `baseUrl` as `http://localhost:3000`, or change it to your LAN/server URL.
3. Run `Auth / Login` or `Auth / Register`.
4. Copy `data.accessToken` and `data.refreshToken` from the response into the environment variables.
5. Fill IDs such as `taskId`, `conversationId`, and `otherUserId` before running detail/update/delete requests.

All protected endpoints use `Authorization: Bearer {{accessToken}}`.
