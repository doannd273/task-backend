#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_LOCAL_PROPERTIES_RELATIVE_PATH = '../android-story/TreeTask/local.properties';
const DEFAULT_PROPERTY_KEY = 'DEV_BASE_API_URL';
const DEFAULT_PORT = '3000';

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const localPropertiesPath = path.resolve(
  PROJECT_ROOT,
  args.path || process.env.ANDROID_LOCAL_PROPERTIES_PATH || DEFAULT_LOCAL_PROPERTIES_RELATIVE_PATH
);
const propertyKey = args.key || process.env.ANDROID_DEV_API_PROPERTY || DEFAULT_PROPERTY_KEY;
const port = String(args.port || process.env.PORT || DEFAULT_PORT);
const selectedHost = args.host || args.ip || process.env.DEV_BASE_API_HOST || getLanIPv4();
const baseUrl = ensureTrailingSlash(`http://${selectedHost}:${port}`);
const propertyValue = JSON.stringify(baseUrl);

if (!fs.existsSync(localPropertiesPath)) {
  fail(`local.properties not found: ${localPropertiesPath}`);
}

const originalContent = fs.readFileSync(localPropertiesPath, 'utf8');
const nextContent = setProperty(originalContent, propertyKey, propertyValue);

if (args.dryRun) {
  console.log(`[dry-run] ${propertyKey}=${propertyValue}`);
  console.log(`[dry-run] target=${localPropertiesPath}`);
  console.log(nextContent === originalContent ? '[dry-run] no change needed' : '[dry-run] file would be updated');
  process.exit(0);
}

if (nextContent === originalContent) {
  console.log(`${propertyKey} is already ${propertyValue}`);
  process.exit(0);
}

fs.writeFileSync(localPropertiesPath, nextContent, 'utf8');
console.log(`Updated ${propertyKey}=${propertyValue}`);
console.log(`File: ${localPropertiesPath}`);

function parseArgs(rawArgs) {
  const parsedArgs = {};

  for (let index = 0; index < rawArgs.length; index += 1) {
    const currentArg = rawArgs[index];

    if (currentArg === '--help' || currentArg === '-h') {
      parsedArgs.help = true;
      continue;
    }

    if (currentArg === '--dry-run') {
      parsedArgs.dryRun = true;
      continue;
    }

    if (currentArg.startsWith('--')) {
      const [name, inlineValue] = currentArg.slice(2).split('=', 2);
      const value = inlineValue !== undefined ? inlineValue : rawArgs[index + 1];

      if (inlineValue === undefined) {
        index += 1;
      }

      parsedArgs[toCamelCase(name)] = value;
    }
  }

  return parsedArgs;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function getLanIPv4() {
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

  const preferredCandidate =
    candidates.find((candidate) => candidate.interfaceName.startsWith('en')) ||
    candidates.find((candidate) => candidate.address.startsWith('192.168.')) ||
    candidates.find((candidate) => candidate.address.startsWith('10.')) ||
    candidates.find((candidate) => candidate.address.startsWith('172.')) ||
    candidates[0];

  if (!preferredCandidate) {
    fail('No LAN IPv4 address found. Pass one manually with --host 192.168.x.x');
  }

  return preferredCandidate.address;
}

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

function setProperty(content, key, value) {
  const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.split(/\r?\n/);
  const propertyPattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=`);
  let updated = false;

  const nextLines = lines.map((line) => {
    if (!updated && propertyPattern.test(line)) {
      updated = true;
      return `${key}=${value}`;
    }

    return line;
  });

  if (!updated) {
    const hasFinalEmptyLine = nextLines.length > 0 && nextLines[nextLines.length - 1] === '';
    if (hasFinalEmptyLine) {
      nextLines.splice(nextLines.length - 1, 0, `${key}=${value}`);
    } else {
      nextLines.push(`${key}=${value}`);
    }
  }

  return nextLines.join(lineEnding);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function printHelp() {
  console.log(`
Usage:
  node scripts/syncAndroidDevUrl.js [options]

Options:
  --dry-run               Print the detected URL without writing local.properties
  --host <ip>             Override detected LAN IP
  --port <port>           Override API port
  --path <file>           Override Android local.properties path
  --key <property>        Override property key, default DEV_BASE_API_URL

Environment variables:
  PORT
  DEV_BASE_API_HOST
  ANDROID_LOCAL_PROPERTIES_PATH
  ANDROID_DEV_API_PROPERTY
`);
}
