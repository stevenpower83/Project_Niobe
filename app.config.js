export default {
  expo: {
    name: 'Horroscope',
    slug: 'horroscope',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/appicon_1254.png',
    scheme: 'horroscope',
    userInterfaceStyle: 'dark',
    backgroundColor: '#0d0020',
    ios: {
      bundleIdentifier: 'com.powrdata.horroscope',
      icon: './assets/expo.icon',
    },
    android: {
      package: 'com.powrdata.horroscope',
      adaptiveIcon: {
        backgroundColor: '#0d0020',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#0d0020',
          android: {
            image: './assets/images/logo_512.png',
            imageWidth: 200,
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      eas: {
        projectId: process.env.EAS_PROJECT_ID ?? '',
      },
    },
  },
};
