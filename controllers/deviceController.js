const DeviceToken = require('../models/DeviceToken');
const { sendFcmNotification } = require('../utils/fcmSender');
const { sendError } = require('../utils/response');

const VALID_PLATFORMS = ['android', 'ios'];

const normalizePlatform = (platform) => String(platform || 'android').trim().toLowerCase();
const normalizeToken = (token) => String(token || '').trim();

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
        userId: req.user._id,
        token,
      },
      {
        $set: {
          platform,
        },
        $setOnInsert: {
          userId: req.user._id,
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

const testNotification = async (req, res) => {
  try {
    const token = normalizeToken(req.body.token);
    const title = String(req.body.title || 'Test Notification').trim();
    const body = String(req.body.body || 'This is a test push notification.').trim();
    const data = req.body.data && typeof req.body.data === 'object' ? req.body.data : {};

    if (!token) {
      return sendError(req, res, 400, 'DEVICE_REGISTER_REQUIRED_FIELDS');
    }

    const messageId = await sendFcmNotification(token, title, body, data);

    return res.status(200).json({
      success: true,
      message: 'Test notification sent successfully.',
      data: { messageId },
    });
  } catch (error) {
    console.error('Test notification error:', error.message);

    if (error.code === 'messaging/registration-token-not-registered') {
      return sendError(req, res, 400, 'DEVICE_TOKEN_NOT_REGISTERED');
    }

    if (error.code === 'messaging/invalid-registration-token') {
      return sendError(req, res, 400, 'DEVICE_TOKEN_INVALID');
    }

    return sendError(req, res, 500, 'DEVICE_SEND_NOTIFICATION_FAILED');
  }
};

module.exports = {
  registerToken,
  unregisterToken,
  testNotification,
};
