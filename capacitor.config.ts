import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.flixdrop.chms",
  appName: "Flixdrop CHMS",
  webDir: "www",
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: "LIGHT",
      backgroundColor: "#ffffff",
    },
    LocalNotifications: {
      smallIcon: "notification_icon",
      sound: "beep.wav",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      splashFullScreen: true,
      launchShowDuration: 2500,
      androidSpinnerStyle: "small",
      ionSpinnerStyle: "small",
      showSpinner: false,
      splashImmersive: true,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_INSIDE",
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      layoutName: "launch_screen",
      useDialog: false,
    },
  },
};

export default config;
