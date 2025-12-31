const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

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

    // Special handling for recyclerlistview resolution issues
    const isInsideRecycler = context.originModulePath && context.originModulePath.includes('recyclerlistview');
    if (moduleName.includes('recyclerlistview') || isInsideRecycler) {
        try {
            return context.resolveRequest(context, moduleName, platform);
        } catch (e) {
            if (isInsideRecycler && moduleName.startsWith('./')) {
                const originDir = path.dirname(context.originModulePath);
                const absolutePath = path.resolve(originDir, moduleName);

                // Try common extensions
                for (const ext of ['.js', '.jsx', '.ts', '.tsx']) {
                    const filePath = absolutePath + ext;
                    if (fs.existsSync(filePath)) {
                        return { filePath, type: 'sourceFile' };
                    }
                }
            }

            // Fallback for package name itself
            if (moduleName === 'recyclerlistview') {
                const resolved = path.resolve(__dirname, 'node_modules/recyclerlistview/dist/reactnative/index.js');
                if (fs.existsSync(resolved)) {
                    return { filePath: resolved, type: 'sourceFile' };
                }
            }
        }
    }

    // Fallback to default resolution
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
