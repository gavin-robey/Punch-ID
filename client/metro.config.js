const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;

const nativewindConfig = withNativewind(config, { inlineRem: 16 });
const nativewindResolveRequest = nativewindConfig.resolver.resolveRequest;

// react-native-css swaps react-native-web components for its className wrappers, but it also
// rewrites react-native-web's own internal imports (e.g. Animated's FlatList). The wrapper then
// requires react-native-web's index while that index is still loading, so web crashes with
// "Cannot read properties of undefined (reading 'default')". Leave imports from inside
// react-native-web to the default resolver. babel.config.js skips nativewind's import plugin for
// the same files, since it does the same rewrite at transform time.
const reactNativeWebDir = `${path.sep}react-native-web${path.sep}`;

nativewindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && context.originModulePath.includes(reactNativeWebDir)) {
    return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
  }
  return nativewindResolveRequest(context, moduleName, platform);
};

module.exports = nativewindConfig;
