const getAuthVersion = (value) => {
  const authVersion = value && value.authVersion;
  if (authVersion === undefined || authVersion === null) return 0;
  return Number.isInteger(authVersion) && authVersion >= 0 ? authVersion : -1;
};

const isAuthVersionValid = (tokenPayload, user) => getAuthVersion(tokenPayload) === getAuthVersion(user);

const bumpAuthVersion = (user) => {
  user.authVersion = getAuthVersion(user) + 1;
};

module.exports = {
  getAuthVersion,
  isAuthVersionValid,
  bumpAuthVersion,
};
