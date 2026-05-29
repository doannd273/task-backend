const admin = require('../config/firebase');

/**
 * Gửi FCM notification đến một device token.
 * @param {string} token - FCM device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Custom data payload (key-value strings)
 */
const sendFcmNotification = async (token, title, body, data = {}) => {
  const message = {
    token,
    notification: {
      title,
      body,
    },
    data,
    android: {
      priority: 'high',
    },
  };

  return admin.messaging().send(message);
};

module.exports = {
  sendFcmNotification,
};
