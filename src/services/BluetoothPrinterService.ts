
import { toast } from "sonner";
import { CartItem } from '../context/AppContext';

// Import with dynamic checks to prevent build errors
let BluetoothSerial: any = {};
let BleClient: any = {};

// Only import these modules in native environments
// Use typeof to check if we're in a browser or native environment
if (typeof window !== 'undefined' && window.cordova) {
  try {
    // For Cordova/native environments
    import('@awesome-cordova-plugins/bluetooth-serial').then(module => {
      BluetoothSerial = module.BluetoothSerial;
    }).catch(err => console.error('Failed to load BluetoothSerial:', err));
    
    import('@capacitor-community/bluetooth-le').then(module => {
      BleClient = module.BleClient;
    }).catch(err => console.error('Failed to load BleClient:', err));
  } catch (e) {
    console.warn('Bluetooth modules not available in this environment');
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

  private constructor() {
    this.isCordovaAvailable = typeof window !== 'undefined' && !!window.cordova;
  }

  public static getInstance(): BluetoothPrinterService {
    if (!BluetoothPrinterService.instance) {
      BluetoothPrinterService.instance = new BluetoothPrinterService();
    }
    return BluetoothPrinterService.instance;
  }

  public async initialize(): Promise<boolean> {
    try {
      if (!this.isCordovaAvailable) {
        console.warn('Bluetooth features are only available in native apps');
        return false;
      }
      
      // Check if we're in a native environment where BleClient is available
      if (!this.isInitialized && BleClient && BleClient.initialize) {
        await BleClient.initialize();
        this.isInitialized = true;
      }
      return true;
    } catch (error) {
      console.error('Failed to initialize Bluetooth:', error);
      return false;
    }
  }

  public async scanForPrinters(): Promise<PrinterDevice[]> {
    try {
      if (!this.isCordovaAvailable) {
        toast.warning('Bluetooth tidak tersedia di browser. Gunakan aplikasi Android untuk fitur ini.');
        return [];
      }
      
      await this.initialize();
      
      let pairedPrinters: PrinterDevice[] = [];
      
      // Check if BluetoothSerial is available
      if (BluetoothSerial && BluetoothSerial.list) {
        try {
          // First try to get paired devices from BluetoothSerial
          const pairedDevices = await BluetoothSerial.list();
          
          if (Array.isArray(pairedDevices)) {
            pairedPrinters = pairedDevices.map(device => ({
              id: device.id,
              name: device.name || 'Unknown Device',
              address: device.address
            }));
          } else {
            console.error('BluetoothSerial.list() did not return an array:', pairedDevices);
          }

          // Then try to scan for new devices using BLE if available
          if (BleClient && BleClient.requestLEScan) {
            await BleClient.requestLEScan(
              { services: [] },
              (result) => {
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
                  }
                }
              }
            );

            // Wait a bit to collect devices
            await new Promise(resolve => setTimeout(resolve, 3000));
            await BleClient.stopLEScan();
          }
        } catch (error) {
          console.error('Error scanning for Bluetooth devices:', error);
          toast.error('Gagal memindai perangkat Bluetooth');
        }
      } else {
        // If running in a browser or environment without Bluetooth
        console.warn('Bluetooth scanning not available in this environment');
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
      if (!this.isCordovaAvailable) {
        toast.error('Bluetooth tidak tersedia di browser');
        return false;
      }
      
      if (!BluetoothSerial || !BluetoothSerial.connect) {
        toast.error('API Bluetooth tidak tersedia di perangkat ini');
        return false;
      }
      
      // Disconnect any existing connection first
      await this.disconnect();
      
      // Connect to the new device
      await BluetoothSerial.connect(device.address);
      
      this.connectedDevice = device;
      toast.success(`Terhubung ke printer: ${device.name}`);
      return true;
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      toast.error('Gagal terhubung ke printer. Silakan coba lagi.');
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
      if (!this.isCordovaAvailable) {
        toast.error('Fitur cetak hanya tersedia di aplikasi Android');
        return false;
      }
      
      if (!this.connectedDevice) {
        toast.error('Tidak ada printer yang terhubung');
        return false;
      }

      if (!BluetoothSerial || !BluetoothSerial.write) {
        toast.error('API Bluetooth tidak tersedia di perangkat ini');
        return false;
      }

      // Improved ESC/POS commands for 58mm printers
      const commands = [];
      
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
      
      // Send each command to printer
      for (const cmd of commands) {
        await BluetoothSerial.write(cmd);
      }
      
      toast.success('Struk berhasil dicetak!');
      return true;
    } catch (error) {
      console.error('Failed to print receipt:', error);
      toast.error('Gagal mencetak struk. Silakan coba lagi.');
      return false;
    }
  }
  
  // Helper method to convert string to bytes
  private textToBytes(text: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(text);
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.connectedDevice && BluetoothSerial && BluetoothSerial.disconnect) {
        await BluetoothSerial.disconnect();
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
