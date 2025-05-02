
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { createPluginProxy } from '../utils/capacitorShim';

// Define the plugin interface to ensure type safety
interface BluetoothPrinterPlugin {
  initialize: () => Promise<{ value: boolean }>;
  scan: (options?: { scanDuration?: number }) => Promise<{ value: boolean, devices?: Array<{ address: string, name: string }> }>;
  connect: (options: { address: string }) => Promise<{ value: boolean }>;
  disconnect: () => Promise<{ value: boolean }>;
  print: (options: { text: string }) => Promise<{ value: boolean }>;
  getPairedDevices?: () => Promise<{ value: boolean, devices?: Array<{ address: string, name: string }> }>;
  isBluetoothEnabled?: () => Promise<{ value: boolean }>;
  enableBluetooth?: () => Promise<{ value: boolean }>;
}

// Create a proxy for the BluetoothPrinter plugin to avoid direct import issues
const BluetoothPrinter = createPluginProxy('BluetoothPrinter') as BluetoothPrinterPlugin;

export interface PrinterDevice {
  id: string;
  name: string;
  address: string;
}

class BluetoothPrinterServiceClass {
  private connectedDevice: PrinterDevice | null = null;
  private isInitialized = false;
  private lastScanTime: number = 0;
  private scanInProgress: boolean = false;
  private scanTimeoutId: any = null;

  constructor() {
    console.info('BluetoothPrinterService initialized:', {
      isNativeApp: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform()
    });
  }

  async init(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log('Bluetooth printing only works on native platforms');
        return false;
      }
      
      // Check if Bluetooth is enabled
      if (BluetoothPrinter.isBluetoothEnabled) {
        const bluetoothStatus = await BluetoothPrinter.isBluetoothEnabled();
        if (!bluetoothStatus.value) {
          console.log('Bluetooth is disabled. Attempting to enable...');
          if (BluetoothPrinter.enableBluetooth) {
            const enabled = await BluetoothPrinter.enableBluetooth();
            if (!enabled.value) {
              toast.error("Mohon aktifkan Bluetooth untuk menggunakan printer", { duration: 3000 });
              return false;
            }
          } else {
            toast.error("Mohon aktifkan Bluetooth untuk menggunakan printer", { duration: 3000 });
            return false;
          }
        }
      }
      
