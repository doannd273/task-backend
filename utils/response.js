const { DEFAULT_LOCALE, translate } = require('./i18n');

const getLocale = (req) => req.locale || DEFAULT_LOCALE;

const sendError = (req, res, statusCode, code, params = {}, extra = {}) => {
  return res.status(statusCode).json({
    success: false,
    code,
    message: translate(getLocale(req), code, params),
    requestId: req.requestId,
    ...extra,
  });
};

module.exports = {
  sendError,
};
