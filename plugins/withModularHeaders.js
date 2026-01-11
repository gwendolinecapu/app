const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withModularHeaders = (config) => {
    return withDangerousMod(config, [
        'ios',
        async (config) => {
            const podfile = path.join(config.modRequest.platformProjectRoot, 'Podfile');
            if (fs.existsSync(podfile)) {
                let contents = fs.readFileSync(podfile, 'utf-8');
                if (!contents.includes('use_modular_headers!')) {
                    // Add use_modular_headers! at the top of the Podfile (after platform definition)
                    contents = contents.replace(
                        /platform :ios, '(\d+\.\d+)'/,
                        "platform :ios, '$1'\n\nuse_modular_headers!"
                    );
                    fs.writeFileSync(podfile, contents);
                }
            }
            return config;
        },
    ]);
};

module.exports = withModularHeaders;
