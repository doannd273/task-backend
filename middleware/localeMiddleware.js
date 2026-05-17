const { detectLocale } = require('../utils/i18n');

const localeMiddleware = (req, res, next) => {
  req.locale = detectLocale(req.headers['accept-language']);
  res.setHeader('Content-Language', req.locale);
  next();
};

module.exports = localeMiddleware;
