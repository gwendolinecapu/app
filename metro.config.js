const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure Metro to resolve firebase/auth to the React Native bundle
// This fixes getReactNativePersistence not being exported from firebase/auth
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Redirect firebase/auth to the React Native specific bundle ONLY on native
    if (platform === 'ios' || platform === 'android') {
        if (moduleName === 'firebase/auth' || moduleName === 'firebase/auth/react-native') {
            return {
                filePath: path.resolve(__dirname, 'node_modules/@firebase/auth/dist/rn/index.js'),
                type: 'sourceFile',
            };
        }
    }
    // Fallback to default resolution
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
