// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyDqHSFbWN-YL7FmPepnyuIcbBbWo7Z7r7k",
    authDomain: "flixdropchms.firebaseapp.com",
    projectId: "flixdropchms",
    storageBucket: "flixdropchms.firebasestorage.app",
    messagingSenderId: "549813245391",
    appId: "1:549813245391:web:04ad370f70ccbb396e6eba",
    measurementId: "G-LLH8C1Q5KJ",
  },
  server: {
    // url: "https://reluctantly-waveless-milagros.ngrok-free.dev",
    // url: "http://localhost:9000",
    url: "https://chms-backend.flixdrop.com"
  },
};
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
