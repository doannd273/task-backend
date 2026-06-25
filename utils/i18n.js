const DEFAULT_LOCALE = 'vi';
const SUPPORTED_LOCALES = ['vi', 'en'];

const messages = {
  vi: {
    COMMON_INTERNAL_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau.',
    COMMON_ROUTE_NOT_FOUND: 'Không tìm thấy route {{route}}.',
    COMMON_INVALID_ID: 'ID không hợp lệ.',
    COMMON_INVALID_JSON: 'JSON không hợp lệ.',
    COMMON_VALIDATION_ERROR: 'Dữ liệu không hợp lệ.',
    COMMON_DUPLICATE_RESOURCE: 'Dữ liệu đã tồn tại.',
    COMMON_ACCESS_DENIED: 'Không có quyền truy cập.',

    AUTH_ACCESS_TOKEN_REQUIRED: 'Vui lòng đăng nhập để tiếp tục.',
    AUTH_REGISTER_SUCCESS: 'Đăng ký tài khoản thành công.',
    AUTH_USER_NOT_FOUND: 'Không tìm thấy người dùng.',
    AUTH_TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn.',
    AUTH_INVALID_TOKEN: 'Token không hợp lệ.',
    AUTH_REGISTER_REQUIRED_FIELDS: 'Email, mật khẩu và họ tên là bắt buộc.',
    AUTH_EMAIL_ALREADY_REGISTERED: 'Email đã được đăng ký.',
    AUTH_REGISTRATION_FAILED: 'Đăng ký thất bại. Vui lòng thử lại.',
    AUTH_LOGIN_REQUIRED_FIELDS: 'Email và mật khẩu là bắt buộc.',
    AUTH_INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
    AUTH_LOGIN_FAILED: 'Đăng nhập thất bại. Vui lòng thử lại.',
    AUTH_REFRESH_TOKEN_REQUIRED: 'Refresh token là bắt buộc.',
    AUTH_INVALID_OR_EXPIRED_REFRESH_TOKEN: 'Refresh token không hợp lệ hoặc đã hết hạn.',
    AUTH_INVALID_REFRESH_TOKEN: 'Refresh token không hợp lệ.',
    AUTH_REFRESH_FAILED: 'Làm mới token thất bại. Vui lòng đăng nhập lại.',
    AUTH_LOGOUT_FAILED: 'Đăng xuất thất bại. Vui lòng thử lại.',
    AUTH_EMAIL_REQUIRED: 'Email là bắt buộc.',
    AUTH_ACCOUNT_EMAIL_NOT_FOUND: 'Không tìm thấy tài khoản với email này.',
    AUTH_PASSWORD_RESET_OTP_SENT: 'Nếu email tồn tại, mã đặt lại mật khẩu đã được gửi.',
    AUTH_EMAIL_SERVICE_NOT_CONFIGURED: 'Dịch vụ gửi email chưa được cấu hình.',
    AUTH_EMAIL_SEND_FAILED: 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.',
    AUTH_FORGOT_PASSWORD_FAILED: 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.',
    AUTH_RESET_PASSWORD_REQUIRED_FIELDS: 'Email, mã OTP và mật khẩu mới là bắt buộc.',
    AUTH_RESET_PASSWORD_INVALID_OR_EXPIRED: 'Mã OTP không hợp lệ hoặc đã hết hạn.',
    AUTH_RESET_PASSWORD_TOO_MANY_ATTEMPTS: 'Mã OTP đã bị khóa do nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.',
    AUTH_NEW_PASSWORD_TOO_SHORT: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
    AUTH_RESET_PASSWORD_SUCCESS: 'Đặt lại mật khẩu thành công.',
    AUTH_RESET_PASSWORD_FAILED: 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.',

    USER_NOT_FOUND: 'Không tìm thấy người dùng.',
    USER_PROFILE_RETRIEVE_FAILED: 'Không thể lấy thông tin hồ sơ.',
    USER_PROFILE_UPDATE_FAILED: 'Cập nhật hồ sơ thất bại.',
    USER_PASSWORD_REQUIRED: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc.',
    USER_PASSWORD_TOO_SHORT: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
    USER_CURRENT_PASSWORD_INCORRECT: 'Mật khẩu hiện tại không đúng.',
    USER_PASSWORD_CHANGE_FAILED: 'Đổi mật khẩu thất bại.',
    USER_AVATAR_FILE_REQUIRED: 'Vui lòng chọn file ảnh.',
    USER_AVATAR_INVALID_FILE_TYPE: 'File ảnh không hợp lệ. Chỉ chấp nhận JPG, PNG và WEBP.',
    USER_AVATAR_TOO_LARGE: 'File ảnh không được vượt quá 5MB.',
    USER_AVATAR_UNEXPECTED_FIELD: 'Field upload không hợp lệ. Hãy gửi file với field name là avatar.',
    USER_AVATAR_MULTIPART_INVALID: 'Request upload không hợp lệ. Hãy gửi multipart/form-data kèm file field avatar.',
    USER_AVATAR_INVALID_URL: 'URL ảnh đại diện không hợp lệ. Hãy dùng URL hoặc đường dẫn ảnh do server upload trả về.',
    USER_AVATAR_UPLOAD_FAILED: 'Tải ảnh đại diện thất bại.',
    USER_SEARCH_FAILED: 'Tìm kiếm người dùng thất bại.',

    DEVICE_REGISTER_REQUIRED_FIELDS: 'Device token là bắt buộc.',
    DEVICE_INVALID_PLATFORM: 'Nền tảng không hợp lệ. Giá trị hợp lệ: {{platforms}}.',
    DEVICE_UNREGISTER_NOT_FOUND: 'Không tìm thấy device token hoặc token không thuộc về người dùng này.',
    DEVICE_REGISTER_FAILED: 'Đăng ký device token thất bại.',
    DEVICE_UNREGISTER_FAILED: 'Hủy đăng ký device token thất bại.',
    DEVICE_TOKENS_NOT_FOUND: 'Không tìm thấy device token đã đăng ký cho tài khoản này.',
    DEVICE_SEND_NOTIFICATION_FAILED: 'Gửi thông báo thử nghiệm thất bại.',

    TASK_INVALID_STATUS: 'Trạng thái không hợp lệ. Giá trị hợp lệ: {{statuses}}.',
    TASK_RETRIEVE_FAILED: 'Không thể lấy danh sách công việc.',
    TASK_STATS_RETRIEVE_FAILED: 'Không thể lấy thống kê công việc.',
    TASK_TITLE_REQUIRED: 'Tiêu đề là bắt buộc.',
    TASK_INVALID_ID: 'ID công việc không hợp lệ.',
    TASK_NOT_FOUND: 'Không tìm thấy công việc.',
    TASK_CREATE_FAILED: 'Tạo công việc thất bại.',
    TASK_UPDATE_FAILED: 'Cập nhật công việc thất bại.',
    TASK_DELETE_FAILED: 'Xóa công việc thất bại.',

    CONVERSATION_INVALID_TYPE: 'Loại cuộc trò chuyện không hợp lệ.',
    CONVERSATION_PARTICIPANT_IDS_REQUIRED_ARRAY: 'participantIds phải là một mảng.',
    CONVERSATION_PRIVATE_REQUIRES_TWO_PARTICIPANTS: 'Cuộc trò chuyện riêng tư cần đúng 2 người tham gia.',
    CONVERSATION_GROUP_NAME_REQUIRED: 'Cuộc trò chuyện nhóm cần tên nhóm.',
    CONVERSATION_INVALID_PARTICIPANTS: 'Một hoặc nhiều người tham gia không hợp lệ.',
    CONVERSATION_CREATE_FAILED: 'Tạo cuộc trò chuyện thất bại.',
    CONVERSATION_RETRIEVE_FAILED: 'Không thể lấy danh sách cuộc trò chuyện.',
    CONVERSATION_INVALID_ID: 'ID cuộc trò chuyện không hợp lệ.',
    CONVERSATION_NOT_FOUND_OR_ACCESS_DENIED: 'Không tìm thấy cuộc trò chuyện hoặc không có quyền truy cập.',
    CONVERSATION_NAME_REQUIRED: 'Tên là bắt buộc.',
    CONVERSATION_NOT_FOUND: 'Không tìm thấy cuộc trò chuyện.',
    CONVERSATION_PRIVATE_RENAME_FORBIDDEN: 'Không thể đổi tên cuộc trò chuyện riêng tư.',
    CONVERSATION_CREATOR_RENAME_REQUIRED: 'Chỉ người tạo mới có thể đổi tên.',
    CONVERSATION_CREATOR_DELETE_REQUIRED: 'Chỉ người tạo mới có thể xóa cuộc trò chuyện này.',
    CONVERSATION_GROUP_NOT_FOUND: 'Không tìm thấy nhóm.',
    CONVERSATION_CREATOR_ADD_REQUIRED: 'Chỉ người tạo mới có thể thêm thành viên.',
    CONVERSATION_USER_ALREADY_IN_GROUP: 'Người dùng đã ở trong nhóm.',

    MESSAGE_INVALID_CONVERSATION_ID: 'ID cuộc trò chuyện không hợp lệ.',
    MESSAGE_CONTENT_REQUIRED: 'Nội dung tin nhắn là bắt buộc.',
    MESSAGE_INVALID_TYPE: 'Loại tin nhắn không hợp lệ. Chỉ hỗ trợ text, image, video.',
    MESSAGE_CONVERSATION_NOT_FOUND_OR_ACCESS_DENIED: 'Không tìm thấy cuộc trò chuyện hoặc không có quyền truy cập.',
    MESSAGE_RETRIEVE_FAILED: 'Không thể lấy danh sách tin nhắn.',
    MESSAGE_SEND_FAILED: 'Gửi tin nhắn thất bại.',
  },
  en: {
    COMMON_INTERNAL_ERROR: 'Internal server error. Please try again later.',
    COMMON_ROUTE_NOT_FOUND: 'Route {{route}} not found.',
    COMMON_INVALID_ID: 'Invalid ID format.',
    COMMON_INVALID_JSON: 'Invalid JSON payload.',
    COMMON_VALIDATION_ERROR: 'Validation failed.',
    COMMON_DUPLICATE_RESOURCE: 'Duplicate field value. This resource already exists.',
    COMMON_ACCESS_DENIED: 'Access denied.',

    AUTH_ACCESS_TOKEN_REQUIRED: 'Please sign in to continue.',
    AUTH_REGISTER_SUCCESS: 'Account registered successfully.',
    AUTH_USER_NOT_FOUND: 'User not found.',
    AUTH_TOKEN_EXPIRED: 'Session expired.',
    AUTH_INVALID_TOKEN: 'Invalid token.',
    AUTH_REGISTER_REQUIRED_FIELDS: 'Email, password, and full name are required.',
    AUTH_EMAIL_ALREADY_REGISTERED: 'Email already registered.',
    AUTH_REGISTRATION_FAILED: 'Registration failed. Please try again.',
    AUTH_LOGIN_REQUIRED_FIELDS: 'Email and password are required.',
    AUTH_INVALID_CREDENTIALS: 'Invalid email or password.',
    AUTH_LOGIN_FAILED: 'Login failed. Please try again.',
    AUTH_REFRESH_TOKEN_REQUIRED: 'Refresh token is required.',
    AUTH_INVALID_OR_EXPIRED_REFRESH_TOKEN: 'Invalid or expired refresh token.',
    AUTH_INVALID_REFRESH_TOKEN: 'Invalid refresh token.',
    AUTH_REFRESH_FAILED: 'Token refresh failed. Please login again.',
    AUTH_LOGOUT_FAILED: 'Logout failed. Please try again.',
    AUTH_EMAIL_REQUIRED: 'Email is required.',
    AUTH_ACCOUNT_EMAIL_NOT_FOUND: 'Account with this email does not exist.',
    AUTH_PASSWORD_RESET_OTP_SENT: 'If the email exists, a password reset code has been sent.',
    AUTH_EMAIL_SERVICE_NOT_CONFIGURED: 'Email service is not configured.',
    AUTH_EMAIL_SEND_FAILED: 'Failed to send password reset email. Please try again.',
    AUTH_FORGOT_PASSWORD_FAILED: 'Failed to reset password. Please try again.',
    AUTH_RESET_PASSWORD_REQUIRED_FIELDS: 'Email, OTP, and new password are required.',
    AUTH_RESET_PASSWORD_INVALID_OR_EXPIRED: 'OTP is invalid or expired.',
    AUTH_RESET_PASSWORD_TOO_MANY_ATTEMPTS: 'OTP is locked due to too many failed attempts. Please request a new code.',
    AUTH_NEW_PASSWORD_TOO_SHORT: 'New password must be at least 6 characters.',
    AUTH_RESET_PASSWORD_SUCCESS: 'Password reset successfully.',
    AUTH_RESET_PASSWORD_FAILED: 'Failed to reset password. Please try again.',

    USER_NOT_FOUND: 'User not found.',
    USER_PROFILE_RETRIEVE_FAILED: 'Failed to retrieve profile.',
    USER_PROFILE_UPDATE_FAILED: 'Failed to update profile.',
    USER_PASSWORD_REQUIRED: 'Current password and new password are required.',
    USER_PASSWORD_TOO_SHORT: 'New password must be at least 6 characters.',
    USER_CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect.',
    USER_PASSWORD_CHANGE_FAILED: 'Failed to change password.',
    USER_AVATAR_FILE_REQUIRED: 'No image file provided.',
    USER_AVATAR_INVALID_FILE_TYPE: 'Invalid image file. Only JPG, PNG and WEBP are allowed.',
    USER_AVATAR_TOO_LARGE: 'Image file must not exceed 5MB.',
    USER_AVATAR_UNEXPECTED_FIELD: 'Invalid upload field. Send the file using the avatar field name.',
    USER_AVATAR_MULTIPART_INVALID: 'Invalid upload request. Send multipart/form-data with an avatar file field.',
    USER_AVATAR_INVALID_URL: 'Invalid avatar URL. Use the avatar URL or path returned by the server upload API.',
    USER_AVATAR_UPLOAD_FAILED: 'Failed to upload avatar.',
    USER_SEARCH_FAILED: 'Failed to search users.',

    DEVICE_REGISTER_REQUIRED_FIELDS: 'Device token is required.',
    DEVICE_INVALID_PLATFORM: 'Invalid platform. Must be one of: {{platforms}}.',
    DEVICE_UNREGISTER_NOT_FOUND: 'Device token not found or does not belong to this user.',
    DEVICE_REGISTER_FAILED: 'Failed to register device token.',
    DEVICE_UNREGISTER_FAILED: 'Failed to unregister device token.',
    DEVICE_TOKENS_NOT_FOUND: 'No registered device tokens found for this account.',
    DEVICE_SEND_NOTIFICATION_FAILED: 'Failed to send test notification.',

    TASK_INVALID_STATUS: 'Invalid status. Must be one of: {{statuses}}.',
    TASK_RETRIEVE_FAILED: 'Failed to retrieve tasks.',
    TASK_STATS_RETRIEVE_FAILED: 'Failed to retrieve task statistics.',
    TASK_TITLE_REQUIRED: 'Title is required.',
    TASK_INVALID_ID: 'Invalid task ID format.',
    TASK_NOT_FOUND: 'Task not found.',
    TASK_CREATE_FAILED: 'Failed to create task.',
    TASK_UPDATE_FAILED: 'Failed to update task.',
    TASK_DELETE_FAILED: 'Failed to delete task.',

    CONVERSATION_INVALID_TYPE: 'Invalid conversation type.',
    CONVERSATION_PARTICIPANT_IDS_REQUIRED_ARRAY: 'participantIds must be an array.',
    CONVERSATION_PRIVATE_REQUIRES_TWO_PARTICIPANTS: 'Private conversation requires exactly 2 participants.',
    CONVERSATION_GROUP_NAME_REQUIRED: 'Group conversation requires a name.',
    CONVERSATION_INVALID_PARTICIPANTS: 'One or more invalid participant IDs.',
    CONVERSATION_CREATE_FAILED: 'Failed to create conversation.',
    CONVERSATION_RETRIEVE_FAILED: 'Failed to retrieve conversations.',
    CONVERSATION_INVALID_ID: 'Invalid conversation ID.',
    CONVERSATION_NOT_FOUND_OR_ACCESS_DENIED: 'Conversation not found or access denied.',
    CONVERSATION_NAME_REQUIRED: 'Name is required.',
    CONVERSATION_NOT_FOUND: 'Conversation not found.',
    CONVERSATION_PRIVATE_RENAME_FORBIDDEN: 'Cannot rename private conversation.',
    CONVERSATION_CREATOR_RENAME_REQUIRED: 'Only creator can rename.',
    CONVERSATION_CREATOR_DELETE_REQUIRED: 'Only creator can delete this conversation.',
    CONVERSATION_GROUP_NOT_FOUND: 'Group not found.',
    CONVERSATION_CREATOR_ADD_REQUIRED: 'Only creator can add participants.',
    CONVERSATION_USER_ALREADY_IN_GROUP: 'User already in group.',

    MESSAGE_INVALID_CONVERSATION_ID: 'Invalid conversation ID.',
    MESSAGE_CONTENT_REQUIRED: 'Message content is required.',
    MESSAGE_INVALID_TYPE: 'Invalid message type. Supported types are text, image, and video.',
    MESSAGE_CONVERSATION_NOT_FOUND_OR_ACCESS_DENIED: 'Conversation not found or access denied.',
    MESSAGE_RETRIEVE_FAILED: 'Failed to retrieve messages.',
    MESSAGE_SEND_FAILED: 'Failed to send message.',
  },
};

const detectLocale = (acceptLanguage) => {
  const header = String(acceptLanguage || '').toLowerCase();
  const candidates = header
    .split(',')
    .map((item) => item.split(';')[0].trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    const locale = candidate.split('-')[0];
    if (SUPPORTED_LOCALES.includes(locale)) return locale;
  }

  return DEFAULT_LOCALE;
};

const interpolate = (template, params = {}) => {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : '';
  });
};

const translate = (locale, code, params = {}) => {
  const selectedLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  const template = messages[selectedLocale][code] || messages.en[code] || code;
  return interpolate(template, params);
};

module.exports = {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  detectLocale,
  translate,
};
