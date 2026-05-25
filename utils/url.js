const trimTrailingSlashes = (value) => String(value || '').replace(/\/+$/, '');

const getBaseUrl = (req) => {
  const publicBaseUrl = trimTrailingSlashes(process.env.PUBLIC_BASE_URL);
  if (publicBaseUrl) return publicBaseUrl;

  if (process.env.NODE_ENV === 'production') return '';

  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = req.get('x-forwarded-host')?.split(',')[0]?.trim();
  const protocol = forwardedProto || req.protocol || 'http';
  const host = forwardedHost || req.get('host');

  return host ? `${protocol}://${host}` : '';
};

const toAbsoluteUrl = (req, value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;

  const baseUrl = getBaseUrl(req);
  if (!baseUrl) return value;

  const path = value.startsWith('/') ? value : `/${value}`;
  return `${baseUrl}${path}`;
};

module.exports = {
  getBaseUrl,
  toAbsoluteUrl,
};
