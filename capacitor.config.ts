
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
      // Enhanced printer configurations for better device detection with pairing mode
      scanDuration: 25000, // 25 seconds for thorough scanning (especially for pairing mode)
      reconnectAttempts: 7,  // Try reconnecting up to 7 times for persistent connection
      autoEnableBluetooth: true, // Automatically try to enable Bluetooth
      requestPermissionsOnInit: true, // Request all needed permissions on init
      acceptAllDevices: true, // Accept all Bluetooth devices when scanning (crucial for pairing mode)
      printerCommands: {
        initialize: '\x1B@', // ESC @ - Initialize printer
        alignCenter: '\x1B\x61\x01', // ESC a 1 - Center alignment
        alignLeft: '\x1B\x61\x00', // ESC a 0 - Left alignment
        feedLine: '\x0A', // LF - Line feed
        cutPaper: '\x1D\x56\x42\x00', // GS V B 0 - Cut paper
        boldOn: '\x1B\x45\x01', // ESC E 1 - Bold on
        boldOff: '\x1B\x45\x00', // ESC E 0 - Bold off
        doubleHeightOn: '\x1B\x21\x10', // ESC ! 16 - Double height on
        doubleHeightOff: '\x1B\x21\x00', // ESC ! 0 - Double height off
        // Enhanced formatting commands for various printer models
        ecoInitialize: '\x1B@\x1B!\x00', // Special init for EcoPrint
        genericThermal: '\x1B@\x1B\x61\x01', // Generic thermal printer init
        feedAndCut: '\n\n\n\n\x1D\x56\x01' // Feed paper and cut
      },
      connectionTimeout: 10000, // 10 seconds connection timeout
      operationTimeout: 8000,  // 8 seconds operation timeout
      discoveryTimeout: 25000, // 25 seconds device discovery timeout
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
    // Enhanced permissions for Bluetooth with full feature support
    permissions: [
      "android.permission.BLUETOOTH",
      "android.permission.BLUETOOTH_ADMIN",
      "android.permission.BLUETOOTH_SCAN",
      "android.permission.BLUETOOTH_CONNECT",
      "android.permission.BLUETOOTH_ADVERTISE",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.FOREGROUND_SERVICE"
    ]
  }
};

export default config;
