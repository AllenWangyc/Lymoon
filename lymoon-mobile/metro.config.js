const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@app': path.resolve(__dirname, 'app'),
};

module.exports = withNativeWind(config, { input: './global.css' });
