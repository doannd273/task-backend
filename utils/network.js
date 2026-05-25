const os = require('os');

const getLanIPv4Candidates = () => {
  const networkInterfaces = os.networkInterfaces();
  const candidates = [];

  for (const [interfaceName, addresses] of Object.entries(networkInterfaces)) {
    for (const address of addresses || []) {
      if (!['IPv4', 4].includes(address.family) || address.internal) {
        continue;
      }

      candidates.push({
        interfaceName,
        address: address.address,
      });
    }
  }

  return candidates;
};

const getPreferredLanIPv4 = () => {
  const candidates = getLanIPv4Candidates();
  const preferredCandidate =
    candidates.find((candidate) => candidate.interfaceName.startsWith('en')) ||
    candidates.find((candidate) => candidate.address.startsWith('192.168.')) ||
    candidates.find((candidate) => candidate.address.startsWith('10.')) ||
    candidates.find((candidate) => candidate.address.startsWith('172.')) ||
    candidates[0];

  return preferredCandidate?.address || '';
};

module.exports = {
  getLanIPv4Candidates,
  getPreferredLanIPv4,
};
