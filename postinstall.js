const fs = require('fs');
const path = require('path');

// Fix any potential issues with NativeWind and Expo Router
console.log('Running post-install script to fix NativeWind and Expo Router compatibility...');

// Update package.json to add postinstall script if not already there
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add CSS support for Metro
const metroConfigPath = path.join(__dirname, 'metro.config.js');
const metroConfig = `// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Support CSS files
config.resolver.sourceExts.push('css');

module.exports = config;`;

fs.writeFileSync(metroConfigPath, metroConfig);

console.log('Post-install completed successfully.');
