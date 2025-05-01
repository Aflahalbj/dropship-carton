
import { toast } from "sonner";
import { CartItem } from '../context/types';

// Import with dynamic checks to prevent build errors
let BluetoothSerial: any = null;
let BleClient: any = null;

// Only import these modules in native environments
if (typeof window !== 'undefined' && window.cordova) {
  try {
    // For Cordova/native environments
    import('@awesome-cordova-plugins/bluetooth-serial').then(module => {
      BluetoothSerial = module.BluetoothSerial;
      console.log('BluetoothSerial module loaded:', BluetoothSerial);
    }).catch(err => console.error('Failed to load BluetoothSerial:', err));
    
    import('@capacitor-community/bluetooth-le').then(module => {
      BleClient = module.BleClient;
      console.log('BleClient module loaded:', BleClient);
    }).catch(err => console.error('Failed to load BleClient:', err));
  } catch (e) {
    console.warn('Bluetooth modules not available in this environment:', e);
  }
}

export interface PrinterDevice {
  id: string;
  name: string;
  address: string;
}

export class BluetoothPrinterService {
  private static instance: BluetoothPrinterService;
  private connectedDevice: PrinterDevice | null = null;
  private isInitialized = false;
  private isCordovaAvailable = false;
  private isNativeApp = false;

  private constructor() {
    // Check if we're in a native environment (Capacitor or Cordova)
    this.isCordovaAvailable = typeof window !== 'undefined' && !!window.cordova;
    this.isNativeApp = this.isCordovaAvailable || (typeof window !== 'undefined' && !!(window as any).Capacitor);
    
    console.log('BluetoothPrinterService initialized:', {
      isCordovaAvailable: this.isCordovaAvailable,
      isNativeApp: this.isNativeApp
    });
  }

  public static getInstance(): BluetoothPrinterService {
    if (!BluetoothPrinterService.instance) {
      BluetoothPrinterService.instance = new BluetoothPrinterService();
    }
    return BluetoothPrinterService.instance;
  }

  public async initialize(): Promise<boolean> {
    try {
      if (!this.isNativeApp) {
        console.warn('Bluetooth features are only available in native apps');
        return false;
      }
      
      console.log('Initializing Bluetooth services...');
      
      // Check if we're in a native environment where BleClient is available
      if (!this.isInitialized) {
        // Try BLE initialization first
        if (BleClient && typeof BleClient.initialize === 'function') {
          console.log('Initializing BLE client...');
          await BleClient.initialize();
          console.log('BLE client initialized successfully');
          this.isInitialized = true;
        }
        // Also check BluetoothSerial availability
        if (BluetoothSerial && typeof BluetoothSerial.isEnabled === 'function') {
          console.log('Checking if BluetoothSerial is enabled...');
          const isEnabled = await BluetoothSerial.isEnabled();
          console.log('BluetoothSerial enabled:', isEnabled);
          if (!isEnabled) {
            console.log('Enabling BluetoothSerial...');
            await BluetoothSerial.enable();
            console.log('BluetoothSerial enabled successfully');
          }
          this.isInitialized = true;
        }
      }
      return this.isInitialized;
    } catch (error) {
      console.error('Failed to initialize Bluetooth:', error);
      return false;
    }
  }

