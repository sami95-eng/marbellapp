const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// NativeWind / react-native-css-interop writes its compiled output here;
// Metro must watch it so style changes are picked up during dev.
config.watchFolders = [
  ...(config.watchFolders ?? []),
  path.resolve(__dirname, "node_modules/react-native-css-interop/.cache"),
];

// Enable package.json "exports" field so @supabase/supabase-js
// uses its browser build on web instead of the Node.js build
config.resolver.unstable_enablePackageExports = true;

// Stub the Node-only 'ws' package for web builds.
// @supabase/realtime-js imports 'ws' but uses the native browser
// WebSocket API on web — the import must be silenced for Metro.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "ws" && platform === "web") {
    return { type: "empty" };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  forceWriteFileSystem: true,
});
