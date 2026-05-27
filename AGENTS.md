# AGENTS.md

## Hoan Thanh

- Da refactor error response toan API theo contract:
  - `success`
  - `code`
  - `message`
  - `requestId` cho error responses
- Da them i18n layer cho `vi` va `en` dua tren `Accept-Language`.
- Da them `localeMiddleware` de detect locale va set `Content-Language`.
- Da them `requestContextMiddleware` de doc mobile debug headers:
  - `X-Request-Id`
  - `X-App-Version-Code`
  - `X-App-Version-Name`
  - `X-Platform`
  - `X-OS-Version`
  - `X-Device-Model`
  - `X-Device-Id`
  - `User-Agent`
- Da hash `X-Device-Id` bang HMAC-SHA256 khi co `DEVICE_ID_HASH_SECRET`; neu thieu secret thi khong log device hash.
- Da cap nhat Bruno collection de gui `Accept-Language` va mobile debug headers.
- Da them message thanh cong cho `POST /api/auth/register`.
- Da thay flow forgot password cu bang OTP flow:
  - `POST /api/auth/forgot-password` tao OTP va gui email/log console.
  - `POST /api/auth/reset-password` reset password bang `email + otp + newPassword`.
- Da them fields reset password vao `User` model:
  - `passwordResetOtpHash`
  - `passwordResetExpires`
  - `passwordResetAttempts`
- Da them Bruno request `Auth / Reset Password`.
- Da cap nhat README va Bruno README cho localized errors, mobile debug headers, va forgot/reset password flow.

## Trang Thai Hien Tai

- Backend dang dung Express + MongoDB + JWT + bcryptjs + nodemailer.
- API error responses da chuyen sang localized `code/message`.
- `forgot-password` khong con gui password moi qua email nua.
- OTP reset password:
  - 6 digits
  - expires sau 5 phut
  - max 5 lan sai
  - luu hash bang bcrypt, khong luu plain OTP
  - reset thanh cong thi clear OTP, clear `refreshToken`, va bump `authVersion`
- Da them `authVersion` vao `User` model de invalidate access/refresh token cu sau change/reset password.
- `PUT /api/user/changePassword` hien tai doi password xong se clear `refreshToken` va bump `authVersion`, bat user dang nhap lai tren moi thiet bi.
- Demo mode cho forgot password:
  - set `.env`: `PASSWORD_RESET_OTP_DELIVERY=console`
  - backend se in OTP ra terminal thay vi gui email that
  - chi hoat dong khi `NODE_ENV !== production`
- Email SMTP mode:
  - dung `EMAIL_USER` lam Gmail sender
  - dung `EMAIL_PASS` la Gmail App Password, khong phai password Gmail thuong
- `.env` va `bruno/task-backend/environments/Local.bru` dang duoc `.gitignore`, khong nen commit.
- `Local.example.bru` la template nen duoc commit.

## Buoc Tiep Theo

- Chay syntax checks truoc commit:
  - `node --check server.js`
  - `node --check controllers/authController.js`
  - `node --check models/User.js`
  - `node --check routes/auth.js`
  - `node --check middleware/localeMiddleware.js`
  - `node --check middleware/requestContextMiddleware.js`
  - `node --check utils/i18n.js`
  - `node --check utils/response.js`
  - `git diff --check`
- Test manual bang Bruno:
  - Register success message theo `Accept-Language`.
  - Forgot Password voi `PASSWORD_RESET_OTP_DELIVERY=console`.
  - Copy OTP tu terminal vao `resetOtp`.
  - Reset Password bang Bruno `Auth / Reset Password`.
  - Login lai bang password moi.
- Truoc khi push public GitHub:
  - dam bao `.env` khong bi track
  - dam bao `Local.bru` khong bi track
  - scan diff khong co token/JWT/email password that
- Nen them automated tests sau:
  - auth validation
  - localized error response
  - forgot/reset password OTP happy path
  - wrong OTP, expired OTP, too many attempts

## Quyet Dinh Quan Trong Va Ly Do

- Dung `Accept-Language` thay vi custom `lang` header vi day la HTTP standard.
- Tra `code` + localized `message` de mobile co stable logic key, khong parse string.
- Mac dinh locale la `vi` vi app/user hien tai uu tien tieng Viet.
- Them `requestId` vao error response va response header de trace bug tu mobile ve backend log.
- Khong log raw `X-Device-Id`; chi log hash khi co `DEVICE_ID_HASH_SECRET` de giam rui ro privacy/security.
- Khong commit `Local.bru` vi Bruno co the persist access/refresh token that vao file nay.
- Khong gui password moi qua email vi day la pattern kem an toan. Dung OTP reset password hop voi mobile demo hon.
- Forgot password tra generic success de khong leak email co ton tai trong DB hay khong.
- Cho phep `PASSWORD_RESET_OTP_DELIVERY=console` de test demo local khong can SMTP that, nhung chan trong production bang dieu kien `NODE_ENV !== production`.
