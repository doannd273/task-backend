const DeviceToken = require('../models/DeviceToken');
const { sendFcmNotification } = require('../utils/fcmSender');
const { sendError } = require('../utils/response');

const VALID_PLATFORMS = ['android', 'ios'];

const normalizePlatform = (platform) => String(platform || 'android').trim().toLowerCase();
const normalizeToken = (token) => String(token || '').trim();
const normalizeNotificationData = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {};
  }

  return Object.entries(data).reduce((payload, [key, value]) => {
    if (value !== undefined && value !== null) {
      payload[key] = String(value);
    }
    return payload;
  }, {});
};

const isInvalidFcmTokenError = (error) => {
  const code = getFcmErrorCode(error);
  const message = getFcmErrorMessage(error);

  if (code === 'messaging/invalid-argument') {
    return message.toLowerCase().includes('registration token');
  }

  return [
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
  ].includes(code);
};

const getFcmErrorCode = (error) => {
  return (
    error?.code ||
    error?.errorInfo?.code ||
    error?.cause?.code ||
    error?.cause?.errorInfo?.code ||
    'UNKNOWN_ERROR'
  );
};

const getFcmErrorMessage = (error) => {
  return (
    error?.message ||
    error?.errorInfo?.message ||
    error?.cause?.message ||
    error?.cause?.errorInfo?.message ||
    'Unknown FCM error'
  );
};

const summarizeFcmErrors = (errors) => {
  const uniqueErrors = new Map();

  errors.forEach((error) => {
    if (!uniqueErrors.has(error.code)) {
      uniqueErrors.set(error.code, error);
    }
  });

  return [...uniqueErrors.values()];
};

const sendMongooseValidationError = (req, res, error) => {
  return sendError(req, res, 400, 'COMMON_VALIDATION_ERROR', {}, {
    details: Object.values(error.errors).map((val) => val.message),
  });
};

const registerToken = async (req, res) => {
  try {
    const token = normalizeToken(req.body.token);
    const platform = normalizePlatform(req.body.platform);

    if (!token) {
      return sendError(req, res, 400, 'DEVICE_REGISTER_REQUIRED_FIELDS');
    }

    if (!VALID_PLATFORMS.includes(platform)) {
      return sendError(req, res, 400, 'DEVICE_INVALID_PLATFORM', {
        platforms: VALID_PLATFORMS.join(', '),
      });
    }

    await DeviceToken.findOneAndUpdate(
      {
        token,
      },
      {
        $set: {
          userId: req.user._id,
          platform,
        },
        $setOnInsert: {
          token,
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Device token registered successfully.',
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendMongooseValidationError(req, res, error);
    }

    if (error.code === 11000) {
      return sendError(req, res, 409, 'COMMON_DUPLICATE_RESOURCE');
    }

    console.error('Register device token error:', error.message);
    return sendError(req, res, 500, 'DEVICE_REGISTER_FAILED');
  }
};

const unregisterToken = async (req, res) => {
  try {
    const token = normalizeToken(req.body.token);

    if (!token) {
      return sendError(req, res, 400, 'DEVICE_REGISTER_REQUIRED_FIELDS');
    }

    const deletedToken = await DeviceToken.findOneAndDelete({
      userId: req.user._id,
      token,
    });

    if (!deletedToken) {
      return sendError(req, res, 404, 'DEVICE_UNREGISTER_NOT_FOUND');
    }

    return res.status(200).json({
      success: true,
      data: {
        message: 'Device token unregistered successfully.',
      },
    });
  } catch (error) {
    console.error('Unregister device token error:', error.message);
    return sendError(req, res, 500, 'DEVICE_UNREGISTER_FAILED');
  }
};

const testNotificationToMe = async (req, res) => {
  try {
    const title = String(req.body.title || '').trim() || 'Test Notification';
    const body = String(req.body.body || '').trim() || 'This is a test push notification.';
    const data = normalizeNotificationData(req.body.data);

    const deviceTokens = await DeviceToken.find({ userId: req.user._id })
      .select('token')
      .lean();

    if (!deviceTokens.length) {
      return sendError(req, res, 404, 'DEVICE_TOKENS_NOT_FOUND');
    }

    const results = await Promise.allSettled(
      deviceTokens.map((deviceToken) => sendFcmNotification(deviceToken.token, title, body, data))
    );

    const messageIds = [];
    const invalidTokens = [];
    const failedErrors = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        messageIds.push(result.value);
        return;
      }

      const error = result.reason;
      const code = getFcmErrorCode(error);
      const message = getFcmErrorMessage(error);

      failedErrors.push({ code, message });
      console.error('Test notification FCM send failed:', {
        userId: String(req.user._id),
        deviceTokenId: String(deviceTokens[index]._id),
        code,
        message,
      });

      if (isInvalidFcmTokenError(error)) {
        invalidTokens.push(deviceTokens[index].token);
      }
    });

    if (invalidTokens.length) {
      await DeviceToken.deleteMany({
        userId: req.user._id,
        token: { $in: invalidTokens },
      });
    }

    if (!messageIds.length && invalidTokens.length === deviceTokens.length) {
      return sendError(req, res, 404, 'DEVICE_TOKENS_NOT_FOUND', {}, {
        data: {
          failedCount: results.length,
          removedInvalidTokenCount: invalidTokens.length,
          errors: summarizeFcmErrors(failedErrors),
        },
      });
    }

    if (!messageIds.length) {
      return sendError(req, res, 500, 'DEVICE_SEND_NOTIFICATION_FAILED', {}, {
        data: {
          failedCount: results.length,
          removedInvalidTokenCount: invalidTokens.length,
          errors: summarizeFcmErrors(failedErrors),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Test notification sent successfully.',
      data: {
        sentCount: messageIds.length,
        failedCount: results.length - messageIds.length,
        removedInvalidTokenCount: invalidTokens.length,
        messageIds,
      },
    });
  } catch (error) {
    console.error('Test notification to me error:', error.message);
    return sendError(req, res, 500, 'DEVICE_SEND_NOTIFICATION_FAILED');
  }
};

module.exports = {
  registerToken,
  unregisterToken,
  testNotificationToMe,
};
