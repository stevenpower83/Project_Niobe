export default {
  expo: {
    name: 'Horroscope',
    slug: 'horroscope',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/appicon_1254.png',
    scheme: 'horroscope',
    userInterfaceStyle: 'dark',
    backgroundColor: '#0d0d0d',
    ios: {
      bundleIdentifier: 'com.powrdata.horroscope',
      icon: './assets/images/appicon_1254.png',
    },
    android: {
      package: 'com.powrdata.horroscope',
      adaptiveIcon: {
        backgroundColor: '#1a0000',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'spa',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#0d0d0d',
          android: {
            image: './assets/images/logo_512.png',
            imageWidth: 200,
          },
        },
      ],
    ],
    // EAS Update — OTA JS delivery without store releases
    updates: {
      url: 'https://u.expo.dev/c419ad97-52fe-4b69-bf76-ef02bb02993f',
    },
    // appVersion: OTA updates apply to all builds with the same app version.
    // Bump version in this file when native dependencies change.
    // (fingerprint policy has a Windows/Linux autolinking hash mismatch with EAS)
    runtimeVersion: {
      policy: 'appVersion',
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      supabaseUrl: process.env.SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
      eas: {
        projectId: 'c419ad97-52fe-4b69-bf76-ef02bb02993f',
      },
    },
  },
};
