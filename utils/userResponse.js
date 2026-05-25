const { toAbsoluteUrl } = require('./url');

const toPlainObject = (value) => {
  if (!value) return value;
  if (typeof value.toJSON === 'function') return value.toJSON();
  if (typeof value.toObject === 'function') return value.toObject();
  return value;
};

const formatUserResponse = (req, user) => {
  const obj = toPlainObject(user);
  if (!obj || typeof obj !== 'object') return obj;

  return {
    ...obj,
    avatar: toAbsoluteUrl(req, obj.avatar),
  };
};

const formatUsersResponse = (req, users) => users.map((user) => formatUserResponse(req, user));

module.exports = {
  formatUserResponse,
  formatUsersResponse,
};
