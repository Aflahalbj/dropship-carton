
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

  private constructor() {}

  public static getInstance(): BluetoothPrinterService {
    if (!BluetoothPrinterService.instance) {
      BluetoothPrinterService.instance = new BluetoothPrinterService();
    }
    return BluetoothPrinterService.instance;
  }

  public async initialize(): Promise<boolean> {
    try {
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
      await this.initialize();
      
      let pairedPrinters: PrinterDevice[] = [];
      
      // Check if BluetoothSerial is available
      if (BluetoothSerial && BluetoothSerial.list) {
        // First try to get paired devices from BluetoothSerial
        const pairedDevices = await BluetoothSerial.list();
        pairedPrinters = pairedDevices.map(device => ({
          id: device.id,
          name: device.name || 'Unknown Device',
          address: device.address
        }));

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
      if (!BluetoothSerial || !BluetoothSerial.connect) {
        toast.error('Bluetooth tidak tersedia di browser');
        return false;
      }
      
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
    storeName: string = 'Toko Dropship'
  ): Promise<boolean> {
    try {
      if (!this.connectedDevice) {
        toast.error('Tidak ada printer yang terhubung');
        return false;
      }

      if (!BluetoothSerial || !BluetoothSerial.write) {
        toast.error('Bluetooth tidak tersedia di browser');
        return false;
      }

      // Format the receipt as a string
      let receipt = '\n\n';
      
      // Store info
      receipt += `${storeName}\n`;
      receipt += `--------------------------------\n`;
      receipt += `No. ${transactionId.slice(-6)}\n`;
      receipt += `${date.toLocaleString('id-ID')}\n`;
      if (customerName) {
        receipt += `Pelanggan: ${customerName}\n`;
      }
      receipt += `--------------------------------\n\n`;
      
      // Items
      receipt += `Barang      Qty   Harga    Total\n`;
      receipt += `--------------------------------\n`;
      
      items.forEach(item => {
        // Truncate product name if too long
        let name = item.product.name;
        if (name.length > 10) name = name.substring(0, 10);
        
        const price = item.product.price.toLocaleString('id-ID');
        const total = (item.product.price * item.quantity).toLocaleString('id-ID');
        
        // Format as columns
        receipt += `${name.padEnd(10)} ${item.quantity.toString().padEnd(5)} ${price.padStart(7)} ${total.padStart(8)}\n`;
      });
      
      receipt += `--------------------------------\n`;
      receipt += `TOTAL:             Rp ${total.toLocaleString('id-ID')}\n\n`;
      
      // Payment info
      receipt += `${paymentMethod === 'cash' ? 'Tunai' : 'Transfer'}\n`;
      
      if (paymentMethod === 'cash' && cashAmount !== undefined) {
        receipt += `Bayar:             Rp ${cashAmount.toLocaleString('id-ID')}\n`;
        
        if (changeAmount !== undefined && changeAmount > 0) {
          receipt += `Kembali:           Rp ${changeAmount.toLocaleString('id-ID')}\n`;
        }
      }
      
      receipt += '\n';
      receipt += `--------------------------------\n`;
      receipt += `      Terima Kasih      \n`;
      receipt += `      Atas Kunjungan Anda      \n`;
      receipt += '\n\n\n';  // Extra lines for paper cutter

      // Send to printer
      await BluetoothSerial.write(receipt);
      toast.success('Struk berhasil dicetak!');
      return true;
    } catch (error) {
      console.error('Failed to print receipt:', error);
      toast.error('Gagal mencetak struk. Silakan coba lagi.');
      return false;
    }
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
