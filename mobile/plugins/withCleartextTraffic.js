const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

const { getMainApplicationOrThrow } = AndroidConfig.Manifest;

module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (configWithManifest) => {
    const mainApplication = getMainApplicationOrThrow(configWithManifest.modResults);
    mainApplication.$["android:usesCleartextTraffic"] = "true";

    return configWithManifest;
  });
};
