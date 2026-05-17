const crypto = require('crypto');

const MAX_HEADER_LENGTH = 240;
const ALLOWED_PLATFORMS = ['android', 'ios', 'web'];

const cleanHeader = (value, maxLength = MAX_HEADER_LENGTH) => {
  if (value === undefined || value === null) return null;

  const cleaned = String(value).trim();
  if (!cleaned) return null;

  return cleaned.slice(0, maxLength);
};

const parseVersionCode = (value) => {
  const cleaned = cleanHeader(value, 32);
  if (!cleaned) return null;

  const versionCode = Number.parseInt(cleaned, 10);
  return Number.isNaN(versionCode) ? null : versionCode;
};

const normalizePlatform = (value) => {
  const platform = cleanHeader(value, 32)?.toLowerCase();
  if (!platform) return null;

  return ALLOWED_PLATFORMS.includes(platform) ? platform : 'unknown';
};

const normalizeRequestId = (value) => {
  const cleaned = cleanHeader(value, 128);
  if (!cleaned) return crypto.randomUUID();

  return /^[a-zA-Z0-9._:-]+$/.test(cleaned) ? cleaned : crypto.randomUUID();
};

const hashDeviceId = (deviceId) => {
  if (!deviceId) return null;

  const secret = cleanHeader(process.env.DEVICE_ID_HASH_SECRET, 512);
  if (!secret) return null;

  return crypto
    .createHmac('sha256', secret)
    .update(deviceId)
    .digest('hex');
};

const requestContextMiddleware = (req, res, next) => {
  const requestId = normalizeRequestId(req.get('X-Request-Id'));
  const deviceId = cleanHeader(req.get('X-Device-Id'), 160);

  req.requestId = requestId;
  req.client = {
    appVersionCode: parseVersionCode(req.get('X-App-Version-Code')),
    appVersionName: cleanHeader(req.get('X-App-Version-Name'), 80) || 'unknown',
    platform: normalizePlatform(req.get('X-Platform')),
    osVersion: cleanHeader(req.get('X-OS-Version'), 80),
    deviceModel: cleanHeader(req.get('X-Device-Model'), 120),
    deviceIdHash: hashDeviceId(deviceId),
    userAgent: cleanHeader(req.get('User-Agent'), MAX_HEADER_LENGTH),
    locale: req.locale,
  };

  res.setHeader('X-Request-Id', requestId);
  next();
};

module.exports = requestContextMiddleware;
