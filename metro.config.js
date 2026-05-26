const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force the CJS build of @supabase/supabase-js.
  //
  // Metro's package-exports resolver picks the ESM entry point (`dist/index.mjs`)
  // when the importing file uses ES module syntax.  That ESM build contains:
  //
  //   import(/* webpackIgnore: true */ /* turbopackIgnore: true */ OTEL_PKG)
  //
  // Metro intentionally skips transforming dynamic imports tagged with
  // webpackIgnore, leaving the raw `import()` expression in the bundle.
  // hermesc cannot compile this and exits with code 2.
  //
  // The CJS build (`dist/index.cjs`) already has this call pre-compiled to
  // a safe `Promise.resolve(...).then(s => require(s))` form, so we pin to it.
  if (moduleName === '@supabase/supabase-js') {
    const cjsPath = require.resolve('@supabase/supabase-js/dist/index.cjs');
    return { filePath: cjsPath, type: 'sourceFile' };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
