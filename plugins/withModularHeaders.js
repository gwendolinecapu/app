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

        // 1. CLEANUP: Remove any previous failed attempts
        // Remove the global prepend if it's there
        contents = contents.replace(/^use_modular_headers!\n/, "");
        // Remove any pre_install block entirely (even with nested ends)
        // We use a more aggressive but limited search
        contents = contents.replace(/\n\s*pre_install do \|installer\|[\s\S]*?FirebaseCoreInternal[\s\S]*?end\s*end\s*end/, "");
        contents = contents.replace(/\n\s*pre_install do \|installer\|[\s\S]*?FirebaseCoreInternal[\s\S]*?end\s*end/, "");
        // Clean up the dangling ends specifically
        contents = contents.replace(/prepare_react_native_project!\n\s*end\s*\n\s*end/, "prepare_react_native_project!");

        // 2. APPLY CORRECT GLOBAL SETTING
        if (!contents.includes('use_modular_headers!')) {
          contents = "use_modular_headers!\n" + contents;
        }

        // 3. APPLY AGGRESSIVE POST_INSTALL
        const buildSettingsCode = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        config.build_settings['OTHER_CFLAGS'] ||= ['$(inherited)']
        config.build_settings['OTHER_CFLAGS'] << '-Wno-non-modular-include-in-framework-module'
        config.build_settings['OTHER_CPLUSPLUSFLAGS'] ||= ['$(inherited)']
        config.build_settings['OTHER_CPLUSPLUSFLAGS'] << '-Wno-non-modular-include-in-framework-module'
        if target.name.start_with?('RNFBApp') || target.name.start_with?('RNFBAnalytics')
           config.build_settings['DEFINES_MODULE'] = 'NO'
        end
      end
    end`;

        if (contents.includes('post_install do |installer|')) {
          // Check if we already injected our block
          if (!contents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
            contents = contents.replace(
              /post_install do \|installer\|/,
              `post_install do |installer|${buildSettingsCode}`
            );
          }
        }

        fs.writeFileSync(podfile, contents);
      }
      return config;
    },
  ]);
};

module.exports = withModularHeaders;
