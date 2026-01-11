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

        // 1. Ensure use_modular_headers! isn't prepended (we'll use selective pre_install)
        contents = contents.replace(/^use_modular_headers!\n/, "");

        // 2. Clear old custom pre_install blocks to avoid duplication
        contents = contents.replace(/\n\s*pre_install do \|installer\|[\s\S]*?end\n/g, "\n");

        // 3. Selective pre_install
        const preInstallCode = `
  pre_install do |installer|
    installer.pod_targets.each do |pod|
      if ['FirebaseCoreInternal', 'GoogleUtilities', 'MediaPipeTasksGenAIC', 'expo-llm-mediapipe'].include?(pod.name)
        pod.use_modular_headers = true
      end
    end
  end
`;
        contents = contents.replace(/target 'PluralConnect' do/, preInstallCode + "\ntarget 'PluralConnect' do");

        // 4. Robust post_install injection
        // We'll search for the existing post_install and inject our settings at the very beginning of it
        const buildSettingsCode = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        if target.name.start_with?('RNFBApp') || target.name.start_with?('RNFBAnalytics')
           config.build_settings['DEFINES_MODULE'] = 'NO'
        end
      end
    end`;

        // If our block isn't there, add it
        if (!contents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
          contents = contents.replace(
            /post_install do \|installer\|/,
            `post_install do |installer|${buildSettingsCode}`
          );
        } else {
          // If it is there, replace the old block with the new one (with DEFINES_MODULE)
          contents = contents.replace(
            /installer\.pods_project\.targets\.each do \|target\|[\s\S]*?end\s*end/,
            buildSettingsCode
          );
        }

        fs.writeFileSync(podfile, contents);
      }
      return config;
    },
  ]);
};

module.exports = withModularHeaders;
