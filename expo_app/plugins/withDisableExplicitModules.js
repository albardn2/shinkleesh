const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withDisableExplicitModules = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
      let podfile = fs.readFileSync(podfilePath, "utf-8");

      // Add code to disable explicit modules in the post_install block
      const postInstallFix = `
    # Fix for Xcode 26 precompiled module errors
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        bc.build_settings['SWIFT_ENABLE_EXPLICIT_MODULES'] = 'NO'
      end
    end
    installer.pods_project.build_configurations.each do |bc|
      bc.build_settings['SWIFT_ENABLE_EXPLICIT_MODULES'] = 'NO'
    end`;

      // Insert before the closing of post_install
      podfile = podfile.replace(
        /^(\s*react_native_post_install\([\s\S]*?\))\s*\n(\s*end\s*\nend)/m,
        `$1\n${postInstallFix}\n$2`
      );

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};

module.exports = withDisableExplicitModules;
