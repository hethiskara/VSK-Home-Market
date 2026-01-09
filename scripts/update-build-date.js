#!/usr/bin/env node

/**
 * Script to update the build date in buildConfig.js
 * Run this script before generating an APK:
 * node scripts/update-build-date.js
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../src/config/buildConfig.js');

// Get today's date in YYYY-MM-DD format
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const buildDate = `${year}-${month}-${day}`;

const configContent = `// This file is auto-updated during build process
// Build date is set when generating APK
// Last updated: ${new Date().toISOString()}

export const BUILD_DATE = '${buildDate}';
`;

fs.writeFileSync(configPath, configContent);

console.log(`✅ Build date updated to: ${buildDate}`);
console.log(`📁 Config file: ${configPath}`);
