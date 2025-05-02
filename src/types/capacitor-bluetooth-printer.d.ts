
declare module 'capacitor-bluetooth-printer' {
  interface BluetoothPrinterPlugin {
    initialize(): Promise<{ value: boolean }>;
    scan(options?: { scanDuration?: number }): Promise<{ value: boolean, devices?: Array<{ address: string, name: string }> }>;
    connect(options: { address: string }): Promise<{ value: boolean }>;
    disconnect(): Promise<{ value: boolean }>;
    print(options: { text: string }): Promise<{ value: boolean }>;
  }
  
  // Export the plugin instance
  export const BluetoothPrinter: BluetoothPrinterPlugin;
}
