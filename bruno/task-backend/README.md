# Task Backend API Bruno Collection

Open this folder in Bruno as a collection.

## Setup

1. Select the `Local` environment.
2. Keep `baseUrl` as `http://localhost:3000`, or change it to your LAN/server URL.
3. Set `language` to `vi` or `en`. Bruno sends it as `Accept-Language`.
4. Run `Auth / Login` or `Auth / Register`.
5. Copy `data.accessToken` and `data.refreshToken` from the response into the environment variables.
6. Fill IDs such as `taskId`, `conversationId`, and `otherUserId` before running detail/update/delete requests.
7. For password reset, run `Auth / Forgot Password`, copy the OTP from email into `resetOtp`, then run `Auth / Reset Password`.

All protected endpoints use `Authorization: Bearer {{accessToken}}`.

Every request also sends mobile debug headers from environment variables:

```http
X-Request-Id: {{requestId}}
X-App-Version-Code: {{appVersionCode}}
X-App-Version-Name: {{appVersionName}}
X-Platform: {{platform}}
X-OS-Version: {{osVersion}}
X-Device-Model: {{deviceModel}}
X-Device-Id: {{deviceId}}
User-Agent: {{userAgent}}
Accept-Language: {{language}}
```

Leave `requestId` empty if you want the backend to generate it.

## Localized API errors

Mobile clients should send:

```http
Accept-Language: vi
```

or:

```http
Accept-Language: en
```

The API returns stable error codes plus a localized message:

```json
{
  "success": false,
  "code": "USER_CURRENT_PASSWORD_INCORRECT",
  "message": "Mật khẩu hiện tại không đúng.",
  "requestId": "0f5e7b8c-96a5-4e0f-a69d-88d9069e9d6f"
}
```

Example curl for change password:

```bash
curl -X PUT "$BASE_URL/api/user/changePassword" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept-Language: vi" \
  -H "X-Platform: android" \
  -H "X-App-Version-Code: 1" \
  -H "X-App-Version-Name: 1.0.0" \
  -H "X-OS-Version: 35" \
  -H "X-Device-Model: Android Emulator" \
  -H "X-Device-Id: local-device-id" \
  -H "User-Agent: TreeTask/1.0.0 (Android 15; Android Emulator)" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "old-password",
    "newPassword": "new-password"
  }'
```

Example curl for reset password with OTP:

```bash
curl -X POST "$BASE_URL/api/auth/reset-password" \
  -H "Accept-Language: vi" \
  -H "X-Platform: android" \
  -H "X-App-Version-Code: 1" \
  -H "X-App-Version-Name: 1.0.0" \
  -H "X-OS-Version: 35" \
  -H "X-Device-Model: Android Emulator" \
  -H "X-Device-Id: local-device-id" \
  -H "User-Agent: TreeTask/1.0.0 (Android 15; Android Emulator)" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456",
    "newPassword": "new-password"
  }'
```
