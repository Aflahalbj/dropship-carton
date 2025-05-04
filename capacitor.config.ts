
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.dropshipcarton',
  appName: 'dropship-carton',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['*.lovableproject.com']
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    BluetoothPrinter: {
      // Enhanced printer configurations
      scanDuration: 15000, // 15 seconds for thorough scanning
      reconnectAttempts: 3,  // Try reconnecting up to 3 times
      printerCommands: {
        initialize: '\x1B@', // ESC @ - Initialize printer
        alignCenter: '\x1B\x61\x01', // ESC a 1 - Center alignment
        alignLeft: '\x1B\x61\x00', // ESC a 0 - Left alignment
        feedLine: '\x0A', // LF - Line feed
        cutPaper: '\x1D\x56\x42\x00', // GS V B 0 - Cut paper
      }
    }
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
    },
    minSdkVersion: 23,
    // Enhanced permissions for Bluetooth
    permissions: [
      "android.permission.BLUETOOTH",
      "android.permission.BLUETOOTH_ADMIN",
      "android.permission.BLUETOOTH_SCAN",
      "android.permission.BLUETOOTH_CONNECT",
      "android.permission.BLUETOOTH_ADVERTISE",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION"
    ]
  }
};

export default config;
