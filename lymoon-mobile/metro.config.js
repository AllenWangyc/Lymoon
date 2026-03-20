const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@app': path.resolve(__dirname, 'app'),
};

// react-native-reanimated@4.x bundles a nested `semver` whose relative
// requires cannot be resolved when Metro's package-exports resolver is
// active. Disabling it restores classic node_modules resolution.
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: './global.css' });
