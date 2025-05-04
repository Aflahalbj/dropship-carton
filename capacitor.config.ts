
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
      // Konfigurasi khusus untuk printer thermal termasuk EcoPrint
      scanDuration: 30000, // 30 detik untuk pemindaian menyeluruh
      reconnectAttempts: 10,  // Peningkatan jumlah percobaan koneksi
      autoEnableBluetooth: true,
      requestPermissionsOnInit: true,
      acceptAllDevices: true, // Menerima semua perangkat untuk meningkatkan deteksi
      discoveryMode: "forced", // Mode pemindaian paksa untuk mendeteksi semua perangkat
      printerCommands: {
        // Dukungan perintah ESC/POS yang diperluas untuk printer thermal
        initialize: '\x1B@', // ESC @ - Initialize printer
        alignCenter: '\x1B\x61\x01', // ESC a 1 - Center alignment
        alignLeft: '\x1B\x61\x00', // ESC a 0 - Left alignment
        feedLine: '\x0A', // LF - Line feed
        cutPaper: '\x1D\x56\x42\x00', // GS V B 0 - Cut paper
        boldOn: '\x1B\x45\x01', // ESC E 1 - Bold on
        boldOff: '\x1B\x45\x00', // ESC E 0 - Bold off
        doubleHeightOn: '\x1B\x21\x10', // ESC ! 16 - Double height on
        doubleHeightOff: '\x1B\x21\x00', // ESC ! 0 - Double height off
        // Perintah khusus untuk EcoPrint
        ecoInitialize: '\x1B@\x1D\x21\x00', // Inisialisasi khusus EcoPrint
        ecoCommand: '\x1B\x40\x1B\x61\x01', // Perintah khusus EcoPrint
        genericThermal: '\x1B@\x1B\x61\x01\x1D\x21\x00', // Perintah generic thermal
        feedAndCut: '\n\n\n\n\x1D\x56\x01', // Feed paper and cut
        // Format khusus untuk tipe printer berbeda
        fullReset: '\x1B\x40\x1D\x49\x01' // Reset penuh printer
      },
      connectionTimeout: 15000, // 15 detik timeout koneksi
      operationTimeout: 10000,  // 10 detik timeout operasi
      discoveryTimeout: 30000, // 30 detik timeout pemindaian perangkat
      // Opsi tambahan untuk mendukung printer standar ESC/POS
      defaultPrinterType: "GENERIC",
      escposMode: true,
      forcePairing: true // Memaksa mode pairing untuk perangkat sulit
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
    // Izin lengkap untuk Bluetooth dengan dukungan fitur penuh
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
