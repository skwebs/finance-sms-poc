const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = function withArm64Only(config) {
  return withAppBuildGradle(config, (config) => {
    let gradle = config.modResults.contents;

    // Add arm64-v8a split APK only
    if (!gradle.includes("splits {")) {
      gradle = gradle.replace(
        /android\s*\{/,
        `android {
    splits {
        abi {
            enable true
            reset()
            include "arm64-v8a"
            universalApk false
        }
    }`,
      );
    }

    config.modResults.contents = gradle;

    return config;
  });
};
