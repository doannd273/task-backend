# CLAUDE.md — Task Backend

Hướng dẫn cho Claude Code khi làm việc trong project này.

---

## Project Overview

Node.js REST API backend cho ứng dụng Task Manager. Stack: Express, MongoDB (Mongoose), JWT, Socket.IO.

- **Entry point:** `server.js`
- **Controllers:** `controllers/`
- **Routes:** `routes/`
- **Models:** `models/` — User, Task, Conversation, Message
- **Bruno API docs:** `bruno/task-backend/`

---

## Rule: Tạo và cập nhật Bruno API Docs

Mỗi khi tạo API mới hoặc thay đổi request/response của API hiện có, **bắt buộc** cập nhật file `.bru` tương ứng trong `bruno/task-backend/`.

### Cấu trúc file `.bru`

Mỗi file gồm các block theo thứ tự:

```
meta { ... }
<method> { url, body, auth }
headers { ... }
params:query { ... }        ← chỉ khi có query params
auth:bearer { ... }         ← chỉ khi cần auth
body:json { ... }           ← chỉ khi có request body
body:multipart-form { ... } ← chỉ khi upload file
vars:pre-request { ... }    ← chỉ khi cần biến local
script:post-response { ... }← chỉ khi cần xử lý response
docs { ... }                ← bắt buộc, luôn để cuối cùng
```

### Cấu trúc block `docs {}`

Block `docs` viết bằng Markdown, bắt buộc có đủ các section sau:

```markdown
# <Tên API>

## Mô tả
<1-2 câu mô tả API làm gì, ai được dùng, giới hạn nào cần biết>

**Domain:** <Domain> — <mô tả ngắn về domain>

**URL:** `<METHOD> /path/to/endpoint`

---

## cURL
<command curl đầy đủ với tất cả headers, body mẫu thực tế>

---

## Headers
<bảng markdown: Header | Bắt buộc (✅/❌) | Mô tả>

---

## Request Body        ← bỏ qua nếu không có body
<bảng markdown: Field | Kiểu | Bắt buộc (✅/❌) | Mô tả>

## Query Params        ← bỏ qua nếu không có query
<bảng markdown: Param | Kiểu | Bắt buộc (✅/❌) | Mô tả>

## Path Params         ← bỏ qua nếu không có path param
<bảng markdown: Param | Kiểu | Bắt buộc (✅/❌) | Mô tả>

---

## Response

### ✅ Success — <HTTP Status> <Status Text>
<JSON example đầy đủ>
<bảng markdown: Field | Kiểu | Mô tả>

### ❌ Error Responses
<bảng markdown: HTTP Status | Error Code | Mô tả>

---

## Notes
<danh sách bullet điểm quan trọng: edge case, gotcha, security, dependency với API khác>
```

### Quy tắc Headers chuẩn

**API không cần auth (`auth: none`):**
```
Content-Type: application/json   ← chỉ khi có body:json
Accept-Language: {{language}}
X-Request-Id: {{requestId}}
X-App-Version-Code: {{appVersionCode}}
X-App-Version-Name: {{appVersionName}}
X-Platform: {{platform}}
X-OS-Version: {{osVersion}}
X-Device-Model: {{deviceModel}}
X-Device-Id: {{deviceId}}
User-Agent: {{userAgent}}
```

**API cần auth (`auth: bearer`):**
```
Content-Type: application/json   ← chỉ khi có body:json
Accept-Language: {{language}}
X-Request-Id: {{requestId}}
X-App-Version-Code: {{appVersionCode}}
X-App-Version-Name: {{appVersionName}}
X-Platform: {{platform}}
X-OS-Version: {{osVersion}}
X-Device-Model: {{deviceModel}}
X-Device-Id: {{deviceId}}
User-Agent: {{userAgent}}
```
*Authorization được cấu hình trong block `auth:bearer` — không thêm thủ công vào `headers {}`.*

**Multipart upload:** Không thêm `Content-Type` — client tự set kèm boundary.

### Quy tắc bảng Headers trong `docs`

| Loại API | Authorization | Content-Type |
|---|---|---|
| `auth: none`, no body | ❌ không có | ❌ không có |
| `auth: none`, có body | ❌ không có | ✅ bắt buộc |
| `auth: bearer`, no body | ✅ bắt buộc | ❌ không có |
| `auth: bearer`, có body | ✅ bắt buộc | ✅ bắt buộc |
| `auth: bearer`, multipart | ✅ bắt buộc | ghi chú: tự động set |

### Quy tắc đặt tên file

```
<seq>-<kebab-case-name>.bru
```

Ví dụ: `01-get-profile.bru`, `03-create-task.bru`

`seq` phải khớp với `seq` trong block `meta {}` và thứ tự thực tế của API trong flow.

### Error code convention

Error code theo format: `<DOMAIN>_<DESCRIPTION>` — ví dụ `AUTH_LOGIN_REQUIRED_FIELDS`, `TASK_NOT_FOUND`, `COMMON_INTERNAL_ERROR`.

Các error code chung dùng prefix `COMMON_`.

---

## Rule: Thêm message vào response thành công

Các API mutation (POST/PUT/DELETE) phải trả về `message` trong response để client hiển thị toast/snackbar:

```js
// POST/PUT — trả về resource sau khi thay đổi
res.status(200).json({
  success: true,
  message: 'Profile updated successfully.',
  data: user,
});

// DELETE — không có resource để trả về
res.status(200).json({
  success: true,
  data: {
    message: 'Task deleted successfully.',
  },
});
```

GET API không cần `message`.

---

## Rule: Controller structure

Mỗi controller function phải theo pattern:

```js
const doSomething = async (req, res) => {
  try {
    // 1. Validate input
    // 2. Query DB
    // 3. Business logic
    // 4. Return response
    res.status(200).json({ success: true, data: ... });
  } catch (error) {
    console.error('Do something error:', error.message);
    // Handle specific errors (ValidationError, CastError...)
    return sendError(req, res, 500, 'DOMAIN_ACTION_FAILED');
  }
};
```

---

## Rule: Không được làm

- Không xóa file mà không hỏi
- Không push git mà không xác nhận
- Không chạy migration DB mà không xác nhận
- Không thay đổi `.env` hoặc config production