      const result = await BluetoothPrinter.initialize();
      this.isInitialized = result.value;
      console.log('Bluetooth printer initialized:', result);
      return result.value;
    } catch (error) {
      console.error('Failed to initialize Bluetooth printer:', error);
      toast.error("Gagal menginisialisasi printer: " + (error instanceof Error ? error.message : "Error tidak diketahui"), 
        { duration: 3000 });
      return false;
    }
  }

  async scanForPrinters(scanDuration: number = 20000): Promise<PrinterDevice[]> {
    try {
      // Cancel any existing scan
      this.cancelScan();
      
      // Initialize first
      await this.init();
      
      // Check if a scan was recently performed (within last 2 seconds)
      const currentTime = Date.now();
      if (currentTime - this.lastScanTime < 2000 && !this.scanInProgress) {
        console.log('Scan requested too soon after previous scan, trying to get paired devices instead');
        // Try to get paired devices instead of scanning again
        if (BluetoothPrinter.getPairedDevices) {
          try {
            const pairedResult = await BluetoothPrinter.getPairedDevices();
            if (pairedResult.value && Array.isArray(pairedResult.devices) && pairedResult.devices.length > 0) {
              const devices: PrinterDevice[] = pairedResult.devices.map(device => ({
                id: device.address,
                name: device.name || 'Unknown Device',
                address: device.address
              }));
              console.log('Found paired devices:', devices);
              return devices;
            }
          } catch (err) {
            console.warn('Failed to get paired devices:', err);
          }
        }
      }
      
      this.scanInProgress = true;
      console.log(`Scanning for Bluetooth printers with ${scanDuration}ms duration...`);
      toast.loading("Memindai printer Bluetooth...", { id: "scanning-printers" });
      
      // Create a promise that will be resolved with the scan results
      const scanPromise = new Promise<PrinterDevice[]>(async (resolve) => {
        try {
          const result = await BluetoothPrinter.scan({
            scanDuration: scanDuration
          });
          
          this.lastScanTime = Date.now();
          this.scanInProgress = false;
          toast.dismiss("scanning-printers");
          
          if (!result.value) {
            console.log('No printers found or scan failed');
            toast.error("Tidak ada printer yang ditemukan. Pastikan printer Bluetooth dinyalakan dan dalam mode pairing.");
            resolve([]);
            return;
          }
          
          const devices: PrinterDevice[] = Array.isArray(result.devices) ? result.devices.map(device => ({
            id: device.address,
            name: device.name || 'Unknown Device',
            address: device.address
          })) : [];
          
          console.log('Found printers:', devices);
          
          if (devices.length === 0) {
            toast.error("Tidak ada printer yang ditemukan. Pastikan printer dalam mode pairing dan dekat dengan perangkat Anda.");
          }
          
          resolve(devices);
        } catch (error) {
          console.error('Error scanning for printers:', error);
          this.scanInProgress = false;
          toast.dismiss("scanning-printers");
          toast.error("Gagal memindai printer: " + (error instanceof Error ? error.message : "Error tidak diketahui"));
          resolve([]);
        }
      });
      
      // Set a timeout to cancel the scan if it takes too long
      this.scanTimeoutId = setTimeout(() => {
        if (this.scanInProgress) {
          this.scanInProgress = false;
          toast.dismiss("scanning-printers");
          toast.error("Waktu memindai terlalu lama. Printer mungkin tidak dalam jangkauan atau mode pairing.");
        }
      }, scanDuration + 5000); // Give a little extra time beyond the scan duration
      
      return scanPromise;
    } catch (error) {
      console.error('Error scanning for printers:', error);
      this.scanInProgress = false;
      toast.dismiss("scanning-printers");
      toast.error("Gagal memindai printer: " + (error instanceof Error ? error.message : "Error tidak diketahui"));
      throw error;
    }
  }
  
  cancelScan() {
    if (this.scanTimeoutId) {
      clearTimeout(this.scanTimeoutId);
      this.scanTimeoutId = null;
    }
    
    if (this.scanInProgress) {
      this.scanInProgress = false;
      toast.dismiss("scanning-printers");
    }
  }

  async connectToPrinter(printer: PrinterDevice): Promise<boolean> {
    try {
      await this.init();
      console.log('Connecting to printer:', printer);
      toast.loading(`Menghubungkan ke printer: ${printer.name}...`, { id: "connecting-printer" });
      
      const result = await BluetoothPrinter.connect({
        address: printer.address
      });
      
      toast.dismiss("connecting-printer");
      
      if (result.value) {
        this.connectedDevice = printer;
        console.log('Successfully connected to printer');
        toast.success(`Terhubung ke printer: ${printer.name}`);
        return true;
      } else {
        console.log('Failed to connect to printer');
        toast.error(`Gagal terhubung ke printer: ${printer.name}. Pastikan printer dinyalakan dan dekat dengan perangkat Anda.`);
        return false;
      }
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      toast.dismiss("connecting-printer");
      toast.error(`Gagal terhubung ke printer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async printText(text: string): Promise<boolean> {
    try {
      if (!this.connectedDevice) {
        console.log('No printer connected');
        toast.error("Tidak ada printer yang terhubung. Silakan hubungkan printer terlebih dahulu.");
        return false;
      }
      
      await this.init();
      console.log('Printing text:', text.substring(0, 50) + '...');
      toast.loading("Mencetak...", { id: "printing" });
      
      const result = await BluetoothPrinter.print({
        text: text
      });
      
      toast.dismiss("printing");
      
      if (result.value) {
        toast.success("Berhasil mencetak!");
      } else {
        toast.error("Gagal mencetak. Pastikan printer masih terhubung dan dinyalakan.");
      }
      
      return result.value;
    } catch (error) {
      console.error('Failed to print:', error);
      toast.dismiss("printing");
      toast.error(`Gagal mencetak: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  getConnectedDevice(): PrinterDevice | null {
    return this.connectedDevice;
  }

  async disconnect(): Promise<boolean> {
    try {
      if (!this.connectedDevice) return true;
      
      await this.init();
      const result = await BluetoothPrinter.disconnect();
      
      if (result.value) {
        this.connectedDevice = null;
        toast.success("Terputus dari printer");
      }
      
      return result.value;
    } catch (error) {
      console.error('Failed to disconnect from printer:', error);
      throw error;
    }
  }
  
  // Helper method to provide troubleshooting information
  getTroubleshootingInfo(): string[] {
    return [
      "1. Pastikan printer thermal Bluetooth Anda kompatibel dengan ESC/POS commands.",
      "2. Printer harus dalam mode pairing (biasanya dengan menekan tombol pada printer).",
      "3. Pastikan printer cukup dekat dengan perangkat Android Anda (dalam jarak 10 meter).",
      "4. Pastikan Anda telah memberikan izin lokasi pada aplikasi (diperlukan untuk memindai Bluetooth).",
      "5. Coba matikan dan nyalakan kembali printer dan Bluetooth pada perangkat Anda.",
      "6. Jika pernah terhubung sebelumnya, coba hapus pairing yang ada di pengaturan Bluetooth Android.",
    ];
  }
}

const BluetoothPrinterService = new BluetoothPrinterServiceClass();
export default BluetoothPrinterService;
