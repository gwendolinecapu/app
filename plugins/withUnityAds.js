const { withAppBuildGradle, withDangerousMod, withPlugins } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withUnityAdsAndroid = (config) => {
    return withAppBuildGradle(config, (config) => {
        if (!config.modResults.contents.includes('com.google.ads.mediation:unity')) {
            config.modResults.contents += `\n
dependencies {
    implementation 'com.unity3d.ads:unity-ads:4.12.0'
    implementation 'com.google.ads.mediation:unity:4.12.0.0'
}
`;
        }
        return config;
    });
};

const withUnityAdsIos = (config) => {
    return withDangerousMod(config, [
        'ios',
        async (config) => {
            const podfile = path.join(config.modRequest.platformProjectRoot, 'Podfile');
            if (fs.existsSync(podfile)) {
                let contents = fs.readFileSync(podfile, 'utf-8');
                if (!contents.includes('GoogleMobileAdsMediationUnity')) {
                    // Add pod after 'use_expo_modules!'
                    contents = contents.replace(
                        /use_expo_modules!/g,
                        "use_expo_modules!\n  pod 'GoogleMobileAdsMediationUnity'"
                    );
                    fs.writeFileSync(podfile, contents);
                }
            }
            return config;
        },
    ]);
};

const withUnityAds = (config) => {
    return withPlugins(config, [withUnityAdsAndroid, withUnityAdsIos]);
};

module.exports = withUnityAds;