  public async scanForPrinters(): Promise<PrinterDevice[]> {
    try {
      if (!this.isNativeApp) {
        toast.warning('Bluetooth tidak tersedia di browser. Gunakan aplikasi Android untuk fitur ini.');
        return [];
      }
      
      const initialized = await this.initialize();
      console.log('Bluetooth initialized:', initialized);
      
      if (!initialized) {
        toast.error('Gagal menginisialisasi Bluetooth. Pastikan Bluetooth diaktifkan.');
        return [];
      }
      
      let pairedPrinters: PrinterDevice[] = [];
      
      // Check if BluetoothSerial is available
      if (BluetoothSerial && BluetoothSerial.list) {
        try {
          console.log('Getting paired devices from BluetoothSerial...');
          // First try to get paired devices from BluetoothSerial
          const pairedDevices = await BluetoothSerial.list();
          console.log('Paired devices:', pairedDevices);
          
          if (Array.isArray(pairedDevices)) {
            pairedPrinters = pairedDevices.map(device => ({
              id: device.id,
              name: device.name || 'Unknown Device',
              address: device.address
            }));
            console.log('Parsed paired printers:', pairedPrinters);
          } else {
            console.error('BluetoothSerial.list() did not return an array:', pairedDevices);
          }

          // Then try to scan for new devices using BLE if available
          if (BleClient && BleClient.requestLEScan) {
            console.log('Starting BLE scan for additional devices...');
            await BleClient.requestLEScan(
              { services: [] },
              (result) => {
                console.log('BLE scan result:', result);
                if (result.device && result.device.name) {
                  // Check if device is already in the list
                  const existingDevice = pairedPrinters.find(
                    device => device.address === result.device.deviceId
                  );
                  if (!existingDevice) {
                    pairedPrinters.push({
                      id: result.device.deviceId,
                      name: result.device.name || 'Unknown Device',
                      address: result.device.deviceId
                    });
                    console.log('Added new device from BLE scan:', result.device);
                  }
                }
              }
            );

            // Wait a bit to collect devices
            console.log('Waiting for BLE scan to collect devices...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            await BleClient.stopLEScan();
            console.log('BLE scan stopped');
          }
        } catch (error) {
          console.error('Error scanning for Bluetooth devices:', error);
          toast.error('Gagal memindai perangkat Bluetooth');
        }
      } else {
        // If running in a browser or environment without Bluetooth
        console.warn('BluetoothSerial not available:', BluetoothSerial);
        toast.warning('Bluetooth tidak tersedia di browser. Gunakan aplikasi Android untuk fitur ini.');
      }

      return pairedPrinters;
    } catch (error) {
      console.error('Failed to scan for printers:', error);
      toast.error('Gagal memindai printer. Pastikan Bluetooth diaktifkan.');
      return [];
    }
  }

  public async connectToPrinter(device: PrinterDevice): Promise<boolean> {
    try {
      if (!this.isNativeApp) {
        toast.error('Bluetooth tidak tersedia di browser');
        return false;
      }
      
      console.log('Connecting to printer:', device);
      
      if (!BluetoothSerial || !BluetoothSerial.connect) {
        console.error('BluetoothSerial API not available');
        toast.error('API Bluetooth tidak tersedia di perangkat ini');
        return false;
      }
      
      // Disconnect any existing connection first
      await this.disconnect();
      
      // Connect to the new device
      console.log(`Attempting to connect to ${device.name} (${device.address})`);
      await BluetoothSerial.connect(device.address);
      console.log('Connection successful');
      
      this.connectedDevice = device;
      toast.success(`Terhubung ke printer: ${device.name}`);
      return true;
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      toast.error(`Gagal terhubung ke printer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  public async printReceipt(
    items: CartItem[],
    total: number,
    paymentMethod: string,
    customerName: string | undefined,
    cashAmount: number | undefined,
    changeAmount: number | undefined,
    transactionId: string,
    date: Date,
    storeName: string = 'TOKO ABDULLAH',
    storeLocation: string = 'TANGERANG',
    storePhone: string = '083880863610'
  ): Promise<boolean> {
    try {
      console.log('Print receipt requested with parameters:', {
        items,
        total,
        paymentMethod,
        customerName,
        cashAmount,
        changeAmount,
        transactionId,
        date,
        storeName,
        storeLocation,
        storePhone
      });
      
      if (!this.isNativeApp) {
        toast.error('Fitur cetak hanya tersedia di aplikasi Android');
        return false;
      }
      
      if (!this.connectedDevice) {
        toast.error('Tidak ada printer yang terhubung');
        return false;
      }

      if (!BluetoothSerial || !BluetoothSerial.write) {
        console.error('BluetoothSerial API not available for writing');
        toast.error('API Bluetooth tidak tersedia di perangkat ini');
        return false;
      }

      // Enhanced logging
      console.log('Connected device:', this.connectedDevice);
      console.log('BluetoothSerial API available:', !!BluetoothSerial);
      console.log('BluetoothSerial.write available:', !!(BluetoothSerial && BluetoothSerial.write));
      
      // Try to use isConnected method if available
      if (BluetoothSerial.isConnected) {
        try {
          const isConnected = await BluetoothSerial.isConnected();
          console.log('Is printer still connected:', isConnected);
          if (!isConnected) {
            console.log('Printer disconnected, attempting to reconnect...');
            await BluetoothSerial.connect(this.connectedDevice.address);
            console.log('Reconnection successful');
          }
        } catch (error) {
          console.error('Error checking connection status:', error);
          // Try to reconnect anyway
          try {
            await BluetoothSerial.connect(this.connectedDevice.address);
            console.log('Reconnection attempt completed');
          } catch (reconnectError) {
            console.error('Reconnection failed:', reconnectError);
            toast.error('Printer terputus dan gagal terhubung kembali');
            return false;
          }
        }
      }

      // Improved ESC/POS commands for 58mm printers
      const commands = [];
      
      console.log('Preparing printer commands...');
      
      // Initialize printer
      commands.push(new Uint8Array([0x1B, 0x40])); // ESC @
      
      // Center align
      commands.push(new Uint8Array([0x1B, 0x61, 0x01])); // ESC a 1
      
      // Bold on for header
      commands.push(new Uint8Array([0x1B, 0x45, 0x01])); // ESC E 1
      
      // Store info
      commands.push(this.textToBytes(`${storeName}\n`));
      commands.push(this.textToBytes(`${storeLocation}\n`));
      commands.push(this.textToBytes(`${storePhone}\n\n`));
      
      // Bold off
      commands.push(new Uint8Array([0x1B, 0x45, 0x00])); // ESC E 0
      
      // Left align
      commands.push(new Uint8Array([0x1B, 0x61, 0x00])); // ESC a 0
      
      // Customer
      if (customerName) {
        commands.push(this.textToBytes(`Tuan/Bos: ${customerName}\n`));
      }
      commands.push(this.textToBytes(`--------------------------------\n`));
      
      // Transaction info
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      commands.push(this.textToBytes(`No - ${transactionId.slice(-4)}    ${hours}:${minutes}    ${year}-${month}-${day}\n`));
      commands.push(this.textToBytes(`--------------------------------\n\n`));
      
      // Items
      items.forEach(item => {
        commands.push(this.textToBytes(`${item.product.name}\n`));
        commands.push(this.textToBytes(`${item.quantity} x ${item.product.price.toLocaleString('id-ID')}`));
        commands.push(this.textToBytes(`          Rp ${(item.product.price * item.quantity).toLocaleString('id-ID')}\n\n`));
      });
      
      commands.push(this.textToBytes(`--------------------------------\n`));
      commands.push(this.textToBytes(`Total                Rp ${total.toLocaleString('id-ID')}\n`));
      commands.push(this.textToBytes(`Bayar (${paymentMethod === 'cash' ? 'Cash' : 'Transfer'})`));
      commands.push(this.textToBytes(`      Rp ${(cashAmount || total).toLocaleString('id-ID')}\n`));
      commands.push(this.textToBytes(`Kembali              Rp ${(changeAmount || 0).toLocaleString('id-ID')}\n\n`));
      
      // Center align for thank you
      commands.push(new Uint8Array([0x1B, 0x61, 0x01])); // ESC a 1
      
      commands.push(this.textToBytes(`\n\n`));
      commands.push(this.textToBytes(`Terimakasih telah berbelanja\n`));
      commands.push(this.textToBytes(`di toko kami\n`));
      commands.push(this.textToBytes(`^_^\n`));
      
      // Feed and cut
      commands.push(this.textToBytes(`\n\n\n\n`));  // Feed paper before cutting
      commands.push(new Uint8Array([0x1D, 0x56, 0x01]));  // GS V 1 - Full cut
      
      // Send each command to printer with enhanced error handling and logging
      console.log(`Sending ${commands.length} commands to printer...`);
      let successCount = 0;
      
      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        try {
          console.log(`Sending command ${i+1}/${commands.length}, size: ${cmd.length} bytes`);
          await BluetoothSerial.write(cmd);
          successCount++;
          // Add a small delay between commands to prevent buffer overflow
          if (i < commands.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } catch (error) {
          console.error(`Error sending command ${i+1}/${commands.length}:`, error);
          // Try to continue with next command
        }
      }
      
      console.log(`Successfully sent ${successCount}/${commands.length} commands`);
      
      // Alternative approach if the above doesn't work
      if (successCount < commands.length) {
        console.log('Trying alternative approach: concatenating all commands into a single buffer');
        try {
          // Calculate total buffer size
          const totalSize = commands.reduce((size, cmd) => size + cmd.length, 0);
          const combinedBuffer = new Uint8Array(totalSize);
          
          // Copy all commands into the combined buffer
          let offset = 0;
          for (const cmd of commands) {
            combinedBuffer.set(cmd, offset);
            offset += cmd.length;
          }
          
          // Send as a single write operation
          await BluetoothSerial.write(combinedBuffer);
          console.log('Successfully sent combined buffer');
        } catch (error) {
          console.error('Error sending combined buffer:', error);
        }
      }
      
      // Try final approach - send raw text if all else fails
      if (successCount < commands.length) {
        try {
          console.log('Trying raw text approach');
          const rawText = items.map(item => 
            `${item.product.name}\n${item.quantity} x ${item.product.price} = ${item.product.price * item.quantity}\n`
          ).join('\n') + `\nTotal: ${total}\n`;
          
          await BluetoothSerial.write(rawText);
          console.log('Successfully sent raw text');
        } catch (error) {
          console.error('Error sending raw text:', error);
          toast.error('Gagal mencetak struk. Silakan coba lagi.');
          return false;
        }
      }
      
      toast.success('Struk berhasil dicetak!');
      return true;
    } catch (error) {
      console.error('Failed to print receipt:', error);
      toast.error(`Gagal mencetak struk: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
  
  // Helper method to convert string to bytes
  private textToBytes(text: string): Uint8Array {
    try {
      const encoder = new TextEncoder();
      return encoder.encode(text);
    } catch (error) {
      console.error('Error converting text to bytes:', error);
      // Fallback for older browsers
      const buffer = new Uint8Array(text.length);
      for (let i = 0; i < text.length; i++) {
        buffer[i] = text.charCodeAt(i);
      }
      return buffer;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.connectedDevice && BluetoothSerial && BluetoothSerial.disconnect) {
        console.log('Disconnecting from printer:', this.connectedDevice);
        await BluetoothSerial.disconnect();
        console.log('Disconnected successfully');
        this.connectedDevice = null;
      }
    } catch (error) {
      console.error('Failed to disconnect from printer:', error);
    }
  }

  public getConnectedDevice(): PrinterDevice | null {
    return this.connectedDevice;
  }
}

export default BluetoothPrinterService.getInstance();
