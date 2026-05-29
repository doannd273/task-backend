const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const localServiceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

const resolveCredentialPath = () => {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) return localServiceAccountPath;
  return path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
};

const createCredential = () => {
  const credentialPath = resolveCredentialPath();

  if (fs.existsSync(credentialPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
    return admin.credential.cert(serviceAccount);
  }

  return admin.credential.applicationDefault();
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: createCredential(),
  });
}

module.exports = admin;
