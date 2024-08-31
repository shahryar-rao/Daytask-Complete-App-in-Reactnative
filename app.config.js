import 'dotenv/config';

export default {
  expo: {
    name: "daytaskapp",
    slug: "daytaskapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.shahryar.DayTaskApp", // Replace this with your own package name
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.shahryar.day_task_app", // Replace this with your own package name
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    assets: [
      "./assets/fonts"
    ],
    plugins: [
      'expo-font' // Ensure this is a string, not a variable
    ],
    extra: {
      apiKey: process.env.API_KEY,
      authDomain: process.env.AUTH_DOMAIN,
      projectId: process.env.PROJECT_ID,
      storageBucket: process.env.STORAGE_BUCKET,
      messagingSenderId: process.env.MESSAGING_SENDER_ID,
      appId: process.env.APP_ID,
      measurementId: process.env.MEASUREMENT_ID,
      AI_API_KEY: process.env.AI_API_KEY,
      AI_API_URL: process.env.AI_API_URL,
      eas: {
        projectId: "c4bad84e-ff78-469d-a4c4-cb94f6f5c923",
      },
    }
  }
};
