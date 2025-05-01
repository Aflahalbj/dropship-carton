
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
    BluetoothLe: {
      displayStrings: {
        scanning: "Mencari perangkat...",
        cancel: "Batal",
        availableDevices: "Perangkat Tersedia",
        noDeviceFound: "Tidak ada perangkat ditemukan"
      }
    },
    PermissionsAndroid: {
      BLUETOOTH: true,
      BLUETOOTH_ADMIN: true,
      BLUETOOTH_SCAN: true,
      BLUETOOTH_CONNECT: true,
      BLUETOOTH_ADVERTISE: true,
      ACCESS_COARSE_LOCATION: true,
      ACCESS_FINE_LOCATION: true
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
    // Add permission configurations
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
